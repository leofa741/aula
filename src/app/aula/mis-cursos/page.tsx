'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaBookOpen, FaSpinner, FaChalkboardTeacher, FaLock } from 'react-icons/fa';

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
  professor: { name: string };
}

export default function MisCursosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await fetch('/api/courses/student');
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error('Error cargando mis cursos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') fetchMyCourses();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-violet-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto mt-40 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaBookOpen className="text-emerald-400" />
            Mis Cursos
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Bienvenido, {session?.user?.name}. Aquí tienes acceso a tus clases y materiales.</p>
        </div>

        {courses.length === 0 ? (
          <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
            <FaLock className="mx-auto text-5xl text-slate-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No estás inscrito en ningún curso</h3>
            <p className="text-slate-400">Contacta al administrador para que te asigne un curso o explora el catálogo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group flex flex-col`}>
                <div className="relative h-40 bg-slate-800 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white line-clamp-1">{course.title}</h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <FaChalkboardTeacher className="text-violet-400" />
                    <span className="truncate">Prof. {course.professor?.name || 'Sin asignar'}</span>
                  </div>

                  {/* Barra de progreso simulada */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progreso del curso</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  {/* ✅ CAMBIO CORREGIDO: Botón que lleva a la página de detalle del curso */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => router.push(`/aula/mis-cursos/${course._id}`)}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      <FaBookOpen className="w-4 h-4" />
                      Ver Contenido del Curso
                    </button>
                  </div>
                  {/* ✅ FIN DEL CAMBIO */}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}