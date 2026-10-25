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
  FaUserGraduate
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
      className={`group relative flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${available
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

  // ✅ 1. Montaje seguro
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔒 2. Validación de acceso
  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading' || !mounted) return;
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const allowedRoles = ['superadmin', 'admin', 'profesor', 'alumno'];
        if (!allowedRoles.includes(payload.role)) {
          router.push('/');
          return;
        }
        setIsAuthorized(true);
      } catch {
        router.push('/login');
      }
    };

    validateAccess();
  }, [status, session, router, mounted]);

  // ✅ 3. Loader de seguridad
  if (status === 'loading' || isAuthorized === null || !mounted) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  // ─────────────────────────────────────────────────────────────
  // ✅ 4. Definición de Módulos por Rol
  // ─────────────────────────────────────────────────────────────
  const userRole = session?.user?.role || 'alumno';

  const allModules = [
    {
      title: "Gestión de Usuarios",
      description: "Administra alumnos, profesores y roles del sistema. Asigna permisos y revisa cuentas.",
      icon: <FaUsers className="w-6 h-6" />,
      href: "/admin",
      color: "from-violet-600 to-fuchsia-600",
      available: true,
      roles: ["admin", "superadmin"] // 👈 Solo admins
    },
    {
      title: "Cursos y Materias",
      description: "Crea y administra tus cursos, organiza módulos de contenido y revisa a tus alumnos.",
      icon: <FaBookOpen className="w-6 h-6" />,
      href: "/aula/cursos",
      color: "from-emerald-600 to-teal-600",
      available: true,
      roles: ["admin", "superadmin", "profesor"] // 👈 Admins y Profesores
    },
    {
      title: "Mis Cursos",
      description: "Accede a las clases en vivo, materiales y tareas de los cursos en los que estás inscrito.",
      icon: <FaUserGraduate className="w-6 h-6" />,
      href: "/aula/mis-cursos",
      color: "from-emerald-600 to-teal-600",
      available: true,
      roles: ["alumno", "profesor", "admin", "superadmin"] // 👈 Todos, pero principal para alumnos
    },
    {
      title: "Catálogo de Cursos",
      description: "Explora los cursos disponibles e inscríbete para comenzar a aprender.",
      icon: <FaBookOpen className="w-6 h-6" />,
      href: "/aula/cursos-disponibles",
      color: "from-blue-600 to-indigo-600",
      available: true,
      roles: ["alumno"] // 👈 Principalmente para alumnos
    },
    {
      title: "Ide y Compilador en la Nube",
      description: "Escribe, compila y ejecuta código en múltiples lenguajes directamente desde tu navegador.",
      icon: <FaBookOpen className="w-6 h-6" />,
      href: "/aula/ide",
      color: "from-blue-600 to-indigo-600",
      available: true,
      roles: ["alumno", "profesor", "admin", "superadmin"]
    },
    {
      title: "Tareas y Calificaciones",
      description: "Revisa entregas de alumnos, deja feedback y gestiona el libro de calificaciones.",
      icon: <FaClipboardCheck className="w-6 h-6" />,
      href: "/aula/tareas",
      color: "from-amber-500 to-orange-600",
      available: false, // En construcción
      roles: ["alumno", "profesor", "admin", "superadmin"]
    },
    {
      title: "Configuración",
      description: "Ajustes generales de la plataforma, métodos de pago o integración de servicios.",
      icon: <FaCog className="w-6 h-6" />,
      href: "/gestion/configuracion",
      color: "from-slate-600 to-slate-700",
      available: false, // En construcción
      roles: ["admin", "superadmin"] // 👈 Solo admins
    }
  ];

  // Filtramos los módulos que el usuario actual tiene permiso para ver
  const visibleModules = allModules.filter(module => module.roles.includes(userRole));

  // ─────────────────────────────────────────────────────────────
  // ✅ 5. Contenido Principal: Hub de Redirección
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 py-12 sm:py-20">

        {/* Header del Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
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
              {userRole === 'alumno'
                ? 'Selecciona un módulo para acceder a tus cursos y materiales de estudio.'
                : 'Selecciona un módulo para comenzar a gestionar el Aula Virtual.'}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 hover:text-white transition-all text-sm"
          >
            Volver al sitio público
          </Link>
        </div>

        {/* Grid de Módulos (Filtrado por rol) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleModules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>

        {/* Footer informativo */}
        <div className="mt-16 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-xs text-slate-500">
            Sistema de Gestión de Aula Virtual v1.0 · Desarrollado con Next.js & Tailwind CSS
          </p>
        </div>

      </div>
    </div>
  );
}