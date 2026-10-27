'use client'

import Link from 'next/link';
import { useEffect } from 'react';


import { ArrowLeft, Code2, Terminal } from 'lucide-react';
import CodePlayground from '@/app/components/code/CodePlayground';
import {  useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function IdePage() {

    const { data: session, status } = useSession();
    const router = useRouter();


    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100">
                <Terminal className="w-12 h-12 animate-spin text-indigo-400" />
                <span className="ml-4 text-lg font-medium">Cargando IDE...</span>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100">
                <p className="text-lg font-medium">Redirigiendo al login...</p>
            </div>
        );
    }

    return null; // Evita renderizar nada mientras se verifica la sesión
}










  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden flex flex-col">
      
      {/* Fondo sutil con glow para dar profundidad (estilo premium) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ═══════════════════════════════════════════════════════
            HEADER MINIMALISTA
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-40 mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/gestion" 
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-indigo-500/50 hover:bg-zinc-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Volver</span>
            </Link>
            
            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Code2 className="w-6 h-6 text-indigo-400" />
                Laboratorio de Código
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Entorno de desarrollo para practicar C, Java, Python y JavaScript.
              </p>
            </div>
          </div>

          {/* Badge de estado */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Compiladores en línea activos
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ÁREA DEL IDE (CON MUCHO ESPACIO)
            ═══════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full min-h-0">
          {/* 
             Nota: El componente CodePlayground tiene una altura fija de h-[500px].
             Si quieres que ocupe TODA la altura restante de la pantalla, 
             ve a CodePlayground.tsx y cambia 'h-[500px]' por 'h-full'.
          */}
          <CodePlayground />
        </div>

      </div>
    </div>
  );
}