import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Class from '@/models/Class';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de clase no válido' },
        { status: 400 }
      );
    }

    const classData = await Class.findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    // Check if user has access to this class
    const isTeacher = session.user.id === classData.teacher._id.toString();
    const isStudent = classData.students.some(student => 
      student._id.toString() === session.user.id
    );

    if (!isTeacher && !isStudent) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta clase' },
        { status: 403 }
      );
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a class (only for teachers)
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'No autorizado. Solo los profesores pueden eliminar clases.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de clase no válido' },
        { status: 400 }
      );
    }

    // Find the class and check if the current user is the teacher
    const classData = await Class.findById(id);

    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    if (classData.teacher.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Solo el profesor que creó esta clase puede eliminarla' },
        { status: 403 }
      );
    }

    // Delete the class
    await Class.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Clase eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 