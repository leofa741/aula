'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

// ─────────────────────────────────────────────────────────────
// 🕒 HELPERS DE ZONA HORARIA (ARGENTINA UTC-3)
// ─────────────────────────────────────────────────────────────

const formatDateToArgentinaInput = (date: Date | string | null | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
};

const parseArgentinaInputToDate = (inputValue: string | null | undefined): string | null => {
  if (!inputValue) return null;
  return new Date(`${inputValue}:00-03:00`).toISOString();
};

const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

// ─────────────────────────────────────────────────────────────
// 🔹 COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function CalendarioAulaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ VALIDACIÓN DE SEGURIDAD: Si es alumno, redirigirlo inmediatamente
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role === 'alumno') {
      router.push('/aula/mis-cursos');
      return;
    }
  }, [status, session, router]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'alumno') {
      fetchEvents();
    }
  }, [status, session]);

  const handleDateClick = (arg: any) => {
    const defaultStart = arg.dateStr.includes('T') ? arg.dateStr : `${arg.dateStr}T08:00:00-03:00`;
    const startDate = new Date(defaultStart);

    Swal.fire({
      title: 'Agendar Nuevo Evento',
      html: `
        <input id="event-title" class="swal2-input" placeholder="Título (Ej: Clase de Historia)">
        <select id="event-type" class="swal2-select" style="width: 80%; margin: 0 auto; display: block;">
          <option value="clase">📚 Clase</option>
          <option value="reunion">🤝 Reunión</option>
          <option value="examen">📝 Examen</option>
        </select>
        <label style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px; display: block;">Fecha y Hora de Inicio:</label>
        <input id="event-start" class="swal2-input" type="datetime-local" value="${formatDateToArgentinaInput(startDate)}">
      `,
      background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6', cancelButtonColor: '#475569',
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
      didOpen: () => { (document.getElementById('event-title') as HTMLInputElement)?.focus(); },
      preConfirm: () => {
        const title = (document.getElementById('event-title') as HTMLInputElement)?.value;
        const type = (document.getElementById('event-type') as HTMLSelectElement)?.value;
        const startInput = (document.getElementById('event-start') as HTMLInputElement)?.value;
        
        if (!title || !startInput) { 
          Swal.showValidationMessage('El título y la fecha son obligatorios'); 
          return false; 
        }
        return { title, type, startInput };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const startInput = result.value.startInput as string;
          const parsedStart = parseArgentinaInputToDate(startInput);
          if (!parsedStart) throw new Error('Fecha inválida');

          const endDate = new Date(new Date(parsedStart).getTime() + 60 * 60 * 1000).toISOString();

          const res = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: result.value.title, type: result.value.type, start: parsedStart, end: endDate })
          });

          if (res.ok) {
            await fetchEvents();
            Swal.fire({ icon: 'success', title: '¡Evento agendado!', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6', timer: 1500, showConfirmButton: false });
          } else { throw new Error('Error al guardar'); }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el evento', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
        }
      }
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    
    Swal.fire({
      title: event.title,
      html: `
        <p><strong>Tipo:</strong> ${event.extendedProps?.type || 'General'}</p>
        <p><strong>Inicio:</strong> ${formatDisplayDate(event.start)}</p>
        ${event.end ? `<p><strong>Fin:</strong> ${formatDisplayDate(event.end)}</p>` : ''}
      `,
      background: '#0f172a', color: '#f1f5f9',
      showDenyButton: true, showCancelButton: true,
      confirmButtonText: '✏️ Editar', denyButtonText: '🗑️ Eliminar', cancelButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6', denyButtonColor: '#ef4444', cancelButtonColor: '#475569',
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Editar Evento',
          html: `
            <input id="edit-title" class="swal2-input" value="${event.title}" placeholder="Título">
            <select id="edit-type" class="swal2-select" style="width: 80%; margin: 0 auto; display: block;">
              <option value="clase" ${event.extendedProps?.type === 'clase' ? 'selected' : ''}>📚 Clase</option>
              <option value="reunion" ${event.extendedProps?.type === 'reunion' ? 'selected' : ''}>🤝 Reunión</option>
              <option value="examen" ${event.extendedProps?.type === 'examen' ? 'selected' : ''}>📝 Examen</option>
            </select>
            <label style="color: #94a3b8; font-size: 0.9rem; margin-top: 10px; display: block;">Fecha y Hora de Inicio (Hora Argentina):</label>
            <input id="edit-start" class="swal2-input" type="datetime-local" value="${formatDateToArgentinaInput(event.start)}">
          `,
          background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6', cancelButtonColor: '#475569',
          showCancelButton: true, confirmButtonText: 'Guardar Cambios',
          preConfirm: () => {
            const title = (document.getElementById('edit-title') as HTMLInputElement)?.value;
            const type = (document.getElementById('edit-type') as HTMLSelectElement)?.value;
            const startInput = (document.getElementById('edit-start') as HTMLInputElement)?.value;
            if (!title || !startInput) { Swal.showValidationMessage('Título y fecha son obligatorios'); return false; }
            return { title, type, startInput };
          }
        }).then(async (editResult) => {
          if (editResult.isConfirmed && editResult.value) {
            try {
              const startInput = editResult.value.startInput as string;
              const startIso = parseArgentinaInputToDate(startInput);
              if (!startIso) throw new Error('Fecha inválida');

              const endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();

              const res = await fetch(`/api/calendar/events/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editResult.value.title, type: editResult.value.type, start: startIso, end: endIso })
              });

              if (res.ok) {
                await fetchEvents();
                Swal.fire({ icon: 'success', title: '¡Evento actualizado!', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6', timer: 1500, showConfirmButton: false });
              } else { throw new Error('Error al actualizar'); }
            } catch (error) {
              Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
            }
          }
        });

      } else if (result.isDenied) {
        Swal.fire({
          title: '¿Estás seguro?',
          text: `Se eliminará "${event.title}" permanentemente.`,
          icon: 'warning',
          background: '#0f172a', color: '#f1f5f9',
          showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#475569',
          confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
        }).then(async (deleteResult) => {
          if (deleteResult.isConfirmed) {
            try {
              const res = await fetch(`/api/calendar/events/${event.id}`, { method: 'DELETE' });
              if (res.ok) {
                await fetchEvents();
                Swal.fire({ icon: 'success', title: '¡Evento eliminado!', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false });
              } else { throw new Error('Error al eliminar'); }
            } catch (error) {
              Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
            }
          }
        });
      }
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />
      </div>
    );
  }

  // Si por alguna razón pasa la validación inicial pero no es autorizado, no mostrar nada
  if (session?.user?.role === 'alumno') return null;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 mt-40">
          <button onClick={() => router.push('/gestion')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <FaCalendarAlt className="text-violet-400" />
              Calendario del Aula Virtual
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona tus clases y reuniones en horario de Argentina (UTC-3).</p>
          </div>
        </div>

        <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 sm:p-6 shadow-xl`}>
          <style jsx global>{`
            .fc { color: #f1f5f9 !important; font-family: inherit; }
            .fc-theme-standard td, .fc-theme-standard th { border-color: #334155 !important; }
            .fc-col-header-cell-cushion { color: #94a3b8 !important; text-decoration: none !important; }
            .fc-daygrid-day-number { color: #e2e8f0 !important; text-decoration: none !important; }
            .fc-button { background-color: #1e293b !important; border-color: #475569 !important; color: #f1f5f9 !important; text-transform: capitalize !important; }
            .fc-button:hover { background-color: #334155 !important; }
            .fc-button-active { background-color: #8b5cf6 !important; border-color: #8b5cf6 !important; }
            .fc-event { border-radius: 6px !important; padding: 2px 4px !important; font-size: 0.85rem !important; cursor: pointer !important; }
            .fc-event-title { font-weight: 500 !important; }
            .fc-scrollgrid { border-color: #334155 !important; }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            locale="es"
            buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            contentHeight="70vh"
          />
        </div>
      </div>
    </div>
  );
}