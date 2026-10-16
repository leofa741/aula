'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaVideo } from 'react-icons/fa';

export default function SalaEnVivoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseName, setCourseName] = useState('Aula Virtual');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses`); 
        if (res.ok) {
          const data = await res.json();
          const course = data.courses.find((c: any) => c._id === courseId);
          if (course) {
            setCourseName(course.title);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && courseId) fetchCourse();
  }, [status, courseId]);

  // 👈 Pantalla de carga también con z-[9999] para tapar todo
  if (status === 'loading' || loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center text-slate-400">
        <FaSpinner className="animate-spin text-4xl text-violet-500 mr-3" /> Preparando el aula...
      </div>
    );
  }

  // Generamos un nombre de sala único pero legible para Jitsi
  const jitsiRoomName = `AulaVirtual-${courseName.replace(/\s+/g, '-')}-${courseId}`;
  const jitsiDomain = 'meet.jit.si';
  const jitsiUrl = `https://${jitsiDomain}/${jitsiRoomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(session?.user?.name || 'Estudiante')}`;

  return (
    // 👈 z-[9999] y w-screen h-screen aseguran que esto tape CUALQUIER navbar/footer global
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      
      {/* Header del Aula */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => router.push('/aula/mis-cursos')} // Mejor ir a mis cursos que usar router.back()
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Salir del aula"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
              <FaVideo className="text-emerald-400" />
              {courseName}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Conectado como: {session?.user?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs font-medium border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </span>
        </div>
      </div>

      {/* Contenedor de Jitsi Meet (Ocupa todo el espacio restante) */}
      <div className="flex-1 w-full h-full bg-black relative">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          title="Aula Virtual en Vivo"
        />
      </div>
    </div>
  );
}