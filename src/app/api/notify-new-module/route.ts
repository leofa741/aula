import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';

export async function POST(req: Request) {
  try {
    const { courseId, courseTitle, moduleTitle, moduleType, classroomUrl } = await req.json();

    await connectDB();
    
    // Buscamos el curso y traemos los emails de los alumnos inscriptos
    const course = await Course.findById(courseId).populate('students', 'email name');
    
    if (!course || !course.students || course.students.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay alumnos para notificar' });
    }

    // Filtramos solo los emails válidos
    const studentEmails = course.students
      .map((s: any) => s.email)
      .filter((email: string) => email && email.includes('@'));

    if (studentEmails.length === 0) {
      return NextResponse.json({ success: true, message: 'No se encontraron emails válidos de alumnos' });
    }

    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT || '587'),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_SECRET_KEY,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; }
          .content { padding: 32px 24px; color: #f1f5f9; }
          .highlight { background-color: #312e81; border: 1px solid #4338ca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #e0e7ff; }
          .button { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px; }
          .footer { background-color: #0f172a; padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Nuevo Material Disponible</h1>
          </div>
          <div class="content">
            <p>Hola:</p>
            <p>El profesor ha añadido nuevo contenido al curso <strong>${courseTitle}</strong>.</p>
            
            <div class="highlight">
              <strong>Módulo:</strong> ${moduleTitle}<br>
              <strong>Tipo:</strong> ${moduleType === 'comprimido' ? 'Archivo Comprimido (ZIP/RAR)' : moduleType.charAt(0).toUpperCase() + moduleType.slice(1)}
            </div>

            <div style="text-align: center;">
              <a href="${classroomUrl}" class="button">Ir al Curso y Revisar</a>
            </div>
          </div>
          <div class="footer">
            <p>Sistema Aula Virtual - Notificación automática</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviamos un solo correo con todos los alumnos en BCC (Copia Oculta) para proteger su privacidad
    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: process.env.MAILER_EMAIL, // Se envía a tu propia cuenta como "De"
      bcc: studentEmails.join(','),  // Todos los alumnos en copia oculta
      subject: `📚 Nuevo material en: ${courseTitle}`,
      html: htmlContent,
    });

    console.log(`✅ Notificación de nuevo módulo enviada a ${studentEmails.length} alumnos.`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error enviando notificación de nuevo módulo:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}