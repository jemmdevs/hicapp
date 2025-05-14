import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function DELETE(req, { params }) {
  try {
    const { id, studentId } = params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Only teachers can remove students
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Solo los profesores pueden remover estudiantes de una clase' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Validate the ID formats
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { message: 'ID de clase o estudiante no válido' },
        { status: 400 }
      );
    }

    // Check if the class exists and the current teacher owns it
    const classData = await Class.findById(id);
    
    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    if (classData.teacher.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Solo el profesor de la clase puede remover estudiantes' },
        { status: 403 }
      );
    }

    // Check if the student is in the class
    if (!classData.students.includes(studentId)) {
      return NextResponse.json(
        { message: 'El estudiante no está inscrito en esta clase' },
        { status: 400 }
      );
    }

    // Remove student from class
    classData.students = classData.students.filter(
      student => student.toString() !== studentId
    );
    await classData.save();

    // Remove class from student's classes list
    await User.findByIdAndUpdate(
      studentId,
      { $pull: { classes: id } }
    );

    return NextResponse.json(
      { message: 'Estudiante removido de la clase exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing student from class:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 