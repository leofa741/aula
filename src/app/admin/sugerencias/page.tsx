'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaLightbulb, FaCheck, FaEnvelopeOpen } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = { bg: 'bg-slate-950', bgCard: 'bg-slate-900/80', border: 'border-slate-700/50', textPrimary: 'text-white', textSecondary: 'text-slate-400' };

interface Suggestion {
  _id: string;
  studentName: string;
  studentEmail: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  courseId?: { title: string } | null;
}

export default function AdminSuggestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/suggestions');
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error cargando sugerencias:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') fetchSuggestions();
  }, [status]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: 'PUT' });
      if (res.ok) {
        setSuggestions(prev => prev.map(s => s._id === id ? { ...s, isRead: true } : s));
        Swal.fire({ icon: 'success', title: 'Marcada como leída', timer: 1500, showConfirmButton: false, background: '#0f172a', color: '#f1f5f9' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar', background: '#0f172a', color: '#f1f5f9' });
    }
  };

  if (status === 'loading' || loading) {
    return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><FaSpinner className="animate-spin text-4xl text-violet-500" /></div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 mt-50">
          <button onClick={() => router.push('/gestion')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaLightbulb className="text-amber-400" /> Panel de Sugerencias
            </h1>
            <p className="text-slate-400 text-sm mt-1">Revisa los comentarios y feedback de los alumnos.</p>
          </div>
        </div>

        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
              <FaLightbulb className="mx-auto text-4xl text-slate-600 mb-4" />
              <p className="text-slate-400">Aún no hay sugerencias registradas.</p>
            </div>
          ) : (
            suggestions.map((sug) => (
              <div key={sug._id} className={`${theme.bgCard} border ${sug.isRead ? 'border-slate-800 opacity-70' : 'border-amber-500/30'} rounded-xl p-5 transition-all hover:shadow-lg`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {sug.studentName}
                      {!sug.isRead && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Nueva"></span>}
                    </h3>
                    <p className="text-xs text-slate-400">{sug.studentEmail} · {new Date(sug.createdAt).toLocaleDateString('es-AR')}</p>
                    {sug.courseId && <p className="text-xs text-violet-400 mt-1">Curso: {sug.courseId.title}</p>}
                  </div>
                  {!sug.isRead && (
                    <button 
                      onClick={() => markAsRead(sug._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-medium transition-colors"
                    >
                      <FaCheck className="w-3 h-3" /> Marcar como leída
                    </button>
                  )}
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap">
                  {sug.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}