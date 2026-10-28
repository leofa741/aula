// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────
// 🔹 TIPOS PARA EL FORMULARIO DE CONTACTO DEL AULA VIRTUAL
// ─────────────────────────────────────────────────────────────
interface ContactForm {
  name: string;
  email: string;
  role?: 'alumno' | 'profesor' | 'administrador';
  subject: 'soporte' | 'curso' | 'entrega' | 'sugerencia' | 'otro';
  courseName?: string; // Opcional: Nombre del curso o módulo relacionado
  message: string;
}

// ─────────────────────────────────────────────────────────────
// 🔹 MAPEOS LEGIBLES PARA EL ASUNTO DEL EMAIL
// ─────────────────────────────────────────────────────────────
const subjectLabels: Record<string, string> = {
  soporte: '🛠️ Soporte Técnico',
  curso: '📚 Consulta sobre un Curso',
  entrega: '📝 Problema con una Entrega/Tarea',
  sugerencia: '💡 Sugerencia o Feedback',
  otro: '📩 Consulta General',
};

// ─────────────────────────────────────────────────────────────
// 🔹 HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body: ContactForm = await req.json();
    const { name, email, role, subject, courseName, message } = body;

    // ✅ Validación de campos obligatorios
    if (!name?.trim() || !email?.trim() || !message?.trim() || !subject) {
      return NextResponse.json(
        { success: false, message: 'Por favor, completá los campos obligatorios.' },
        { status: 400 }
      );
    }

    // Configuración de Nodemailer
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

    // Verificar conexión
    await transporter.verify();

    // Construir contenido del email
    const emailContent = buildEmailContent(body);

    const mailOptions = {
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to: process.env.MAILER_EMAIL, // El email del administrador/profesor principal
      cc: process.env.MAILER_CC ? process.env.MAILER_CC.split(',').map((e: string) => e.trim()) : undefined,
      subject: `🎓 ${subjectLabels[subject]} - ${name}`,
      html: emailContent,
      text: buildTextContent(body), // Fallback para clientes que no soportan HTML
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Email de contacto enviado: ${subject} - ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: '¡Mensaje enviado correctamente! Te responderemos a la brevedad.' 
    });

  } catch (error) {
    console.error('❌ Error al enviar el correo de contacto:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ocurrió un error al enviar tu mensaje. Por favor, intentá de nuevo o contactanos por otro medio.' 
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 PLANTILLA HTML PREMIUM PARA EL EMAIL (Estilo Aula Virtual)
// ─────────────────────────────────────────────────────────────
function buildEmailContent(data: ContactForm): string {
  const { name, email, role, subject, courseName, message } = data;
  
  const styles = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8fafc;',
    header: 'background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;',
    headerTitle: 'color: white; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;',
    headerSubtitle: 'color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;',
    body: 'background: #ffffff; padding: 32px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;',
    card: 'background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;',
    label: 'color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0; font-weight: 600;',
    value: 'color: #0f172a; font-size: 15px; font-weight: 500; margin: 0 0 16px 0;',
    messageBox: 'background: #eef2ff; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 16px 0;',
    messageText: 'color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;',
    footer: 'text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; margin-top: 16px;',
    badge: 'display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 24px;',
    divider: 'height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 24px 0;',
    button: 'display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px;',
  };

  const roleDisplay = role ? ` (${role.charAt(0).toUpperCase() + role.slice(1)})` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo mensaje - Aula Virtual</title>
    </head>
    <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
      
      <div style="${styles.container}">
        
        <div style="${styles.header}">
          <h1 style="${styles.headerTitle}">🎓 Nuevo Mensaje de Contacto</h1>
          <p style="${styles.headerSubtitle}">Plataforma de Aula Virtual</p>
        </div>

        <div style="${styles.body}">
          
          <div style="text-align: center;">
            <span style="${styles.badge}">${subjectLabels[subject] || subject}</span>
          </div>

          <div style="${styles.card}">
            <p style="${styles.label}">Nombre del usuario${roleDisplay}</p>
            <p style="${styles.value}">${name}</p>
            
            <p style="${styles.label}">Correo electrónico de contacto</p>
            <p style="${styles.value}">${email}</p>

            ${courseName ? `
            <p style="${styles.label}">Curso o Módulo relacionado</p>
            <p style="${styles.value}">${courseName}</p>
            ` : ''}
          </div>

          <div style="${styles.card}">
            <p style="${styles.label}">Mensaje</p>
            <div style="${styles.messageBox}">
              <p style="${styles.messageText}">${message.replace(/\n/g, '<br>')}</p>
            </div>
          </div>

          <div style="${styles.divider}"></div>

          <div style="text-align: center;">
            <a href="mailto:${email}?subject=Re: ${subjectLabels[subject]} - Aula Virtual" 
               style="${styles.button}">
              Responder a ${name}
            </a>
          </div>

        </div>

        <div style="${styles.footer}">
          <p style="margin: 0 0 8px 0;"><strong>Equipo de Soporte - Aula Virtual</strong></p>
          <p style="margin: 0;">Este mensaje fue generado automáticamente desde el formulario de contacto de la plataforma.</p>
        </div>

      </div>

    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// 🔹 VERSIÓN TEXTO PLANO (FALLBACK)
// ─────────────────────────────────────────────────────────────
function buildTextContent(data: ContactForm): string {
  const { name, email, role, subject, courseName, message } = data;
  
  return `
NUEVO MENSAJE - AULA VIRTUAL
========================================================

ASUNTO: ${subjectLabels[subject] || subject}

USUARIO:
• Nombre: ${name}${role ? ` (${role})` : ''}
• Email: ${email}
${courseName ? `• Curso/Módulo: ${courseName}` : ''}

MENSAJE:
${message}

---
Responder a: ${email}
Enviado desde: Formulario de contacto del Aula Virtual
  `.trim();
}