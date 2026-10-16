import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/app/lib/mongoose';
import Course from '@/app/models/Course';
import { authOptions } from '@/app/lib/auth';
import StudentNote from '@/app/models/StudentNote';



export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = {};
    if (status) query.status = status;

    // 1. Obtenemos los cursos y populamos los datos básicos del alumno
    const courses = await Course.find(query)
      .populate('professor', 'name email role')
      .populate('students', 'name lastName email') 
      .sort({ createdAt: -1 });

    // 2. 🔑 ENRIQUECIMIENTO: Fusionamos las notas guardadas con los datos del alumno
    const enrichedCourses = await Promise.all(
      courses.map(async (course: any) => {
        // Buscamos todas las notas para este curso específico
        const notes = await StudentNote.find({ courseId: course._id });
        
        const studentsWithNotes = course.students.map((student: any) => {
          // Manejo seguro del ID (ya sea objeto o string)
          const studentId = student._id ? student._id.toString() : student.toString();
          
          // Buscamos si existe una nota para este alumno en este curso
          const studentNote = notes.find(
            (n: any) => n.studentId.toString() === studentId
          );
          
          // Convertimos a objeto plano si es un documento de Mongoose
          const studentObj = (typeof student === 'object' && student.toObject) 
            ? student.toObject() 
            : { _id: studentId, name: 'Alumno', lastName: '', email: '' };
          
          return {
            ...studentObj,
            // 👇 AQUÍ ESTÁ LA MAGIA: Inyectamos la nota y la visibilidad
            note: studentNote ? studentNote.note : '',
            isNoteVisible: studentNote ? studentNote.isVisibleToStudent : false
          };
        });

        return {
          ...course.toObject(),
          students: studentsWithNotes
        };
      })
    );

    return NextResponse.json({ success: true, courses: enrichedCourses }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 });
  }
}


// ✅ POST: Crear un nuevo curso
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const allowedRoles = ['admin', 'superadmin', 'profesor'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, image, status } = body;
    if (!title || !description) return NextResponse.json({ error: 'Título y descripción son obligatorios' }, { status: 400 });

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newCourse = new Course({
      title, slug, description, image: image || undefined, status: status || 'borrador',
      professor: session.user.id, modules: [], students: []
    });

    await newCourse.save();
    await newCourse.populate('professor', 'name email');

    return NextResponse.json({ success: true, course: newCourse }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear curso:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 });
  }
}

// ✅ PUT: Editar un curso existente
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const allowedRoles = ['admin', 'superadmin', 'profesor'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID del curso es requerido' }, { status: 400 });

    const body = await req.json();
    const { title, description, status } = body;

    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Validación de propiedad: Un profesor solo puede editar sus propios cursos
    if (session.user.role === 'profesor' && course.professor.toString() !== session.user.id) {
      return NextResponse.json({ error: 'No tienes permiso para editar este curso' }, { status: 403 });
    }

    // Actualizar campos
    course.title = title || course.title;
    course.description = description || course.description;
    course.status = status || course.status;
    
    // Si cambia el título, actualizamos el slug
    if (title && title !== course.title) {
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      course.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    await course.save();
    await course.populate('professor', 'name email');

    return NextResponse.json({ success: true, course }, { status: 200 });
  } catch (error: any) {
    console.error('Error al editar curso:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar un curso
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const allowedRoles = ['admin', 'superadmin', 'profesor'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID del curso es requerido' }, { status: 400 });

    const course = await Course.findById(id);
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Validación de propiedad
    if (session.user.role === 'profesor' && course.professor.toString() !== session.user.id) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este curso' }, { status: 403 });
    }

    await Course.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Curso eliminado correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}