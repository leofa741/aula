import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';

// ✅ PUT: Editar un módulo específico
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: courseId, moduleId } = await params;
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

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

    // Buscar el módulo por _id o por order (funciona tenga o no _id)
    const module = course.modules.find((m: any) => 
      m._id?.toString() === moduleId || m.order.toString() === moduleId
    );

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // Actualizar los campos (Mongoose detecta los cambios y los guarda al hacer course.save())
    module.title = title;
    module.description = description || '';
    module.content = content;
    module.type = type || 'texto';

    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Módulo actualizado correctamente',
      module: module
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al actualizar módulo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar un módulo específico
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: courseId, moduleId } = await params;
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    // 1. Buscar el ÍNDICE del módulo por _id o por order
    const moduleIndex = course.modules.findIndex((m: any) => 
      m._id?.toString() === moduleId || m.order.toString() === moduleId
    );

    if (moduleIndex === -1) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // 2. ✅ Eliminar el subdocumento usando splice (la forma segura cuando no hay _id)
    course.modules.splice(moduleIndex, 1);

    // 3. Reordenar los módulos restantes para mantener la secuencia (1, 2, 3...)
    course.modules.forEach((m: any, index: number) => {
      m.order = index + 1;
    });

    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Módulo eliminado correctamente',
      modules: course.modules 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al eliminar módulo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}