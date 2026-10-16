'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faUserGraduate, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import PanelGestionPage from '../gestion/page';

interface User {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: 'superadmin' | 'admin' | 'profesor' | 'alumno' | string;
  img?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const validateAndFetch = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        router.push('/');
        return;
      }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) {
        toast.error('Acceso denegado');
        router.push('/');
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!['admin', 'superadmin'].includes(decodedToken.role)) {
          toast.error('Acceso restringido a administradores');
          router.push('/');
          return;
        }

        await fetchUsers(token);
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error al validar sesión:', err);
        toast.error('Sesión inválida');
        router.push('/');
      }
    };

    validateAndFetch();
  }, [session, status, router]);

  const fetchUsers = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        throw new Error('Error al cargar los usuarios');
      }
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
      toast.error('Hubo un error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = session?.user?.token || localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (userId === session?.user?.id) { toast.error('No puedes eliminar tu propia cuenta.'); return; }

    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará el usuario de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f1f5f9',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#475569',
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al eliminar el usuario');
      toast.success('Usuario eliminado con éxito');
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      toast.error('Hubo un error al eliminar el usuario');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // 🔹 AGRUPAR POR ROLES DEL AULA VIRTUAL
  const admins = users.filter(u => ['admin', 'superadmin'].includes(u.role));
  const profesores = users.filter(u => u.role === 'profesor');
  const alumnos = users.filter(u => u.role === 'alumno');

  const cardClasses = "border border-slate-700/50 rounded-xl shadow-lg p-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-colors";
  const tableHeaderClasses = "p-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800/50";
  const tableCellClasses = "p-4 text-sm text-slate-300 border-t border-slate-700/50";

  const UsersTable = ({ usersList, title, icon, emptyMessage, roleColor }: {
    usersList: User[]; title: string; icon: React.ReactNode; emptyMessage: string; roleColor: string;
  }) => (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center border ${roleColor}`}>
          {icon}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColor}`}>
          {usersList.length}
        </span>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        {usersList.length === 0 ? (
          <div className={cardClasses}><p className="text-slate-400 text-center py-6">{emptyMessage}</p></div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Nombre</th>
                <th className={tableHeaderClasses}>Correo</th>
                <th className={tableHeaderClasses}>Ciudad</th>
                <th className={tableHeaderClasses}>Teléfono</th>
                <th className={tableHeaderClasses}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(user => (
                <tr key={user._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className={tableCellClasses}>
                    <div className="flex items-center gap-3">
                      {user.img ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-600/50">
                          <Image src={user.img} alt="Avatar" fill className="object-cover bg-slate-700" />
                        </div>
                      ) : <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs">{user.name[0]}</div>}
                      <span className="font-medium text-white">{user.name} {user.lastName}</span>
                    </div>
                  </td>
                  <td className={`${tableCellClasses} break-all max-w-[200px]`}>{user.email}</td>
                  <td className={tableCellClasses}>{user.city || '—'}</td>
                  <td className={tableCellClasses}>{user.phone || '—'}</td>
                  <td className={tableCellClasses}>
                    <div className="flex gap-2">
                      <Link href={`/admin/edit-user/${user._id}`} className="bg-amber-600/90 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-[0.98]">Editar</Link>
                      <button onClick={() => handleDeleteUser(user._id)} className="bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-[0.98]">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Versión móvil simplificada */}
      <div className="md:hidden space-y-4">
        {usersList.length === 0 ? (
          <div className={cardClasses}><p className="text-slate-400 text-center py-6">{emptyMessage}</p></div>
        ) : (
          usersList.map(user => (
            <div key={user._id} className={cardClasses}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-white">{user.name} {user.lastName}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/edit-user/${user._id}`} className="bg-amber-600/90 text-white px-3 py-1 rounded text-xs">Editar</Link>
                  <button onClick={() => handleDeleteUser(user._id)} className="bg-rose-600/90 text-white px-3 py-1 rounded text-xs">Eliminar</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 mt-40 sm:px-6 py-8">
        
        {/* Header con Navegación a Módulos */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/30">
                <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
              </span>
              Panel de Administración
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Gestiona usuarios y accede a los módulos del Aula Virtual.
            </p>
          </div>
          
          {/* 🔗 ACCESOS RÁPIDOS A MÓDULOS (Aquí iremos construyendo el LMS) */}
          <div className="flex flex-wrap gap-3">
            <Link href="/aula/cursos" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white transition-all active:scale-[0.98]">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="w-4 h-4" /> 
              <span>Gestión de Cursos</span>
            </Link>
            <Link href="/gestion" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white transition-all active:scale-[0.98]">
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" /> 
              <span>Volver al Panel</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-lg">Cargando usuarios...</p>
          </div>
        ) : (
          <>
            <UsersTable
              usersList={admins}
              title="Administradores del Sistema"
              icon={<FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-violet-400" />}
              roleColor="bg-violet-500/15 text-violet-400 border-violet-500/30"
              emptyMessage="No hay administradores registrados."
            />
            <div className="my-8 border-t border-slate-700/50" />
            <UsersTable
              usersList={profesores}
              title="Profesores"
              icon={<FontAwesomeIcon icon={faChalkboardTeacher} className="w-5 h-5 text-emerald-400" />}
              roleColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              emptyMessage="No hay profesores registrados. ¡Crea uno para empezar a armar cursos!"
            />
            <div className="my-8 border-t border-slate-700/50" />
            <UsersTable
              usersList={alumnos}
              title="Alumnos"
              icon={<FontAwesomeIcon icon={faUserGraduate} className="w-5 h-5 text-amber-400" />}
              roleColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
              emptyMessage="No hay alumnos registrados."
            />
          </>
        )}
      </div>
    </div>
  );
}