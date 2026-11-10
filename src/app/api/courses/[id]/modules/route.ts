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

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    const body = await req.json();
    
    // ✅ NUEVO: Extraemos los campos de asignación del body
    const { 
      title, description, content, type, assignmentFileUrl, 
      assignmentType, assignedStudentIds, customGroupName 
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    if (!content && type !== 'actividad' && type !== 'pdf' && type !== 'comprimido') {
      return NextResponse.json({ error: 'El contenido es obligatorio para este tipo de módulo' }, { status: 400 });
    }

    const nextOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map((m: any) => m.order)) + 1 
      : 1;

    // ✅ NUEVO: Guardamos los campos de asignación en el nuevo módulo
    course.modules.push({
      title,
      description: description || '',
      content: content || '',
      type: type || 'texto',
      assignmentFileUrl: assignmentFileUrl || '', 
      order: nextOrder,
      assignmentType: assignmentType || 'todos',
      assignedStudentIds: assignedStudentIds || [],
      customGroupName: customGroupName || ''
    });

    await course.save();

    // 📧 Notificar a los alumnos (tu código original intacto)
    try {
      const origin = req.nextUrl.origin;
      const classroomUrl = `${origin}/aula/cursos/${courseId}`;
      
      fetch(`${origin}/api/notify-new-module`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseTitle: course.title,
          moduleTitle: title,
          moduleType: type || 'texto',
          classroomUrl
        })
      }).catch(err => console.error('Error disparando notificación de nuevo módulo:', err));
    } catch (notifyError) {
      console.error('Error configurando la notificación:', notifyError);
    }

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

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    const body = await req.json();
    
    // ✅ NUEVO: Extraemos los campos de asignación del body
    const { 
      title, description, content, type, assignmentFileUrl,
      assignmentType, assignedStudentIds, customGroupName
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    if (!content && type !== 'actividad' && type !== 'pdf' && type !== 'comprimido') {
      return NextResponse.json({ error: 'El contenido es obligatorio para este tipo de módulo' }, { status: 400 });
    }

    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // ✅ NUEVO: Actualizamos los campos de asignación
    module.title = title;
    module.description = description || '';
    module.content = content || '';
    module.type = type || 'texto';
    
    if (assignmentFileUrl !== undefined) module.assignmentFileUrl = assignmentFileUrl;
    if (assignmentType !== undefined) module.assignmentType = assignmentType;
    if (assignedStudentIds !== undefined) module.assignedStudentIds = assignedStudentIds;
    if (customGroupName !== undefined) module.customGroupName = customGroupName;

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

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para modificar este curso' }, { status: 403 });
    }

    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    module.deleteOne();

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