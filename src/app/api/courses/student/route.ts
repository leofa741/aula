import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import { authOptions } from '@/app/lib/auth';
import Course from '@/app/models/Course';
import Submission from '@/app/models/Submission'; // ✅ Agregado para calcular progreso

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Usamos .lean() para poder modificar los objetos antes de enviarlos
    const courses = await Course.find({
      status: 'activo',
      students: session.user.id
    })
    .populate('professor', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    // ✅ Calculamos el progreso real para cada curso
    const coursesWithProgress = await Promise.all(courses.map(async (course: any) => {
      const totalActivities = course.modules.filter((m: any) => 
        m.type === 'actividad' || m.type === 'comprimido'
      ).length;
      
      let approvedCount = 0;
      let approvedModuleOrders: string[] = [];

      if (totalActivities > 0) {
        const submissions = await Submission.find({
          courseId: course._id,
          studentId: session.user.id,
          status: 'aprobado'
        }).select('moduleId'); // Solo traemos el moduleId para ahorrar memoria

        approvedCount = submissions.length;
        approvedModuleOrders = submissions.map((s: any) => String(s.moduleId));
      }

      const progress = totalActivities > 0 ? Math.round((approvedCount / totalActivities) * 100) : 0;
      
      let courseStatus = 'sin_actividades';
      if (totalActivities > 0) {
        if (approvedCount === totalActivities) courseStatus = 'completado';
        else if (approvedCount > 0) courseStatus = 'en_progreso';
        else courseStatus = 'bloqueado';
      }

      return {
        ...course,
        progress,
        totalActivities,
        approvedCount,
        approvedModuleOrders,
        courseStatus
      };
    }));

    return NextResponse.json({ success: true, courses: coursesWithProgress }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cursos del alumno:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}