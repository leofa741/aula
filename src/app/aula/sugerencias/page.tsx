'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaLightbulb, FaCheckCircle, FaClock, FaCheck } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = { bg: 'bg-slate-950', bgCard: 'bg-slate-900/80', border: 'border-slate-700/50', textPrimary: 'text-white', textSecondary: 'text-slate-400' };

interface Suggestion {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function StudentSuggestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchMySuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions');
      if (res.ok) {
        const data = await res.json();
        setMySuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error cargando mis sugerencias:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMySuggestions();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        setMessage('');
        await fetchMySuggestions(); // Recargar la lista inmediatamente
        
        Swal.fire({
          icon: 'success',
          title: '¡Sugerencia enviada!',
          text: 'El equipo docente revisará tu mensaje pronto.',
          background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#10b981', timer: 3000, showConfirmButton: false
        });
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar la sugerencia', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><FaSpinner className="animate-spin text-4xl text-violet-500" /></div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 mt-20">
          <button onClick={() => router.push('/gestion')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaLightbulb className="text-amber-400" /> Buzón de Sugerencias
            </h1>
            <p className="text-slate-400 text-sm mt-1">Tu opinión nos ayuda a mejorar. ¡Escríbenos!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Envío */}
          <div className="lg:col-span-1">
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-6 shadow-xl sticky top-6`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaLightbulb className="text-amber-400" /> Nueva Sugerencia
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tu mensaje *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none text-sm"
                    placeholder="Ej: Me gustaría que agregáramos más ejercicios prácticos..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
                </button>
              </form>
            </div>
          </div>

          {/* Historial de Sugerencias */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaClock className="text-slate-400" /> Mis Sugerencias Enviadas
            </h2>
            
            {loadingSuggestions ? (
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
                <FaSpinner className="animate-spin text-2xl text-amber-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Cargando historial...</p>
              </div>
            ) : mySuggestions.length === 0 ? (
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
                <FaLightbulb className="mx-auto text-3xl text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">Aún no has enviado ninguna sugerencia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mySuggestions.map((sug) => (
                  <div key={sug._id} className={`${theme.bgCard} border ${sug.isRead ? 'border-slate-700' : 'border-amber-500/30'} rounded-xl p-5 transition-all hover:shadow-lg`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-slate-500">
                        {new Date(sug.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {/* ✅ ETIQUETA DE ESTADO */}
                      {sug.isRead ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                          <FaCheck className="w-3 h-3" /> Leída por el docente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium animate-pulse">
                          <FaClock className="w-3 h-3" /> Pendiente de revisión
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                      {sug.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}