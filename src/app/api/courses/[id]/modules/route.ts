// src/app/api/courses/[id]/modules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';
import StudentNote from '@/app/models/StudentNote';

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
    const { title, description, content, type, assignmentFileUrl } = body;

    // ✅ VALIDACIÓN FLEXIBLE: Solo requiere content si NO es actividad/pdf
    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    if (!content && type !== 'actividad' && type !== 'pdf') {
      return NextResponse.json({ error: 'El contenido es obligatorio para este tipo de módulo' }, { status: 400 });
    }

    // Calcular el siguiente orden (order)
    const nextOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map((m: any) => m.order)) + 1 
      : 1;

    // ✅ Agregar el nuevo módulo CON assignmentFileUrl
    course.modules.push({
      title,
      description: description || '',
      content: content || '',
      type: type || 'texto',
      assignmentFileUrl: assignmentFileUrl || '', // ✅ GUARDAR URL DEL ARCHIVO
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

// ✅ GET: Obtener módulos del curso
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

    const sortedModules = course.modules.sort((a: any, b: any) => a.order - b.order);

    // Buscar la nota del alumno actual
    let studentNote = null;
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      const noteDoc = await StudentNote.findOne({ 
        courseId, 
        studentId: session.user.id,
        isVisibleToStudent: true
      });
      
      if (noteDoc && noteDoc.note) {
        studentNote = noteDoc.note;
      }
    }

    return NextResponse.json({ 
      success: true, 
      modules: sortedModules, 
      courseTitle: course.title,
      studentNote
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al obtener módulos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

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

    // Validar permisos (dueño o admin)
    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, content, type, assignmentFileUrl } = body;

    // ✅ VALIDACIÓN FLEXIBLE: Solo requiere content si NO es actividad/pdf
    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    if (!content && type !== 'actividad' && type !== 'pdf') {
      return NextResponse.json({ error: 'El contenido es obligatorio para este tipo de módulo' }, { status: 400 });
    }

    // Buscar el módulo específico dentro del array
    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // ✅ Actualizar los campos del módulo CON assignmentFileUrl
    module.title = title;
    module.description = description || '';
    module.content = content || '';
    module.type = type || 'texto';
    
    // ✅ SOLO actualizar assignmentFileUrl si se envió uno nuevo
    if (assignmentFileUrl !== undefined) {
      module.assignmentFileUrl = assignmentFileUrl;
    }

    await course.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Módulo actualizado correctamente',
      module: module.toObject()
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

    // Validar permisos (dueño o admin)
    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    // Buscar el módulo
    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // Eliminar el subdocumento del array
    module.deleteOne();

    // Reordenar los módulos restantes
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