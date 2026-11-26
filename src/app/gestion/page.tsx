'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaShieldAlt,
  FaUsers,
  FaBookOpen,
  FaClipboardCheck,
  FaCog,
  FaArrowRight,
  FaUserGraduate,
  FaCalendarAlt,
  FaVideo
} from 'react-icons/fa';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  accent: 'text-violet-400',
  gradient: 'from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20',
};

// ─────────────────────────────────────────────────────────────
// 🕒 HELPER: Formato de fecha y hora 100% Argentina (UTC-3)
// ─────────────────────────────────────────────────────────────
const formatDateAR = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const getRelativeTime = (dateString: string) => {
  // Forzamos la interpretación en zona horaria de Argentina para comparar correctamente
  const dateStrAR = new Date(dateString).toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const nowStrAR = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  
  const dateObj = new Date(dateStrAR);
  const nowObj = new Date(nowStrAR);
  
  const diffMs = dateObj.getTime() - nowObj.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Obtenemos solo la hora y minuto en formato Argentina
  const timeStr = new Date(dateString).toLocaleTimeString('es-AR', { 
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  if (diffHours < 0) return 'Finalizado';
  if (diffHours < 1) return `En menos de 1 hora (${timeStr})`;
  if (diffHours < 24) return `Hoy a las ${timeStr}`;
  if (diffHours < 48) return `Mañana a las ${timeStr}`;
  
  return new Date(dateString).toLocaleDateString('es-AR', { 
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

// ─────────────────────────────────────────────────────────────
// 🎴 COMPONENTE: Tarjeta de Alerta de Evento Premium
// ─────────────────────────────────────────────────────────────
function EventAlertCard({ event }: { event: any }) {
  const isClase = event.type === 'clase';
  const isReunion = event.type === 'reunion';
  const isExamen = event.type === 'examen';

  let borderColor = 'border-slate-700';
  let bgColor = 'bg-slate-800/50';
  let iconColor = 'text-slate-400';
  let dotColor = 'bg-slate-400';
  let Icon = FaCalendarAlt;

  if (isClase) {
    borderColor = 'border-violet-500/30';
    bgColor = 'bg-violet-500/5';
    iconColor = 'text-violet-400';
    dotColor = 'bg-violet-400';
    Icon = FaVideo;
  } else if (isReunion) {
    borderColor = 'border-emerald-500/30';
    bgColor = 'bg-emerald-500/5';
    iconColor = 'text-emerald-400';
    dotColor = 'bg-emerald-400';
    Icon = FaUsers;
  } else if (isExamen) {
    borderColor = 'border-rose-500/30';
    bgColor = 'bg-rose-500/5';
    iconColor = 'text-rose-400';
    dotColor = 'bg-rose-400';
    Icon = FaClipboardCheck;
  }

  return (
    <div className={`relative flex items-center gap-4 p-4 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg group`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900/50 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white truncate">{event.title}</h4>
        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}></span>
          {getRelativeTime(event.start)}
        </p>
      </div>
      <Link href="/aula/calendario" className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title="Ver calendario">
        <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente de Tarjeta de Módulo (Reutilizable)
// ─────────────────────────────────────────────────────────────
interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  available: boolean;
}

function ModuleCard({ title, description, icon, href, color, available }: ModuleCardProps) {
  return (
    <Link
      href={available ? href : '#'}
      className={`group relative flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        available
          ? `${theme.bgCard} ${theme.border} hover:border-violet-500/50 hover:bg-slate-800/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/20`
          : 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
        {title}
      </h3>

      <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      <div className="flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
        {available ? 'Acceder al módulo' : 'Próximamente'}
        {available && <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────
export default function PanelGestionPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading' || !mounted) return;
      if (status === 'unauthenticated') { router.push('/login'); return; }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const allowedRoles = ['superadmin', 'admin', 'profesor', 'alumno'];
        if (!allowedRoles.includes(payload.role)) { router.push('/'); return; }
        setIsAuthorized(true);
      } catch {
        router.push('/login');
      }
    };
    validateAccess();
  }, [status, session, router, mounted]);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const res = await fetch('/api/calendar/events');
        if (res.ok) {
          const data = await res.json();
          const now = new Date();
          const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          
          const filtered = data
            .filter((e: any) => {
              const startDate = new Date(e.start);
              return startDate >= now && startDate <= in48Hours;
            })
            .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, 3);
            
          setUpcomingEvents(filtered);
        }
      } catch (error) {
        console.error('Error cargando próximos eventos:', error);
      }
    };

    if (isAuthorized) fetchUpcomingEvents();
  }, [isAuthorized]);

  if (status === 'loading' || isAuthorized === null || !mounted) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  const userRole = session?.user?.role || 'alumno';

  const allModules = [
    { title: "Gestión de Usuarios", description: "Administra alumnos, profesores y roles del sistema.", icon: <FaUsers className="w-6 h-6" />, href: "/admin", color: "from-violet-600 to-fuchsia-600", available: true, roles: ["admin", "superadmin"] },
    { title: "Cursos y Materias", description: "Crea y administra tus cursos y revisa a tus alumnos.", icon: <FaBookOpen className="w-6 h-6" />, href: "/aula/cursos", color: "from-emerald-600 to-teal-600", available: true, roles: ["admin", "superadmin", "profesor"] },
    { title: "Mis Cursos", description: "Accede a las clases en vivo, materiales y tareas.", icon: <FaUserGraduate className="w-6 h-6" />, href: "/aula/mis-cursos", color: "from-emerald-600 to-teal-600", available: true, roles: ["alumno", "profesor", "admin", "superadmin"] },
    { title: "Calendario de Clases", description: "Visualiza y agenda clases, reuniones y fechas importantes.", icon: <FaCalendarAlt className="w-6 h-6" />, href: "/aula/calendario", color: "from-violet-600 to-fuchsia-600", available: true, roles: ["alumno", "profesor", "admin", "superadmin"] },
    { title: "Catálogo de Cursos", description: "Explora los cursos disponibles e inscríbete.", icon: <FaBookOpen className="w-6 h-6" />, href: "/aula/cursos-disponibles", color: "from-blue-600 to-indigo-600", available: true, roles: ["alumno"] },
    { title: "Ide y Compilador en la Nube", description: "Escribe, compila y ejecuta código en tu navegador.", icon: <FaBookOpen className="w-6 h-6" />, href: "/aula/ide", color: "from-blue-600 to-indigo-600", available: true, roles: ["alumno", "profesor", "admin", "superadmin"] },
    { title: "Tareas y Calificaciones", description: "Revisa entregas de alumnos y gestiona calificaciones.", icon: <FaClipboardCheck className="w-6 h-6" />, href: "/aula/tareas", color: "from-amber-500 to-orange-600", available: false, roles: ["alumno", "profesor", "admin", "superadmin"] },
    { title: "Configuración", description: "Ajustes generales de la plataforma.", icon: <FaCog className="w-6 h-6" />, href: "/gestion/configuracion", color: "from-slate-600 to-slate-700", available: false, roles: ["admin", "superadmin"] }
  ];

  const visibleModules = allModules.filter(module => module.roles.includes(userRole));

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 mt-40 mb-4">
              <FaShieldAlt className="text-violet-400 text-xs" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-slate-400">
                Panel de {userRole === 'alumno' ? 'Estudiante' : 'Control'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Hola, {session?.user?.name || 'Usuario'}
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              {userRole === 'alumno' ? 'Selecciona un módulo para acceder a tus cursos.' : 'Selecciona un módulo para gestionar el Aula Virtual.'}
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:text-white transition-all text-sm">
            Volver al sitio público
          </Link>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-amber-400" />
              Próximos Eventos
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                {upcomingEvents.length} en las próximas 48hs
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <EventAlertCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleModules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-xs text-slate-500">Sistema de Gestión de Aula Virtual v1.0 · Desarrollado con Next.js & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}