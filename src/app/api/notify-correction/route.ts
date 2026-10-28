import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentEmail, studentName, courseTitle, moduleTitle, status, feedback, classroomUrl } = body;

    if (!studentEmail || !status) {
      return NextResponse.json({ success: false, message: 'Faltan datos' }, { status: 400 });
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

    const isApproved = status === 'aprobado';
    const statusColor = isApproved ? '#10b981' : '#f43f5e'; // Verde o Rojo
    const statusText = isApproved ? '¡Aprobada! 🎉' : 'Requiere ajustes ⚠️';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
          .header { background: linear-gradient(135deg, ${statusColor} 0%, ${isApproved ? '#059669' : '#e11d48'} 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; }
          .content { padding: 32px 24px; color: #f1f5f9; }
          .feedback-box { background-color: #0f172a; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-style: italic; color: #cbd5e1; }
          .button { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px; }
          .footer { background-color: #0f172a; padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusText}</h1>
          </div>
          <div class="content">
            <p>Hola, <strong>${studentName}</strong>:</p>
            <p>Tu profesor ha revisado tu entrega para la actividad: <strong>${moduleTitle}</strong> del curso <em>${courseTitle}</em>.</p>
            
            <p><strong>Devolución del profesor:</strong></p>
            <div class="feedback-box">
              "${feedback || 'Sin comentarios adicionales.'}"
            </div>

            <div style="text-align: center;">
              <a href="${classroomUrl}" class="button">Ver mi curso y continuar</a>
            </div>
          </div>
          <div class="footer">
            <p>Sistema Aula Virtual - Notificación automática</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: studentEmail,
      subject: `📚 Tu entrega ha sido ${isApproved ? 'Aprobada' : 'Revisada'}: ${moduleTitle}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enviando notificación de corrección:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}