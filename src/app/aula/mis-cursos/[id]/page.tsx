'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// ✅ NUEVO 1: Agregamos los iconos para el diseño de la nota
import { FaArrowLeft, FaSpinner, FaVideo, FaPlayCircle, FaFilePdf, FaFileAlt, FaExternalLinkAlt, FaLightbulb, FaQuoteLeft, FaCheckCircle } from 'react-icons/fa';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

interface Module {
  _id: string;
  title: string;
  description: string;
  content: string;
  type?: 'texto' | 'video' | 'pdf' | 'enlace';
  order: number;
}

const formatUrl = (url: string) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function StudentCourseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  
  // ✅ NUEVO 2: Estado para guardar la nota que viene del servidor
  const [studentNote, setStudentNote] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules`);
        if (res.ok) {
          const data = await res.json();
          setCourseTitle(data.courseTitle);
          setModules(data.modules || []);
          
          // ✅ NUEVO 3: Guardamos la nota si el servidor la envió (solo si es visible)
          setStudentNote(data.studentNote || null);
        } else {
          router.push('/aula/mis-cursos');
        }
      } catch (error) {
        console.error('Error cargando el curso:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && courseId) {
      fetchCourseData();
    }
  }, [status, courseId]);

  const handleJoinLiveClass = () => {
    const roomName = `AulaVirtual-${courseTitle.replace(/\s+/g, '-')}-${courseId}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(session?.user?.name || 'Estudiante')}`;
    window.open(jitsiUrl, '_blank');
  };

  const getModuleIcon = (type: string | undefined) => {
    if (!type) return <FaFileAlt className="text-slate-400 text-xl" />;
    switch (type) {
      case 'video': return <FaPlayCircle className="text-red-500 text-xl" />;
      case 'pdf': return <FaFilePdf className="text-rose-500 text-xl" />;
      case 'enlace': return <FaFileAlt className="text-blue-400 text-xl" />;
      default: return <FaFileAlt className="text-slate-400 text-xl" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto mt-40 px-4 sm:px-6 lg:px-8 py-12">

        {/* Header con botón de volver */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/aula/mis-cursos')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{courseTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">Material de estudio y clases en vivo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna Izquierda: Info y Clase en Vivo */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-6 sticky top-6`}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaVideo className="text-emerald-400" /> Aula Virtual
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Esta es la sala virtual de tu curso. <strong>Ingresa cuando el profesor haya iniciado la clase.</strong> Si entras antes, quedarás en la sala de espera hasta que él te admita.
              </p>

              <button
                onClick={handleJoinLiveClass}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <FaVideo className="w-5 h-5" />
                Unirse al Aula Virtual
                <FaExternalLinkAlt className="w-3 h-3 opacity-70" />
              </button>

              <p className="text-[10px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                El enlace es único y permanente para este curso.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Nota del Profesor + Lista de Módulos */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ✅ NUEVO 4: Renderizado de la Nota (Solo aparece si studentNote tiene texto) */}
            {studentNote && (
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-violet-500/5 to-slate-900/50 border border-amber-500/20 backdrop-blur-sm shadow-lg">
                <div className="absolute -top-3.5 left-5 px-3 py-1.5 rounded-full bg-slate-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl">
                  <FaLightbulb className="w-3.5 h-3.5" /> Retroalimentación del Profesor
                </div>
                <div className="mt-3">
                  <div className="relative pl-4 py-1">
                    <FaQuoteLeft className="absolute -left-1 top-0 w-4 h-4 text-amber-500/30" />
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic font-light">
                      "{studentNote}"
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-500 w-3.5 h-3.5" />
                    <span className="text-xs text-slate-500">Compartido por tu docente</span>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Contenido del Curso ({modules.length} módulos)
            </h3>

            {modules.length === 0 ? (
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-8 text-center`}>
                <p className="text-slate-400">El profesor aún no ha subido material a este curso.</p>
                <p className="text-slate-500 text-sm mt-1">¡Aprovecha este tiempo para repasar o unirte a la clase en vivo!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => {
                  const moduleType = module.type ? String(module.type).toLowerCase().trim() : 'texto';

                  return (
                    <div key={index} className={`${theme.bgCard} border ${theme.border} rounded-xl p-5 hover:border-emerald-500/30 transition-colors group`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                          {getModuleIcon(module.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              Módulo {module.order}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                              {moduleType}
                            </span>
                          </div>

                          <h4 className="text-white font-semibold mb-1">{module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                          )}

                          {moduleType === 'texto' ? (
                            <div className="mt-3 p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {module.content}
                            </div>
                          ) : (
                            <a
                              href={formatUrl(module.content)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors border border-slate-700"
                            >
                              {moduleType === 'video' ? 'Ver Video' : moduleType === 'pdf' ? 'Descargar PDF' : 'Abrir Enlace'}
                              <FaExternalLinkAlt className="w-3 h-3" />
                            </a>
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
      </div>
    </div>
  );
}