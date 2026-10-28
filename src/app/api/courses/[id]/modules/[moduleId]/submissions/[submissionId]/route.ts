import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';
import Submission from '@/app/models/Submission';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; submissionId: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: courseId, moduleId, submissionId } = await params;
    const body = await req.json();
    const { status, feedback } = body;

    // ✅ 1. Validar que el estado sea correcto
    if (!['aprobado', 'rechazado'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido. Debe ser "aprobado" o "rechazado".' }, { status: 400 });
    }

    // ✅ 2. Verificar que el curso exista y obtener permisos
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const isProfessor = course.professor.toString() === session.user.id || ['admin', 'superadmin'].includes(session.user.role);

    if (!isProfessor) {
      return NextResponse.json({ error: 'Solo el profesor puede corregir entregas' }, { status: 403 });
    }

    // ✅ 3. Actualizar la entrega
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { status, feedback },
      { new: true } // Devuelve el documento actualizado
    );

    if (!submission) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 });
    }

    // ✅ 4. (OPCIONAL PERO RECOMENDADO) Notificar al alumno por email
      // ✅ 4. Notificar al alumno por email con registro de errores real
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const emailRes = await fetch(`${appUrl}/api/notify-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: submission.studentEmail,
          studentName: submission.studentName,
          courseTitle: course.title,
          moduleTitle: course.modules.find((m: any) => m.order.toString() === moduleId)?.title || 'Actividad',
          status,
          feedback,
          classroomUrl: `${appUrl}/aula/cursos/${courseId}`
        })
      });

      // 🔍 VERIFICACIÓN REAL: ¿La API de correo respondió con éxito?
      if (!emailRes.ok) {
        const errorData = await emailRes.json().catch(() => ({}));
        console.error('❌ FALLÓ EL ENVÍO DEL CORREO. La API respondió:', emailRes.status, errorData);
      } else {
        console.log(`✅ CORREO ENVIADO EXITOSAMENTE a: ${submission.studentEmail}`);
      }
    } catch (emailError) {
      console.error('⚠️ ERROR DE RED al llamar a la API de correo:', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Entrega marcada como ${status}`,
      submission 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error corrigiendo entrega:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}