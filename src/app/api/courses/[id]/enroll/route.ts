import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';
import User from '@/app/models/User';
import nodemailer from 'nodemailer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'superadmin', 'profesor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const courseId = (await params).id;
    const { studentIds } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron alumnos' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const newlyEnrolledStudents: string[] = [];

    // Agregamos solo los que no estén ya inscritos
    for (const studentId of studentIds) {
      if (!course.students.includes(studentId)) {
        course.students.push(studentId);
        newlyEnrolledStudents.push(studentId);
      }
    }

    await course.save();

    // 📧 Enviar correos a los nuevos alumnos
    if (newlyEnrolledStudents.length > 0) {
      const students = await User.find({ _id: { $in: newlyEnrolledStudents } }).select('name email');
      
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

      const origin = req.nextUrl.origin;
      const classroomUrl = `${origin}/aula/mis-cursos`;

      for (const student of students) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: system-ui, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; }
              .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; }
              .content { padding: 32px 24px; color: #f1f5f9; }
              .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px; }
              .footer { background-color: #0f172a; padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Has sido inscrito en un nuevo curso! 🎓</h1>
              </div>
              <div class="content">
                <p>Hola, <strong>${student.name}</strong>:</p>
                <p>Tu profesor o administrador te ha inscrito en el curso: <strong>${course.title}</strong>.</p>
                <p>Ahora tienes acceso completo al material de estudio, actividades y clases en vivo.</p>
                <div style="text-align: center;">
                  <a href="${classroomUrl}" class="button">Ir a Mis Cursos</a>
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
          to: student.email,
          subject: `📚 Te hemos inscrito en: ${course.title}`,
          html: htmlContent,
        });
      }
    }

    // Devolvemos el curso actualizado con los estudiantes poblados
    const updatedCourse = await Course.findById(courseId).populate('students', 'name lastName email');

    return NextResponse.json({ 
      success: true, 
      message: 'Alumnos asignados correctamente',
      course: updatedCourse 
    });

  } catch (error) {
    console.error('Error al asignar alumnos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}