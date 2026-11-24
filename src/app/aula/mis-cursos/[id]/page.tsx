'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaVideo, FaFileAlt, FaExternalLinkAlt, FaLightbulb, FaCheckCircle, FaQuoteLeft, FaLink, FaExternalLinkAlt as FaExtLink } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = { bg: 'bg-slate-950', bgCard: 'bg-slate-900/80', border: 'border-slate-700/50', textPrimary: 'text-white', textSecondary: 'text-slate-400' };

interface Module {
  _id?: string;
  title: string;
  description: string;
  content: string;
  links: string[];
  type: 'texto' | 'video' | 'enlace';
  order: number;
  assignmentType?: 'todos' | 'especificos' | 'grupo';
  assignedStudentIds?: string[];
}

interface Submission {
  _id: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback?: string;
  deliveryLink?: string;
  submittedAt: string;
}

export default function StudentCourseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Record<string, Submission | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deliveryLink, setDeliveryLink] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules`);
        if (res.ok) {
          const data = await res.json();
          setCourseTitle(data.courseTitle);
          
          const studentId = session?.user?.id;
          const visibleModules = (data.modules || []).filter((module: any) => {
            if (module.assignmentType === 'todos') return true;
            if (module.assignmentType === 'especificos' || module.assignmentType === 'grupo') {
              return module.assignedStudentIds?.includes(studentId);
            }
            return true;
          });
          setModules(visibleModules);

          const newSubs: Record<string, Submission | null> = {};
          for (const module of visibleModules) {
            const moduleId = module._id || String(module.order);
            const subRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}/submissions`);
            if (subRes.ok) {
              const subData = await subRes.json();
              const mySub = subData.submissions?.find((s: any) => s.studentId === studentId || s.studentEmail === session?.user?.email);
              newSubs[moduleId] = mySub || null;
            }
          }
          setSubmissions(newSubs);
        }
      } catch (error) { console.error('Error:', error); }
      finally { setLoading(false); }
    };

    if (status === 'authenticated' && courseId && session?.user?.id) fetchData();
  }, [status, courseId, session?.user?.id, session?.user?.email, router]);

  const handleComplete = async (moduleId: string) => {
    if (!deliveryLink.trim()) {
      Swal.fire({ icon: 'warning', title: 'Falta el enlace', text: 'Por favor, pega el enlace a tu resolución (Drive, Docs, GitHub, etc.).', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: session?.user?.id,
          studentName: session?.user?.name,
          studentEmail: session?.user?.email,
          deliveryLink: deliveryLink.trim()
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [moduleId]: data.submission }));
        setDeliveryLink('');
        Swal.fire({ icon: 'success', title: '¡Entregado!', text: 'Tu profesor ha sido notificado y revisará tu resolución.', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#10b981', timer: 3000, showConfirmButton: false });
      } else {
        throw new Error('No se pudo registrar la entrega');
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
    } finally { setSubmitting(false); }
  };

  if (status === 'loading' || loading) {
    return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><FaSpinner className="animate-spin text-4xl text-emerald-500" /></div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 mt-20">
          <button onClick={() => router.push('/aula/mis-cursos')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><FaArrowLeft /></button>
          <div>
            <h1 className="text-2xl font-bold text-white">{courseTitle}</h1>
            <p className="text-slate-400 text-sm">Material de estudio y recursos</p>
          </div>
        </div>

        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-8 text-center`}><p className="text-slate-400">No hay contenido disponible para ti en este curso.</p></div>
          ) : (
            modules.map((module) => {
              const moduleId = module._id || String(module.order);
              const mySubmission = submissions[moduleId];

              return (
                <div key={moduleId} className={`${theme.bgCard} border ${theme.border} rounded-xl p-6 hover:border-emerald-500/30 transition-colors`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 border border-slate-700">
                      {module.type === 'video' ? <FaVideo className="text-red-500" /> : module.type === 'enlace' ? <FaLink className="text-blue-400" /> : <FaFileAlt className="text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Módulo {module.order}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">{module.type}</span>
                        {mySubmission?.status === 'aprobado' && (
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <FaCheckCircle className="w-2.5 h-2.5" /> Aprobado
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                      {module.description && <p className="text-sm text-slate-400 mb-3">{module.description}</p>}

                      <div className="mt-3 space-y-4">
                        {module.type === 'texto' && module.content && (
                          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">{module.content}</div>
                        )}
                        
                        {(module.type === 'video' || module.type === 'enlace') && module.links && module.links.length > 0 ? (
                          <div className="space-y-2">
                            {module.links.map((link: string, idx: number) => (
                              <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold w-full sm:w-auto ${module.type === 'video' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'}`}>
                                {module.type === 'video' ? <FaVideo className="w-4 h-4" /> : <FaExtLink className="w-4 h-4" />}
                                {module.type === 'video' ? `Ver Video ${module.links.length > 1 ? idx + 1 : ''}` : `Abrir Enlace ${module.links.length > 1 ? idx + 1 : ''}`}
                              </a>
                            ))}
                          </div>
                        ) : (module.type === 'video' || module.type === 'enlace') && module.content ? (
                          <a href={module.content} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${module.type === 'video' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            {module.type === 'video' ? <FaVideo className="w-4 h-4" /> : <FaExtLink className="w-4 h-4" />}
                            {module.type === 'video' ? 'Ver Video' : 'Abrir Enlace Externo'}
                          </a>
                        ) : null}

                        {/* Zona de Entrega del Alumno */}
                        {mySubmission ? (
                          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${mySubmission.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400' : mySubmission.status === 'rechazado' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                Estado: {mySubmission.status.toUpperCase()}
                              </span>
                              <span className="text-slate-500 text-xs">{new Date(mySubmission.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {mySubmission.deliveryLink && (
                              <a href={mySubmission.deliveryLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                <FaExtLink className="w-3 h-3" /> Ver mi enlace de entrega
                              </a>
                            )}
                            {mySubmission.feedback && (
                              <div className="p-3 rounded bg-violet-500/10 border border-violet-500/20">
                                <p className="text-xs text-violet-300 font-semibold mb-1 flex items-center gap-1"><FaLightbulb className="w-3 h-3"/> Devolución del Profesor:</p>
                                <p className="text-sm text-slate-300 italic">"{mySubmission.feedback}"</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 space-y-3">
                            <p className="text-sm text-slate-300 font-medium">📤 Entrega tu resolución</p>
                            <input 
                              type="url" 
                              value={deliveryLink} 
                              onChange={(e) => setDeliveryLink(e.target.value)} 
                              placeholder="Pega aquí el enlace a tu trabajo (Google Drive, Docs, GitHub, etc.)" 
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button 
                              onClick={() => handleComplete(moduleId)} 
                              disabled={submitting} 
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-semibold transition-all"
                            >
                              {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                              {submitting ? 'Enviando...' : 'Enviar Resolución'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}