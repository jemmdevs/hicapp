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

    const classes = await Class.find({}).populate('teacher', 'name email');

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'No autorizado. Solo los profesores pueden crear clases.' },
        { status: 401 }
      );
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'El nombre de la clase es obligatorio' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate a unique class code
    const code = generateRandomCode(6);

    const newClass = await Class.create({
      name,
      description,
      teacher: session.user.id,
      code,
      students: [],
    });

    return NextResponse.json(
      {
        message: 'Clase creada exitosamente',
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Helper function to generate a random alphanumeric code
function generateRandomCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
} 