'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaBookOpen, FaSpinner, FaChalkboardTeacher, FaUsers, FaUserPlus, FaCheck } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  professor: { name: string; email: string };
  students: any[];
}

export default function CursosDisponiblesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchAvailableCourses = async () => {
    try {
      const res = await fetch('/api/courses?status=activo');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchAvailableCourses();
  }, [status]);

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    setEnrolling(courseId);

    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Inscripción exitosa!',
          text: `Te has inscrito correctamente a "${courseTitle}"`,
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#10b981',
          customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
        });
        fetchAvailableCourses(); // Recargar para actualizar el estado
      } else {
        throw new Error(data.error || 'Error al inscribirse');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
      });
    } finally {
      setEnrolling(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-emerald-500" />
      </div>
    );
  }

  const isStudent = session?.user?.role === 'alumno';

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto mt-40 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaBookOpen className="text-emerald-400" />
            Catálogo de Cursos
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Explora los cursos disponibles e inscríbete para comenzar a aprender.</p>
        </div>

        {courses.length === 0 ? (
          <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
            <FaBookOpen className="mx-auto text-5xl text-slate-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay cursos disponibles</h3>
            <p className="text-slate-400">Por ahora no hay cursos activos. Vuelve más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = course.students.some(s => s === session?.user?.id);
              
              return (
                <div key={course._id} className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group flex flex-col`}>
                  <div className="relative h-40 bg-slate-800 overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white line-clamp-1">{course.title}</h3>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FaChalkboardTeacher className="text-violet-400" />
                        <span className="truncate">Prof. {course.professor?.name || 'Sin asignar'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FaUsers className="text-fuchsia-400" />
                        <span>{course.students?.length || 0} alumnos inscritos</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {isEnrolled ? (
                        <button 
                          onClick={() => router.push(`/aula/sala/${course._id}`)}
                          className="w-full py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-all flex items-center justify-center gap-2 border border-emerald-500/30"
                        >
                          <FaCheck className="w-4 h-4" />
                          Ya estás inscrito · Ir al Aula
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEnroll(course._id, course.title)}
                          disabled={enrolling === course._id || !isStudent}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enrolling === course._id ? (
                            <FaSpinner className="animate-spin w-4 h-4" />
                          ) : (
                            <FaUserPlus className="w-4 h-4" />
                          )}
                          {enrolling === course._id ? 'Inscribiendo...' : 'Inscribirme'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}