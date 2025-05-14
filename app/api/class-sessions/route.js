import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import ClassSession from '@/models/ClassSession';
import Class from '@/models/Class';
import User from '@/models/User';
import crypto from 'crypto';

// Función para generar un token único para el QR
const generateQRToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// GET - Obtener todas las sesiones o filtrar por clase
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const query = {};

    if (classId) query.class = classId;
    if (status) query.status = status;

    // Para profesores, limitamos a sus clases
    if (session.user.role === 'teacher') {
      const teacherClasses = await Class.find({ teacher: session.user.id }).select('_id');
      const teacherClassIds = teacherClasses.map(c => c._id);
      
      if (classId) {
        // Si el profesor está solicitando una clase específica, verificamos que le pertenezca
        if (!teacherClassIds.some(id => id.toString() === classId)) {
          return NextResponse.json({ message: 'No tiene permisos para ver esta clase' }, { status: 403 });
        }
      } else {
        // Si no especificó una clase, limitamos a todas sus clases
        query.class = { $in: teacherClassIds };
      }
    }

    // Para estudiantes, limitamos a las clases en las que están inscritos
    if (session.user.role === 'student') {
      const studentClasses = await Class.find({ 
        students: { $elemMatch: { $eq: session.user.id } }
      }).select('_id');
      const studentClassIds = studentClasses.map(c => c._id);
      
      if (classId) {
        if (!studentClassIds.some(id => id.toString() === classId)) {
          return NextResponse.json({ message: 'No está inscrito en esta clase' }, { status: 403 });
        }
      } else {
        query.class = { $in: studentClassIds };
      }
    }

    const classSessions = await ClassSession.find(query)
      .populate('class', 'name')
      .populate('teacher', 'name')
      .sort({ startTime: -1 });

    return NextResponse.json(classSessions);
  } catch (error) {
    console.error('Error retrieving class sessions:', error);
    return NextResponse.json({ message: 'Error al obtener las sesiones de clase' }, { status: 500 });
  }
}

// POST - Crear una nueva sesión de clase
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden crear sesiones' }, { status: 403 });
    }

    await connectDB();
    const data = await request.json();

    // Verificar que la clase existe y le pertenece al profesor
    const classObj = await Class.findOne({ 
      _id: data.classId,
      teacher: session.user.id
    });

    if (!classObj) {
      return NextResponse.json({ message: 'Clase no encontrada o no tiene permisos' }, { status: 404 });
    }

    // Generar un token único para el QR
    const qrToken = generateQRToken();
    
    // Calcular la fecha de expiración del QR (por defecto 2 horas desde el inicio)
    const startTime = new Date(data.startTime || new Date());
    const qrExpiration = new Date(startTime);
    qrExpiration.setHours(qrExpiration.getHours() + 2); // 2 horas de validez por defecto

    const newSession = new ClassSession({
      class: data.classId,
      teacher: session.user.id,
      title: data.title,
      date: data.date || new Date(),
      startTime: startTime,
      endTime: data.endTime,
      status: data.status || 'scheduled',
      qrCode: qrToken,
      qrExpiration: qrExpiration,
      location: data.location,
      notes: data.notes
    });

    await newSession.save();

    return NextResponse.json({ 
      message: 'Sesión creada con éxito',
      session: newSession
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating class session:', error);
    return NextResponse.json({ message: 'Error al crear la sesión de clase' }, { status: 500 });
  }
}

// PUT - Actualizar el estado de una sesión (iniciar, finalizar, cancelar)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden actualizar sesiones' }, { status: 403 });
    }

    await connectDB();
    const data = await request.json();
    
    if (!data.sessionId) {
      return NextResponse.json({ message: 'ID de sesión requerido' }, { status: 400 });
    }

    // Verificar que la sesión existe y le pertenece al profesor
    const classSession = await ClassSession.findById(data.sessionId)
      .populate('class');

    if (!classSession) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    if (classSession.class.teacher.toString() !== session.user.id) {
      return NextResponse.json({ message: 'No tiene permisos para modificar esta sesión' }, { status: 403 });
    }

    // Actualizar campos
    if (data.status) classSession.status = data.status;
    if (data.title) classSession.title = data.title;
    if (data.notes) classSession.notes = data.notes;
    
    // Si estamos activando la sesión, generar un nuevo código QR
    if (data.status === 'active') {
      classSession.qrCode = generateQRToken();
      
      // Establecer la expiración del QR (2 horas desde ahora)
      const now = new Date();
      const qrExpiration = new Date(now);
      qrExpiration.setHours(qrExpiration.getHours() + 2);
      
      classSession.qrExpiration = qrExpiration;
    }
    
    // Si estamos terminando la sesión, registrar la hora de finalización
    if (data.status === 'ended' && !classSession.endTime) {
      classSession.endTime = new Date();
    }

    await classSession.save();

    return NextResponse.json({ 
      message: 'Sesión actualizada con éxito',
      session: classSession
    });
  } catch (error) {
    console.error('Error updating class session:', error);
    return NextResponse.json({ message: 'Error al actualizar la sesión de clase' }, { status: 500 });
  }
} 