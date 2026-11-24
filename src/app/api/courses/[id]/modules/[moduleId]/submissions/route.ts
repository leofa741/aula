import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';
import Submission from '@/app/models/Submission';
import nodemailer from 'nodemailer';







// ✅ GET: Obtener entregas de un módulo específico de un curso específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await connectDB();
    
    // Obtenemos AMBOS IDs de la URL
    const { id: courseId, moduleId } = await params;

    // 🔒 CORRECCIÓN CRÍTICA: Filtramos POR AMBOS campos. 
    // Así nunca traerá entregas de otro curso que casualmente tenga un "Módulo 1"
    const submissions = await Submission.find({
      courseId: courseId,
      moduleId: moduleId
    }).sort({ submittedAt: -1 });

    return NextResponse.json({ success: true, submissions }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ... (aquí abajo deja tus funciones POST y PUT tal como las tenías, esas funcionan bien) ...

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const { studentId, studentName, studentEmail, deliveryLink } = body;

    const course = await Course.findById(courseId).populate('professor', 'name email');
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    const newSubmission = await Submission.create({
      moduleId, courseId, studentId, studentName, studentEmail, deliveryLink, status: 'pendiente'
    });

    // 📧 Notificar al profesor
    const professor = course.professor as any;
    if (professor?.email) {
      const transporter = nodemailer.createTransport({
        service: process.env.MAILER_SERVICE || 'gmail',
        auth: { user: process.env.MAILER_EMAIL, pass: process.env.MAILER_SECRET_KEY },
      });

      await transporter.sendMail({
        from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
        to: professor.email,
        subject: `📬 Nueva entrega en: ${course.title}`,
        html: `
          <div style="font-family: sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; border-radius: 8px;">
            <h2 style="color: #f59e0b;">📬 Nueva Entrega de Alumno</h2>
            <p>Hola <strong>${professor.name}</strong>,</p>
            <p>El alumno <strong>${studentName}</strong> ha entregado una resolución.</p>
            <div style="background: #1e293b; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <strong>Curso:</strong> ${course.title}<br>
              <strong>Módulo:</strong> ${moduleId}
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, submission: newSubmission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}



export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string; submissionId: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { submissionId } = await params;
    const body = await req.json();
    const { status, feedback } = body;

    const submission = await Submission.findById(submissionId).populate('studentId', 'name email');
    if (!submission) return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 });

    submission.status = status;
    submission.feedback = feedback || '';
    await submission.save();

    // 📧 Notificar al alumno
    const student = submission.studentId as any;
    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      auth: { user: process.env.MAILER_EMAIL, pass: process.env.MAILER_SECRET_KEY },
    });

    const isApproved = status === 'aprobado';
    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: student.email,
      subject: `📚 Tu entrega ha sido ${isApproved ? 'Aprobada' : 'Revisada'}`,
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: ${isApproved ? '#10b981' : '#f43f5e'}">${isApproved ? '¡Aprobada! 🎉' : 'Requiere ajustes ⚠️'}</h2>
          <p>Hola <strong>${student.name}</strong>,</p>
          <p>Tu profesor ha revisado tu entrega.</p>
          <div style="background: #1e293b; padding: 15px; border-left: 4px solid ${isApproved ? '#10b981' : '#f43f5e'}; margin: 20px 0;">
            <strong>Devolución:</strong><br>"${feedback || 'Sin comentarios adicionales.'}"
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}