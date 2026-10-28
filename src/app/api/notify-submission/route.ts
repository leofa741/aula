import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface SubmissionNotification {
  professorEmail: string;
  professorName: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  moduleTitle: string;
  fileName: string;
  fileUrl: string;
  classroomUrl: string; // URL para que el profesor vaya directo a corregir
}

export async function POST(req: Request) {
  try {
    const body: SubmissionNotification = await req.json();
    const { professorEmail, professorName, studentName, courseTitle, moduleTitle, fileName, fileUrl, classroomUrl } = body;

    if (!professorEmail || !studentName || !moduleTitle || !fileUrl) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos obligatorios para la notificación.' },
        { status: 400 }
      );
    }

    // Configuración de Nodemailer (Reutilizando tus variables de entorno)
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

    await transporter.verify();

    const mailOptions = {
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: professorEmail,
      subject: `📚 Nueva entrega: ${moduleTitle} - ${studentName}`,
      html: buildPremiumEmailHTML(body),
      text: buildTextContent(body),
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Notificación de entrega enviada a: ${professorEmail}`);

    return NextResponse.json({ success: true, message: 'Notificación enviada correctamente' });

  } catch (error) {
    console.error('❌ Error al enviar la notificación de entrega:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al procesar la notificación.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 PLANTILLA HTML PREMIUM (Diseño Aula Virtual: Slate & Indigo)
// ─────────────────────────────────────────────────────────────
function buildPremiumEmailHTML(data: SubmissionNotification): string {
  const { professorName, studentName, courseTitle, moduleTitle, fileName, fileUrl, classroomUrl } = data;
  
  const styles = {
    body: 'background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;',
    container: 'max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;',
    header: 'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;',
    headerTitle: 'color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.025em;',
    headerSubtitle: 'color: #c7d2fe; font-size: 14px; margin: 8px 0 0 0; font-weight: 500;',
    content: 'padding: 32px 24px;',
    greeting: 'color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 24px 0;',
    infoCard: 'background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;',
    label: 'color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0; font-weight: 600;',
    value: 'color: #f1f5f9; font-size: 15px; font-weight: 500; margin: 0 0 16px 0;',
    valueLast: 'color: #f1f5f9; font-size: 15px; font-weight: 500; margin: 0;',
    fileBox: 'background-color: #312e81; border: 1px solid #4338ca; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px; margin: 24px 0;',
    fileIcon: 'width: 24px; height: 24px; color: #a5b4fc;',
    fileName: 'color: #e0e7ff; font-size: 14px; font-weight: 600; margin: 0; word-break: break-all;',
    buttonContainer: 'text-align: center; margin-top: 32px;',
    button: 'display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; transition: background-color 0.2s;',
    footer: 'background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #334155;',
    footerText: 'color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Entrega - Aula Virtual</title>
    </head>
    <body style="${styles.body}">
      
      <div style="${styles.container}">
        
        <div style="${styles.header}">
          <h1 style="${styles.headerTitle}">📚 Nueva Entrega Recibida</h1>
          <p style="${styles.headerSubtitle}">Aula Virtual</p>
        </div>

        <div style="${styles.content}">
          <p style="${styles.greeting}">Hola, ${professorName || 'Profesor'}:</p>
          
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            El alumno <strong style="color: #f8fafc;">${studentName}</strong> ha enviado su trabajo para la siguiente actividad:
          </p>

          <div style="${styles.infoCard}">
            <p style="${styles.label}">Curso</p>
            <p style="${styles.value}">${courseTitle}</p>
            
            <p style="${styles.label}">Módulo / Actividad</p>
            <p style="${styles.valueLast}">${moduleTitle}</p>
          </div>

          <div style="${styles.fileBox}">
            <svg style="${styles.fileIcon}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style="${styles.fileName}">${fileName}</p>
          </div>

          <div style="${styles.buttonContainer}">
            <a href="${classroomUrl}" style="${styles.button}">
              Ver y Corregir Entrega
            </a>
          </div>
        </div>

        <div style="${styles.footer}">
          <p style="${styles.footerText}">
            Este es un mensaje automático del sistema del Aula Virtual.<br>
            Por favor, no respondas directamente a este correo.
          </p>
        </div>

      </div>

    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// 🔹 VERSIÓN TEXTO PLANO (FALLBACK)
// ─────────────────────────────────────────────────────────────
function buildTextContent(data: SubmissionNotification): string {
  const { professorName, studentName, courseTitle, moduleTitle, fileName, fileUrl, classroomUrl } = data;
  
  return `
NUEVA ENTREGA - AULA VIRTUAL
========================================================

Hola ${professorName || 'Profesor'},

El alumno ${studentName} ha enviado su trabajo.

DETALLES:
• Curso: ${courseTitle}
• Módulo: ${moduleTitle}
• Archivo: ${fileName}

Enlace para descargar el archivo:
${fileUrl}

Ingresa al aula virtual para corregir y dejar tu devolución:
${classroomUrl}

---
Sistema Aula Virtual
  `.trim();
}