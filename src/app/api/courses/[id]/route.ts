// 📁 app/api/courses/[id]/route.ts

import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';
import { NextRequest, NextResponse } from 'next/server';
       // Ajusta la ruta a tu modelo

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await connectDB();
    
    // ✅ CLAVE: .populate() trae los datos reales de los alumnos (nombre, email)
    const course = await Course.findById((await params).id)
      .populate('students', 'name lastName email')
      .populate('professor', 'name lastName email');

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Devolvemos el curso directamente (sin envolverlo en { course: ... })
    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener el curso:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}