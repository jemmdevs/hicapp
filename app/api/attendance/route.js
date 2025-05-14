import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';
import ClassSession from '@/models/ClassSession';
import User from '@/models/User';

// GET - Obtener registros de asistencia
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = {};

    if (classId) query.class = classId;
    if (sessionId) query.session = sessionId;
    if (studentId) query.student = studentId;

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Para profesores, verificar que tienen acceso a la clase
    if (session.user.role === 'teacher') {
      if (classId) {
        const hasAccess = await Class.exists({
          _id: classId,
          teacher: session.user.id
        });
        
        if (!hasAccess) {
          return NextResponse.json({ message: 'No tiene permisos para ver los registros de esta clase' }, { status: 403 });
        }
      } else {
        // Si no se especifica una clase, limitar a las clases del profesor
        const teacherClasses = await Class.find({ teacher: session.user.id }).select('_id');
        query.class = { $in: teacherClasses.map(c => c._id) };
      }
    }

    // Para estudiantes, limitar a sus propios registros
    if (session.user.role === 'student') {
      query.student = session.user.id;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'name email')
      .populate('class', 'name')
      .populate('session', 'title date')
      .sort({ date: -1 });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Error retrieving attendance records:', error);
    return NextResponse.json({ message: 'Error al obtener los registros de asistencia' }, { status: 500 });
  }
}

// POST - Registrar asistencia (estudiante escanea el QR del profesor)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    if (!data.sessionId || !data.qrCode) {
      return NextResponse.json({ message: 'Datos incompletos. Se requiere ID de sesión y código QR' }, { status: 400 });
    }

    // Obtener la sesión de clase
    const classSession = await ClassSession.findById(data.sessionId)
      .populate({
        path: 'class',
        select: 'name students teacher',
        populate: {
          path: 'students',
          select: 'name email'
        }
      });

    if (!classSession) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    // Verificar que la sesión está activa y el QR no ha expirado
    const now = new Date();
    if (classSession.status !== 'active') {
      return NextResponse.json({ message: 'La sesión no está activa' }, { status: 400 });
    }
    
    if (classSession.qrExpiration && now > new Date(classSession.qrExpiration)) {
      return NextResponse.json({ message: 'El código QR ha expirado' }, { status: 400 });
    }

    // Verificar que el código QR coincide
    if (classSession.qrCode !== data.qrCode) {
      return NextResponse.json({ message: 'Código QR inválido' }, { status: 400 });
    }

    // Si es un estudiante, verificar que está inscrito en la clase
    if (session.user.role === 'student') {
      const classObj = classSession.class;
      const isEnrolled = classObj.students.some(s => 
        s._id.toString() === session.user.id
      );

      if (!isEnrolled) {
        return NextResponse.json({ message: 'No está inscrito en esta clase' }, { status: 403 });
      }

      // Verificar si ya registró asistencia para esta sesión
      const existingAttendance = await Attendance.findOne({
        session: classSession._id,
        student: session.user.id
      });

      if (existingAttendance) {
        return NextResponse.json({ message: 'Ya ha registrado su asistencia para esta sesión' }, { status: 400 });
      }

      // Registrar asistencia
      const attendance = new Attendance({
        class: classSession.class._id,
        session: classSession._id,
        student: session.user.id,
        date: now,
        present: true,
        scanTime: now,
        location: data.location || null
      });

      await attendance.save();

      return NextResponse.json({ 
        message: 'Asistencia registrada con éxito',
        attendance: {
          ...attendance.toObject(),
          student: {
            _id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        }
      });
    } 
    // Si es un profesor, está registrando a un estudiante manualmente
    else if (session.user.role === 'teacher') {
      // Verificar que el profesor es dueño de la clase
      if (classSession.class.teacher.toString() !== session.user.id) {
        return NextResponse.json({ message: 'No tiene permisos para registrar asistencia en esta clase' }, { status: 403 });
      }

      if (!data.studentId) {
        return NextResponse.json({ message: 'Se requiere ID de estudiante' }, { status: 400 });
      }

      // Verificar que el estudiante está inscrito
      const classObj = classSession.class;
      const isEnrolled = classObj.students.some(s => 
        s._id.toString() === data.studentId
      );

      if (!isEnrolled) {
        return NextResponse.json({ message: 'El estudiante no está inscrito en esta clase' }, { status: 400 });
      }

      // Verificar si ya registró asistencia
      const existingAttendance = await Attendance.findOne({
        session: classSession._id,
        student: data.studentId
      });

      if (existingAttendance) {
        return NextResponse.json({ message: 'El estudiante ya ha registrado asistencia para esta sesión' }, { status: 400 });
      }

      // Registrar asistencia
      const attendance = new Attendance({
        class: classSession.class._id,
        session: classSession._id,
        student: data.studentId,
        date: now,
        present: true,
        scanTime: now,
        location: data.location || null
      });

      await attendance.save();

      // Obtener datos del estudiante
      const student = await User.findById(data.studentId).select('name email');

      return NextResponse.json({ 
        message: 'Asistencia registrada con éxito',
        attendance: {
          ...attendance.toObject(),
          student: student
        }
      });
    }
  } catch (error) {
    console.error('Error registering attendance:', error);
    return NextResponse.json({ message: 'Error al registrar la asistencia' }, { status: 500 });
  }
}