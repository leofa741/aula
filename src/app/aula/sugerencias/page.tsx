'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = { bg: 'bg-slate-950', bgCard: 'bg-slate-900/80', border: 'border-slate-700/50', textPrimary: 'text-white', textSecondary: 'text-slate-400' };

export default function StudentSuggestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

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
        Swal.fire({
          icon: 'success',
          title: '¡Sugerencia enviada!',
          text: 'Gracias por tu feedback. El equipo docente lo revisará pronto.',
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

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 mt-50">
          <button onClick={() => router.push('/gestion')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaLightbulb className="text-amber-400" /> Buzón de Sugerencias
            </h1>
            <p className="text-slate-400 text-sm mt-1">Tu opinión nos ayuda a mejorar el curso. ¡Escríbenos!</p>
          </div>
        </div>

        <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-6 sm:p-8 shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tu sugerencia o comentario *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none"
                placeholder="Ej: Me gustaría que agregáramos más ejercicios prácticos sobre..."
              />
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}