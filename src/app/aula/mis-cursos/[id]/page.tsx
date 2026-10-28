'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaVideo, FaPlayCircle, FaFilePdf, FaFileAlt, FaExternalLinkAlt, FaLightbulb, FaCheckCircle, FaQuoteLeft, FaDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

interface Module {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  content: string;
  type?: 'texto' | 'video' | 'pdf' | 'enlace' | 'actividad';
  assignmentFileUrl?: string;
  order: number;
}

interface Submission {
  _id: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback?: string;
  submittedAt: string;
}

// ✅ FUNCIÓN INFALIBLE: Usa tu propio servidor para forzar la descarga sin errores de Cloudinary
const getProxyDownloadUrl = (url: string, filename: string) => {
  if (!url) return '#';
  return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
};

export default function StudentCourseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [studentNote, setStudentNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [submissions, setSubmissions] = useState<Record<string, Submission | null>>({});
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    if (status === 'authenticated' && courseId && modules.length > 0) {
      const fetchAllSubmissions = async () => {
        const newSubmissions: Record<string, Submission | null> = {};
        for (const module of modules) {
          const moduleType = module.type ? String(module.type).toLowerCase().trim() : 'texto';
          if (moduleType === 'actividad' || moduleType === 'pdf') {
            const safeKey = module._id || module.id || `module-${module.order}`;
            try {
              const res = await fetch(`/api/courses/${courseId}/modules/${safeKey}/submissions`);
              if (res.ok) {
                const data = await res.json();
                newSubmissions[safeKey] = data.submissions && data.submissions.length > 0 ? data.submissions[0] : null;
              }
            } catch (error) {
              console.error('Error cargando entrega:', error);
            }
          }
        }
        setSubmissions(prev => ({ ...prev, ...newSubmissions }));
      };
      fetchAllSubmissions();
    }
  }, [status, courseId, modules]);

  const handleJoinLiveClass = () => {
    const roomName = `AulaVirtual-${courseTitle.replace(/\s+/g, '-')}-${courseId}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(session?.user?.name || 'Estudiante')}`;
    window.open(jitsiUrl, '_blank');
  };

  const getModuleIcon = (type: string | undefined) => {
    if (!type) return <FaFileAlt className="text-slate-400 text-xl" />;
    switch (type) {
      case 'video': return <FaPlayCircle className="text-red-500 text-xl" />;
      case 'pdf': 
      case 'actividad': return <FaFilePdf className="text-rose-500 text-xl" />;
      case 'enlace': return <FaFileAlt className="text-blue-400 text-xl" />;
      default: return <FaFileAlt className="text-slate-400 text-xl" />;
    }
  };

  const handleStudentSubmit = async (moduleId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      Swal.fire({ title: 'Subiendo archivo...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });
      setUploading(true);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
        if (!uploadRes.ok) throw new Error('Error al subir tu entrega');
        const { url: fileUrl, fileName } = await uploadRes.json();
        
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl, fileName }),
        });

        if (res.ok) {
          Swal.fire({ icon: 'success', title: '¡Entrega enviada!', text: 'El profesor ha sido notificado por correo.', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#10b981' });
          const newSubData = await res.json();
          setSubmissions(prev => ({ ...prev, [moduleId]: newSubData.submission }));
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Error al registrar la entrega');
        }
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
      } finally {
        setUploading(false);
      }
    };
    input.click();
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

          <div className="lg:col-span-2 space-y-6">
            
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
                  const safeKey = module._id || module.id || `module-${module.order}`;
                  const isUrlContent = module.content?.trim().startsWith('http://') || module.content?.trim().startsWith('https://');
                  
                  const isAssignment = moduleType === 'actividad' || moduleType === 'pdf';
                  const mySubmission = submissions[safeKey];

                  return (
                    <div key={safeKey} className={`${theme.bgCard} border ${theme.border} rounded-xl p-5 hover:border-emerald-500/30 transition-colors group`}>
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

                          {isAssignment ? (
                            <div className="mt-3 space-y-3">
                              {/* ✅ BOTÓN DE DESCARGA DEL PROFESOR USANDO EL PROXY */}
                              <a
                                href={getProxyDownloadUrl(module.assignmentFileUrl || module.content, module.title + '.pdf')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-semibold group/link"
                              >
                                <FaDownload className="w-4 h-4" />
                                Descargar Material / Consigna
                              </a>

                              {mySubmission ? (
                                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 space-y-3">
                                  <div className="flex items-center gap-2 text-sm flex-wrap">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      mySubmission.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400' : 
                                      mySubmission.status === 'rechazado' ? 'bg-rose-500/20 text-rose-400' : 
                                      'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      Estado: {mySubmission.status.toUpperCase()}
                                    </span>
                                    <span className="text-slate-500 text-xs">
                                      Subido el: {new Date(mySubmission.submittedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {mySubmission.feedback && (
                                    <div className="p-3 rounded bg-violet-500/10 border border-violet-500/20">
                                      <p className="text-xs text-violet-300 font-semibold mb-1 flex items-center gap-1">
                                        <FaLightbulb className="w-3 h-3"/> Devolución del Profesor:
                                      </p>
                                      <p className="text-sm text-slate-300 italic">"{mySubmission.feedback}"</p>
                                    </div>
                                  )}
                                  
                                  {/* ✅ BOTÓN DE DESCARGA DE LA ENTREGA DEL ALUMNO USANDO EL PROXY */}
                                  <a 
                                    href={getProxyDownloadUrl(mySubmission.fileUrl, mySubmission.fileName)}
                                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <FaFileAlt className="w-3 h-3"/> Descargar mi entrega: {mySubmission.fileName}
                                  </a>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStudentSubmit(safeKey)}
                                  disabled={uploading}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                                >
                                  {uploading ? <FaSpinner className="animate-spin" /> : <FaFileAlt className="w-4 h-4" />}
                                  {uploading ? 'Subiendo...' : 'Subir mi Entrega Resuelta'}
                                </button>
                              )}
                            </div>
                          ) : moduleType === 'texto' && !isUrlContent ? (
                            <div className="mt-3 p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {module.content}
                            </div>
                          ) : (
                            <a
                              href={module.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300 transition-all text-sm font-semibold group/link"
                            >
                              {moduleType === 'video' ? 'Ver Video' : moduleType === 'pdf' ? 'Abrir PDF' : 'Abrir Enlace'}
                              <FaExternalLinkAlt className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
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