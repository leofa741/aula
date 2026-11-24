import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';

export async function POST(req: Request) {
  try {
    const { courseId, courseTitle, moduleTitle, moduleType, classroomUrl } = await req.json();
    await connectDB();
    
    const course = await Course.findById(courseId).populate('students', 'email name');
    if (!course || !course.students || course.students.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay alumnos para notificar' });
    }

    const studentEmails = course.students.map((s: any) => s.email).filter((email: string) => email && email.includes('@'));
    if (studentEmails.length === 0) return NextResponse.json({ success: true, message: 'No se encontraron emails válidos' });

    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT || '587'),
      secure: process.env.MAILER_SECURE === 'true',
      auth: { user: process.env.MAILER_EMAIL, pass: process.env.MAILER_SECRET_KEY },
    });

    const htmlContent = `
      <div style="font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; border-radius: 8px;">
        <h2 style="color: #8b5cf6;">📚 Nuevo Material Disponible</h2>
        <p>Hola,</p>
        <p>El profesor ha añadido nuevo contenido al curso <strong>${courseTitle}</strong>.</p>
        <div style="background: #1e293b; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 4px;">
          <strong>Módulo:</strong> ${moduleTitle}<br>
          <strong>Tipo:</strong> ${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: process.env.MAILER_EMAIL,
      bcc: studentEmails.join(','),
      subject: `📚 Nuevo material en: ${courseTitle}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}