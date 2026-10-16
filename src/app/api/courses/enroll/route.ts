import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';


// ✅ POST: Inscribir alumno a un curso
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo alumnos pueden inscribirse a sí mismos
    if (session.user.role !== 'alumno') {
      return NextResponse.json({ error: 'Solo los alumnos pueden inscribirse' }, { status: 403 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso es requerido' }, { status: 400 });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    if (course.status !== 'activo') {
      return NextResponse.json({ error: 'Este curso no está disponible para inscripción' }, { status: 400 });
    }

    // Verificar si ya está inscrito
    const studentId = session.user.id;
    if (course.students.includes(studentId)) {
      return NextResponse.json({ error: 'Ya estás inscrito en este curso' }, { status: 400 });
    }

    // Agregar alumno al array de students
    course.students.push(studentId);
    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Te has inscrito correctamente al curso',
      course: { _id: course._id, title: course.title }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al inscribir al curso:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ✅ DELETE: Desinscribir alumno de un curso
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'ID del curso es requerido' }, { status: 400 });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Solo admin/profesor pueden desinscribir a otros, o el alumno a sí mismo
    const studentId = session.user.id;
    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);
    const isSelf = session.user.role === 'alumno';

    if (!isOwner && !isAdmin && !isSelf) {
      return NextResponse.json({ error: 'No tienes permiso para realizar esta acción' }, { status: 403 });
    }

    // Remover alumno del array
    course.students = course.students.filter((id: any) => id.toString() !== studentId);
    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Te has desinscrito del curso correctamente' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al desinscribir del curso:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}