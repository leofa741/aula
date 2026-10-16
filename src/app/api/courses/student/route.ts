import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';



export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscamos cursos que estén 'activos' y que incluyan al alumno en el array 'students'
    const courses = await Course.find({
      status: 'activo',
      students: session.user.id
    })
    .populate('professor', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, courses }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cursos del alumno:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}