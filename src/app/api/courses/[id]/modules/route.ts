import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';



// ✅ POST: Agregar un módulo/contenido a un curso
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = (await params).id;
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Validar que sea el profesor del curso o un admin
    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, content, type } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'El título y el contenido son obligatorios' }, { status: 400 });
    }

    // Calcular el siguiente orden (order)
    const nextOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map((m: any) => m.order)) + 1 
      : 1;

    // Agregar el nuevo módulo
    course.modules.push({
      title,
      description: description || '',
      content,
      type: type || 'texto', // 'texto', 'video', 'pdf', 'enlace'
      order: nextOrder
    });

    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Módulo agregado correctamente',
      modules: course.modules 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al agregar módulo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ✅ GET: Obtener los módulos de un curso
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const courseId = (await params).id;
    
    const course = await Course.findById(courseId).select('modules title status');
    
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Ordenar módulos por el campo 'order'
    const sortedModules = course.modules.sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json({ success: true, modules: sortedModules, courseTitle: course.title }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener módulos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}