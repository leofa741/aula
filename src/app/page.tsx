'use client';



export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Efecto de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">
        {/* Icono animado */}
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping duration-1000" />
          <div className="relative w-28 h-28 bg-slate-900/80 backdrop-blur-sm rounded-full border border-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-900/20">
            <svg 
              className="w-12 h-12 text-rose-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
              />
            </svg>
          </div>
        </div>

        {/* Texto principal */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">
            En Construcción
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
            Estamos preparando algo increíble para vos. <br className="hidden sm:block" />
            Volvemos pronto con una nueva experiencia.
          </p>
        </div>
      

        {/* Badge de estado */}
        <div className="pt-4">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-slate-400 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Nuevo proyecto en desarrollo
          </div>
        </div>
      </div>
 
      {/* Footer minimalista opcional */}
      <div className="absolute bottom-6 text-slate-600 text-xs tracking-wider uppercase">
        © {new Date().getFullYear()} · Próximamente
      </div>
    </div>
  );
}