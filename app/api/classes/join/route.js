import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Class from '@/models/Class';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'student') {
      return NextResponse.json(
        { message: 'Solo los estudiantes pueden unirse a clases' },
        { status: 403 }
      );
    }

    const { classId, code } = await req.json();

    if (!classId) {
      return NextResponse.json(
        { message: 'El ID de la clase es obligatorio' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json(
        { message: 'ID de clase no válido' },
        { status: 400 }
      );
    }

    // Find the class
    const classData = await Class.findById(classId);

    if (!classData) {
      return NextResponse.json(
        { message: 'Clase no encontrada' },
        { status: 404 }
      );
    }

    // If code is provided, verify it
    if (code && code !== classData.code) {
      return NextResponse.json(
        { message: 'Código de clase incorrecto' },
        { status: 400 }
      );
    }

    // Check if the student is already in the class
    if (classData.students.includes(session.user.id)) {
      return NextResponse.json(
        { message: 'Ya estás inscrito en esta clase' },
        { status: 400 }
      );
    }

    // Add student to the class
    classData.students.push(session.user.id);
    await classData.save();

    // Add class to the student's classes list
    await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { classes: classId } }
    );

    return NextResponse.json(
      { message: 'Te has unido a la clase exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 