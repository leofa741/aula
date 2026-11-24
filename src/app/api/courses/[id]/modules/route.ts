import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';
import Submission from '@/app/models/Submission';

// ✅ POST: Crear un nuevo módulo
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const courseId = (await params).id;
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });

    const body = await req.json();
    
    // ✅ 1. EXTRAER 'links' DEL BODY QUE ENVÍA EL FRONTEND
    const { title, description, content, type, links, assignmentType, assignedStudentIds, customGroupName } = body;

    if (!title) return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });

    const nextOrder = course.modules.length > 0 ? Math.max(...course.modules.map((m: any) => m.order)) + 1 : 1;

    // ✅ 2. GUARDAR 'links' EN LA BASE DE DATOS
    course.modules.push({
      title,
      description: description || '',
      content: content || '',
      type: type || 'texto',
      links: links || [], // <-- ¡AQUÍ SE GUARDA EL ARRAY DE ENLACES!
      order: nextOrder,
      assignmentType: assignmentType || 'todos',
      assignedStudentIds: assignedStudentIds || [],
      customGroupName: customGroupName || ''
    });

    await course.save();
    return NextResponse.json({ success: true, modules: course.modules }, { status: 201 });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ GET: Obtener módulos (Este ya funciona bien, trae todo el objeto module incluyendo links)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const course = await Course.findById((await params).id).select('modules title status');
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const sortedModules = course.modules.sort((a: any, b: any) => a.order - b.order);
    return NextResponse.json({ success: true, modules: sortedModules, courseTitle: course.title }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ PUT: Editar un módulo existente
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: courseId, moduleId } = await params;
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });

    const body = await req.json();
    
    // ✅ 3. EXTRAER 'links' DEL BODY AL EDITAR
    const { title, description, content, type, links, assignmentType, assignedStudentIds, customGroupName } = body;

    const module = course.modules.id(moduleId);
    if (!module) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });

    // ✅ 4. ACTUALIZAR 'links' EN LA BASE DE DATOS
    module.title = title;
    module.description = description || '';
    module.content = content || '';
    module.type = type || 'texto';
    module.links = links || []; // <-- ¡AQUÍ SE ACTUALIZA EL ARRAY DE ENLACES!
    
    if (assignmentType !== undefined) module.assignmentType = assignmentType;
    if (assignedStudentIds !== undefined) module.assignedStudentIds = assignedStudentIds;
    if (customGroupName !== undefined) module.customGroupName = customGroupName;

    await course.save();
    return NextResponse.json({ success: true, module: module.toObject() }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar módulo y sus entregas fantasma
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: courseId, moduleId } = await params;
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const isOwner = course.professor.toString() === session.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(session.user.role);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });

    const moduleToDelete = course.modules.id(moduleId);
    if (!moduleToDelete) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });

    const oldOrder = moduleToDelete.order;
    course.modules.pull({ _id: moduleId });
    
    // Eliminar entregas asociadas para evitar el bug del "módulo fantasma aprobado"
    await Submission.deleteMany({ moduleId: String(oldOrder) });

    course.modules.forEach((m: any, index: number) => { m.order = index + 1; });
    await course.save();

    return NextResponse.json({ success: true, message: 'Módulo y entregas eliminados', modules: course.modules }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}