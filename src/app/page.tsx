'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden selection:bg-amber-500/30">
      {/* Efecto de fondo sutil y de movimiento lento (calma) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse duration-[4000ms]" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] animate-pulse duration-[5000ms]" />
      </div>

      <div className="relative z-10 text-center space-y-10 max-w-2xl mx-auto">
        {/* Icono animado minimalista (Reloj / Tiempo) */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping duration-[3000ms]" />
          <div className="relative w-24 h-24 bg-slate-900/50 backdrop-blur-md rounded-full border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-900/10">
            <svg 
              className="w-10 h-10 text-amber-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Texto principal con jerarquía tipográfica */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-rose-300 bg-clip-text text-transparent">
            A Tu Tiempo
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-md mx-auto font-light">
            Estamos preparando una nueva experiencia. <br className="hidden sm:block" />
            Todo llega a su debido momento.
          </p>
        </div>

        {/* Badge de estado elegante */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/50 backdrop-blur-md border border-slate-800 text-slate-400 text-sm font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Sitio en desarrollo
          </div>
        </div>

        {/* Contacto discreto para no perder oportunidades */}
        <div className="pt-4">
          <p className="text-slate-600 text-sm">
            ¿Consultas?{' '}
            <a 
              href="mailto:info@atutiempo.com.ar" 
              className="text-amber-400/80 hover:text-amber-300 transition-colors duration-300 underline underline-offset-4 decoration-amber-500/30"
            >
              info@atutiempo.com.ar
            </a>
          </p>
        </div>
      </div>
 
      {/* Footer minimalista */}
      <div className="absolute bottom-6 text-slate-700 text-[10px] md:text-xs tracking-[0.2em] uppercase">
        © {new Date().getFullYear()} A Tu Tiempo · Todos los derechos reservados
      </div>
    </div>
  );
}