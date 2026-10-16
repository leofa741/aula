'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';

// @ts-ignore react-toastify's stylesheet has no TypeScript module declaration.
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faUser } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function EditUserPage() {
  // 👈 1. Agregamos 'status' para saber cuándo terminó de cargar la sesión
  const { data: session, status } = useSession(); 
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState<null | {
    name: string; lastName: string; address: string; city: string;
    zipCode: string; email: string; phone: string; role: string; img: string;
  }>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    
    // 👈 2. Esperar a que la sesión termine de cargar antes de hacer cualquier cosa
    if (status === 'loading') return;

    const fetchUser = async () => {
      try {
        // 👈 3. Buscar el token en la sesión O en localStorage (fallback)
        const token = session?.user?.token || localStorage.getItem('token');
        
        if (!token) {
          console.warn('Token no encontrado en session.user.token ni en localStorage');
          setError('No se encontró el token de sesión. Por favor, inicia sesión nuevamente.');
          router.push('/login');
          return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!['admin', 'superadmin'].includes(decodedToken.role)) {
          router.push('/admin'); // Redirigir al panel si no tiene permisos
          return;
        }

        const response = await fetch(`/api/admin/users?id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al obtener el usuario');
        const data = await response.json();
        
        setUser({
          name: data.name || '', lastName: data.lastName || '', address: data.address || '',
          city: data.city || '', zipCode: data.zipCode || '', email: data.email || '',
          phone: data.phone || '', role: data.role || 'alumno', img: data.img || '',
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push('/admin'), 2000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId, session, status, router]); // 👈 4. Agregamos 'status' a las dependencias

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (user) setUser(prev => ({ ...prev!, [name]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // 👈 5. Mismo método seguro para obtener el token al guardar
      const token = session?.user?.token || localStorage.getItem('token');
      
      if (!token) {
        setError('No se encontró el token de sesión.');
        router.push('/login');
        return;
      }

      const formData = new FormData(e.currentTarget); // 👈 Forma más limpia de obtener los datos del form
      
      // Aseguramos que el rol se envíe correctamente
      formData.set('role', user!.role);

      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el usuario');
      }

      toast.success('Usuario actualizado con éxito');
      setTimeout(() => router.push('/admin'), 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // 👈 6. Unificar el estado de carga
  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Cargando...</div>;
  }
  
  if (error) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-400">{error}</div>;
  }
  
  if (!user) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Usuario no encontrado.</div>;
  }

  const inputClasses = "w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 opacity-40" style={{ filter: 'blur(150px)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mt-40 mx-auto px-4 sm:px-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" /> Volver al listado
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/30">
            <FontAwesomeIcon icon={faUser} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Usuario</h1>
            <p className="text-slate-400 text-sm">Modifica los datos y el rol del usuario en el sistema.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateUser} className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Nombre *</label>
              <input type="text" name="name" value={user.name} onChange={handleChange} required className={inputClasses} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Apellido *</label>
              <input type="text" name="lastName" value={user.lastName} onChange={handleChange} required className={inputClasses} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Correo Electrónico</label>
            <input type="email" value={user.email} disabled className={`${inputClasses} bg-slate-800 text-slate-500 cursor-not-allowed`} />
            <p className="text-[10px] text-slate-500 mt-1">El correo no se puede modificar por seguridad.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Ciudad</label>
              <input type="text" name="city" value={user.city} onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Teléfono</label>
              <input type="text" name="phone" value={user.phone} onChange={handleChange} className={inputClasses} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Rol en el Sistema *</label>
            <select name="role" value={user.role} onChange={handleChange} required className={inputClasses}>
              <option value="superadmin">Super Administrador</option>
              <option value="admin">Administrador</option>
              <option value="profesor">Profesor</option>
              <option value="alumno">Alumno</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Imagen de Perfil</label>
            <input type="file" id="img" name="img" accept="image/*" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 transition" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button type="submit" className="flex-1 py-3 px-4 font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faSave} className="w-4 h-4" /> Guardar Cambios
            </button>
            <button type="button" onClick={() => router.push('/admin')} className="flex-1 py-3 px-4 font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <ToastContainer theme="colored" position="top-right" autoClose={3000} />
    </div>
  );
}