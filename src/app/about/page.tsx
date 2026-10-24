'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// 🔹 ICONOS MINIMALISTAS (Stroke fino, elegantes, temática educativa)
// ─────────────────────────────────────────────────────────────
const Icons = {
  Play: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Quote: () => (
    <svg className="w-8 h-8 text-indigo-500/40" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// 🔹 COMPONENTE PRINCIPAL: AULA VIRTUAL
// ─────────────────────────────────────────────────────────────
export default function AulaVirtualPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Espaciado superior para no chocar con el navbar */}
      <div className="pt-24 sm:pt-32" />
      
      {/* Fondo minimalista: glows sutiles en tonos índigo/violeta (académico/tech) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* ═══════════════════════════════════════════════════════
            HERO SECTION - BIENVENIDA AL AULA
            ═══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 sm:mb-32 mt-40">
          
          {/* Imagen limpia y elegante (Reemplaza la src con la de tu plataforma) */}
          <div className={`relative transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative w-full h-80 sm:h-96 lg:h-[28rem] rounded-3xl overflow-hidden border border-zinc-800 shadow-lg shadow-indigo-900/20">
              <Image
                src="/Aula_Virtual__Aprender_es_Posible-removebg-preview.png" // 👈 CAMBIA ESTO por tu imagen (ej: un laptop elegante o foto del profesor)
                alt="Vista previa del Aula Virtual"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
              
              {/* Badge flotante elegante */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-zinc-950/60 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-300 tracking-wide">Plataforma activa y actualizada</span>
                </div>
              </div>
            </div>
            {/* Decoración sutil de esquina */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-indigo-500/30 rounded-br-2xl hidden sm:block" />
          </div>

          {/* Contenido de texto */}
          <div className={`space-y-8 transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400 mb-4 block">
                Experiencia de Aprendizaje
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.1]">
                Tu Aula Virtual, <br />
                <span className="font-serif italic text-indigo-300">diseñada para tu éxito.</span>
              </h1>
            </div>

            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-light">
              Accede a un entorno de aprendizaje premium, sin distracciones. 
              Hemos curado cada módulo, recurso y clase en vivo para maximizar tu progreso.
            </p>

            <ul className="space-y-4 pt-2">
              {[
                'Clases en vivo interactivas con calidad HD',
                'Biblioteca de recursos y materiales descargables',
                'Seguimiento personalizado de tu avance',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Icons.Check />
                  </span>
                  <span className="text-sm sm:text-base font-light">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/login" // 👈 CAMBIA ESTO por la ruta real de tus cursos
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-indigo-600 text-white font-medium text-sm tracking-wide transition-all duration-300 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/20"
              >
                <span>Ingresar al Aula</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300"><Icons.ArrowRight /></span>
              </Link>
           
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CARACTERÍSTICAS DEL AULA (GRID ELEGANTE)
            ═══════════════════════════════════════════════════════ */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Todo lo que necesitas en <span className="font-serif italic text-indigo-300">un solo lugar</span>
            </h2>
            <p className="text-zinc-400 font-light max-w-2xl mx-auto">
              Una experiencia educativa fluida, sin complicaciones técnicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Icons.Play />,
                title: 'Clases en Vivo',
                desc: 'Conéctate en tiempo real, resuelve dudas al instante y participa activamente.',
              },
              {
                icon: <Icons.BookOpen />,
                title: 'Material Exclusivo',
                desc: 'Accede a guías, PDFs y grabaciones de las clases disponibles 24/7.',
              },
              {
                icon: <Icons.Users />,
                title: 'Comunidad Privada',
                desc: 'Interactúa con tus compañeros y docentes en un entorno seguro y profesional.',
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`group p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-indigo-500/30 transition-all duration-500 hover:bg-zinc-900/60 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            TESTIMONIO / FILOSOFÍA
            ═══════════════════════════════════════════════════════ */}
        <section className="mb-24 sm:mb-32 relative rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-16 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <Icons.Quote />
            </div>
            <blockquote className="text-xl sm:text-2xl font-light text-zinc-200 leading-relaxed italic">
              "El objetivo de este aula no es solo transmitir información, sino acompañarte en el proceso de transformar ese conocimiento en resultados reales para tu carrera."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                DR
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Dirección Académica</p>
                <p className="text-xs text-zinc-500">Compromiso con tu crecimiento</p>
              </div>
            </div>
          </div>
        </section>

     

      </div>
    </div>
  );
}