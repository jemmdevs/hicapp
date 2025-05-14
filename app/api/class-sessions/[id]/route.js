import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import ClassSession from '@/models/ClassSession';
import Class from '@/models/Class';
import crypto from 'crypto';

// Función para generar un token único para el QR
const generateQRToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

// GET - Obtener una sesión específica
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const classSession = await ClassSession.findById(id)
      .populate('class', 'name teacher students')
      .populate('teacher', 'name email');

    if (!classSession) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    const classData = classSession.class;
    const isTeacher = session.user.role === 'teacher' && 
                     classData.teacher.toString() === session.user.id;
    const isStudent = session.user.role === 'student' && 
                     classData.students.some(s => s.toString() === session.user.id);

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ message: 'No tiene permisos para ver esta sesión' }, { status: 403 });
    }

    // Si es un estudiante, no enviar el código QR
    if (isStudent) {
      // Verificar que el QR no haya expirado
      const now = new Date();
      if (classSession.status !== 'active' || 
         (classSession.qrExpiration && now > new Date(classSession.qrExpiration))) {
        classSession.qrCode = null;
      }
    }

    return NextResponse.json(classSession);
  } catch (error) {
    console.error('Error retrieving class session:', error);
    return NextResponse.json({ message: 'Error al obtener la sesión de clase' }, { status: 500 });
  }
}

// PUT - Actualizar una sesión
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden actualizar sesiones' }, { status: 403 });
    }

    await connectDB();
    const { id } = params;
    const data = await request.json();

    // Verificar que la sesión existe
    const classSession = await ClassSession.findById(id)
      .populate('class');

    if (!classSession) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    // Verificar que el profesor es dueño de la clase
    if (classSession.class.teacher.toString() !== session.user.id) {
      return NextResponse.json({ message: 'No tiene permisos para modificar esta sesión' }, { status: 403 });
    }

    // Actualizar campos
    if (data.title) classSession.title = data.title;
    if (data.date) classSession.date = new Date(data.date);
    if (data.startTime) classSession.startTime = new Date(data.startTime);
    if (data.endTime) classSession.endTime = new Date(data.endTime);
    if (data.status) classSession.status = data.status;
    if (data.notes) classSession.notes = data.notes;
    if (data.location) classSession.location = data.location;

    // Regenerar QR si se solicita o si se activa la sesión
    if (data.regenerateQR || (data.status === 'active' && classSession.status !== 'active')) {
      classSession.qrCode = generateQRToken();
      
      // Por defecto, el QR es válido por 2 horas
      const now = new Date();
      const qrExpiration = new Date(now);
      qrExpiration.setHours(qrExpiration.getHours() + 2);
      
      classSession.qrExpiration = data.qrExpiration || qrExpiration;
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

// DELETE - Eliminar una sesión
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden eliminar sesiones' }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    // Verificar que la sesión existe
    const classSession = await ClassSession.findById(id)
      .populate('class');

    if (!classSession) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    // Verificar que el profesor es dueño de la clase
    if (classSession.class.teacher.toString() !== session.user.id) {
      return NextResponse.json({ message: 'No tiene permisos para eliminar esta sesión' }, { status: 403 });
    }

    await ClassSession.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Sesión eliminada con éxito'
    });
  } catch (error) {
    console.error('Error deleting class session:', error);
    return NextResponse.json({ message: 'Error al eliminar la sesión de clase' }, { status: 500 });
  }
} 