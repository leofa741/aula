import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';
import Submission from '@/app/models/Submission';

// ✅ GET: Obtener entregas
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: courseId, moduleId } = await params;
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const isProfessor = course.professor.toString() === session.user.id || ['admin', 'superadmin'].includes(session.user.role);

    let query: any = { courseId, moduleId };
    if (!isProfessor) {
      // Si es alumno, solo ve sus propias entregas
      query.studentId = session.user.id;
    }

    const submissions = await Submission.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, submissions }, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ POST: Alumno envía una entrega
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'Faltan datos del archivo' }, { status: 400 });
    }

    // Verificar que el curso exista y obtener datos del profesor para el email
    const course = await Course.findById(courseId).populate('professor', 'name email');
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Verificar que el alumno esté inscripto (o sea el propio profesor probando)
    const isEnrolled = course.students.some((studentId: any) => studentId.toString() === session.user.id);
    const isProfessor = course.professor._id.toString() === session.user.id;

    if (!isEnrolled && !isProfessor) {
      return NextResponse.json({ error: 'No estás inscripto en este curso' }, { status: 403 });
    }

    // Crear o actualizar la entrega (Upsert)
    const submission = await Submission.findOneAndUpdate(
      { courseId, moduleId, studentId: session.user.id },
      {
        studentName: session.user.name || 'Alumno',
        studentEmail: session.user.email || '',
        fileUrl,
        fileName,
        status: 'pendiente',
        feedback: ''
      },
      { upsert: true, new: true }
    );

    // 📧 DISPARAR NOTIFICACIÓN AL PROFESOR (Usando la ruta dedicada)
    // 📧 DISPARAR NOTIFICACIÓN AL PROFESOR (Usando la ruta dedicada)
    try {
      const professor = course.professor as any;
      if (professor?.email) {
        
        // ✅ BÚSQUEDA ROBUSTA: Busca el módulo por _id, id, order, o "module-order"
        const moduleInfo = course.modules.find((m: any) => 
          m._id?.toString() === moduleId || 
          m.id === moduleId || 
          m.order.toString() === moduleId || 
          `module-${m.order}` === moduleId
        );

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const classroomUrl = `${appUrl}/aula/cursos/${courseId}`;

        // Llamamos a nuestra API de notificación en segundo plano
        await fetch(`${appUrl}/api/notify-submission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professorEmail: professor.email,
            professorName: professor.name || 'Profesor',
            studentName: session.user.name || 'Alumno',
            studentEmail: session.user.email || '',
            courseTitle: course.title,
            moduleTitle: moduleInfo?.title || 'Actividad sin título', // ✅ Fallback por si acaso
            fileName: fileName,
            fileUrl: fileUrl,
            classroomUrl: classroomUrl
          })
        });
      }
    } catch (emailError) {
      // ⚠️ Importante: No fallamos la entrega si el email falla, solo lo registramos
      console.error('⚠️ Falló el envío del email de notificación:', emailError);
    }
    return NextResponse.json({ success: true, submission }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando entrega:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}