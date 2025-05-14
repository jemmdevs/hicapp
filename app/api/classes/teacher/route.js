import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import Class from '@/models/Class';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Solo los profesores pueden acceder a esta ruta' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Get all classes where the current user is the teacher
    const classes = await Class.find({ teacher: session.user.id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 