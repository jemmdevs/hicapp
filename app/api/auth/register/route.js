import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password, role = 'student' } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Por favor proporciona nombre, email y contraseña' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'El usuario con este email ya existe' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role, // By default, new registrations are students unless specified
    });

    // Don't return the password
    const userWithoutPassword = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 