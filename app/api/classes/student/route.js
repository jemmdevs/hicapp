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

    await connectToDatabase();

    // Get all classes where the current user is a student
    const classes = await Class.find({ students: session.user.id })
      .populate('teacher', 'name email')
      .sort({ name: 1 });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 