'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────
// ICONOS SVG (Mismos que en tu login para consistencia)
// ─────────────────────────────────────────────────────────────
const Icons = {
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState({ name: false, email: false, password: false });

  const router = useRouter();

  // Validación en tiempo real
  useEffect(() => {
    setValidation({
      name: name.trim().length >= 3,
      email: /\S+@\S+\.\S+/.test(email),
      password: password.length >= 6,
    });
  }, [name, email, password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validation.name || !validation.email || !validation.password) {
      setError('Por favor, completa todos los campos correctamente.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ Ahora enviamos el nombre y forzamos el rol a 'alumno'
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password,
          role: 'alumno' 
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        toast.success('¡Registro exitoso! Ya puedes iniciar sesión.', { theme: 'colored' });
        router.push('/login');
      } else {
        toast.error(data.message || 'Error al registrar usuario', { theme: 'colored' });
        setError(data.message || 'Error al registrar el usuario.');
      }
    } catch (err) {
      setLoading(false);
      toast.error('Error de conexión con el servidor', { theme: 'colored' });
      setError('No pudimos conectar con el servidor.');
    }
  };

  const gradients = {
    primary: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'from-cyan-400 via-blue-500 to-violet-500',
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden p-4">
      {/* Background ambiental (igual que en login) */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" aria-hidden="true" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fadeInUp">
        <div className={`absolute -inset-1 bg-gradient-to-r ${gradients.accent} rounded-3xl opacity-20 blur-xl`} aria-hidden="true" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-purple-900/30">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/Aula_Virtual__Aprender_es_Posible-removebg-preview.png"
              alt="Logo Aula Virtual"
              width={200}
              height={120}
              className="relative transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2">Crear Cuenta</h2>
          <p className="text-center text-slate-400 text-sm mb-8">Únete a nuestra plataforma educativa</p>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-shake">
              <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                <Icons.X />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icons.User />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border transition-all duration-300 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    validation.name ? 'border-emerald-500/50 focus:ring-emerald-500/30' : name ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-purple-500/30'
                  }`}
                />
                {name && (
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${validation.name ? 'text-emerald-400' : 'text-red-400'}`}>
                    {validation.name ? <Icons.Check /> : <Icons.X />}
                  </span>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icons.Mail />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border transition-all duration-300 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    validation.email ? 'border-emerald-500/50 focus:ring-emerald-500/30' : email ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-purple-500/30'
                  }`}
                />
                {email && (
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${validation.email ? 'text-emerald-400' : 'text-red-400'}`}>
                    {validation.email ? <Icons.Check /> : <Icons.X />}
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icons.Lock />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border transition-all duration-300 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    validation.password ? 'border-emerald-500/50 focus:ring-emerald-500/30' : password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-purple-500/30'
                  }`}
                />
              </div>
              {password.length > 0 && !validation.password && (
                <p className="mt-1.5 text-xs text-red-400">La contraseña debe tener al menos 6 caracteres.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !validation.name || !validation.email || !validation.password}
              className={`group relative w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-500 overflow-hidden ${
                loading || !validation.name || !validation.email || !validation.password
                  ? 'bg-slate-700/50 cursor-not-allowed text-slate-500'
                  : `bg-gradient-to-r ${gradients.primary} text-white hover:shadow-2xl hover:shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99]`
              }`}
            >
              {loading ? (
                <>
                  <Icons.Spinner />
                  <span>Registrando...</span>
                </>
              ) : (
                <span className="relative z-10">Crear Cuenta</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}