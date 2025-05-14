import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';
import ClassSession from '@/models/ClassSession';

// GET - Obtener un registro de asistencia específico
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const attendance = await Attendance.findById(id)
      .populate('student', 'name email')
      .populate('class', 'name teacher')
      .populate('session', 'title date startTime endTime');

    if (!attendance) {
      return NextResponse.json({ message: 'Registro de asistencia no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    const isTeacher = session.user.role === 'teacher' && 
                      attendance.class.teacher.toString() === session.user.id;
    const isStudentOwner = session.user.role === 'student' && 
                      attendance.student._id.toString() === session.user.id;

    if (!isTeacher && !isStudentOwner) {
      return NextResponse.json({ message: 'No tiene permisos para ver este registro' }, { status: 403 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error retrieving attendance record:', error);
    return NextResponse.json({ message: 'Error al obtener el registro de asistencia' }, { status: 500 });
  }
}

// PUT - Actualizar un registro de asistencia (solo profesores)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden actualizar registros de asistencia' }, { status: 403 });
    }

    await connectDB();
    const { id } = params;
    const data = await request.json();

    const attendance = await Attendance.findById(id)
      .populate('class', 'teacher');

    if (!attendance) {
      return NextResponse.json({ message: 'Registro de asistencia no encontrado' }, { status: 404 });
    }

    // Verificar que el profesor es dueño de la clase
    if (attendance.class.teacher.toString() !== session.user.id) {
      return NextResponse.json({ message: 'No tiene permisos para modificar este registro' }, { status: 403 });
    }

    // Actualizar campos (solo permitimos cambiar si estuvo presente o no)
    if (typeof data.present === 'boolean') {
      attendance.present = data.present;
    }

    if (data.notes) {
      attendance.notes = data.notes;
    }

    await attendance.save();

    return NextResponse.json({ 
      message: 'Registro de asistencia actualizado con éxito',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json({ message: 'Error al actualizar el registro de asistencia' }, { status: 500 });
  }
}

// DELETE - Eliminar un registro de asistencia (solo profesores)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Solo los profesores pueden eliminar registros de asistencia' }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    const attendance = await Attendance.findById(id)
      .populate('class', 'teacher');

    if (!attendance) {
      return NextResponse.json({ message: 'Registro de asistencia no encontrado' }, { status: 404 });
    }

    // Verificar que el profesor es dueño de la clase
    if (attendance.class.teacher.toString() !== session.user.id) {
      return NextResponse.json({ message: 'No tiene permisos para eliminar este registro' }, { status: 403 });
    }

    await Attendance.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Registro de asistencia eliminado con éxito'
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json({ message: 'Error al eliminar el registro de asistencia' }, { status: 500 });
  }
} 