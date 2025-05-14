import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';
import User from '@/models/User';
import mongoose from 'mongoose';
import { format } from 'date-fns';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Only teachers can register attendance through this endpoint
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Solo los profesores pueden registrar asistencia' },
        { status: 403 }
      );
    }

    const { classId, studentId, date = new Date(), present = true } = await req.json();

    if (!classId || !studentId) {
      return NextResponse.json(
        { message: 'El ID de la clase y el ID del estudiante son obligatorios' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate the ID formats
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { message: 'ID de clase o estudiante no válido' },
        { status: 400 }
      );
    }

    // Check if the class exists and the current teacher owns it
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    if (classData.teacher.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Solo el profesor de la clase puede registrar asistencia' },
        { status: 403 }
      );
    }

    // Check if the student exists and is enrolled in the class
    const student = await User.findById(studentId);
    
    if (!student) {
      return NextResponse.json(
        { message: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    if (!classData.students.includes(studentId)) {
      return NextResponse.json(
        { message: 'El estudiante no está inscrito en esta clase' },
        { status: 400 }
      );
    }

    // Create the Date object to use for tracking (just the date, not time)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already registered for today
    const existingAttendance = await Attendance.findOne({
      class: classId,
      student: studentId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.present = present;
      await existingAttendance.save();

      return NextResponse.json(
        { 
          message: 'Asistencia actualizada exitosamente',
          attendance: existingAttendance
        },
        { status: 200 }
      );
    } else {
      // Create new attendance record
      const newAttendance = await Attendance.create({
        class: classId,
        student: studentId,
        date: attendanceDate,
        present
      });

      return NextResponse.json(
        { 
          message: 'Asistencia registrada exitosamente',
          attendance: newAttendance
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error registering attendance:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!classId) {
      return NextResponse.json(
        { message: 'El ID de la clase es obligatorio' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate the class ID format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json(
        { message: 'ID de clase no válido' },
        { status: 400 }
      );
    }

    // Check if the class exists
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    // Check permissions: teachers can view all attendance, students only their own
    const isTeacher = session.user.role === 'teacher' && classData.teacher.toString() === session.user.id;
    const isEnrolledStudent = session.user.role === 'student' && classData.students.includes(session.user.id);

    if (!isTeacher && !isEnrolledStudent) {
      return NextResponse.json(
        { message: 'No tienes permisos para ver la asistencia de esta clase' },
        { status: 403 }
      );
    }

    // Build query
    let query = { class: classId };

    // If student is requesting, show only their own attendance
    if (isEnrolledStudent) {
      query.student = session.user.id;
    } 
    // If teacher is requesting for specific student
    else if (isTeacher && studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.student = studentId;
    }

    // Add date filter if provided
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      if (!query.date) query.date = {};
      query.date.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      if (!query.date) query.date = {};
      query.date.$lte = end;
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'name email')
      .sort({ date: -1 });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}