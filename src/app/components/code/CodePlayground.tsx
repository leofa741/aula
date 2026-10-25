'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, Code2, AlertCircle } from 'lucide-react';

// ✅ Enlaces públicos y gratuitos de OneCompiler. 
const LANGUAGES = [
  { 
    id: 'javascript', 
    name: 'JavaScript (Nativo)', 
    defaultCode: `console.log("¡Hola desde el Aula Virtual!");\n\nconst suma = (a, b) => a + b;\nconsole.log("2 + 3 =", suma(2, 3));` 
  },
  { 
    id: 'c', 
    name: 'C (GCC)', 
    embedUrl: 'https://onecompiler.com/embed/c' 
  },
  { 
    id: 'java', 
    name: 'Java', 
    embedUrl: 'https://onecompiler.com/embed/java' 
  },
  { 
    id: 'python', 
    name: 'Python', 
    embedUrl: 'https://onecompiler.com/embed/python' 
  },
];

export default function CodePlayground() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState<string>(LANGUAGES[0].defaultCode ?? '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleLanguageChange = (langId: string) => {
    const selectedLang = LANGUAGES.find((l) => l.id === langId);
    if (selectedLang) {
      setLanguage(langId);
      if (langId === 'javascript') {
        setCode(selectedLang.defaultCode ?? '');
      }
      setOutput('');
      setHasError(false);
      setIframeKey(prev => prev + 1); // Recargar el iframe para limpiar el estado anterior
    }
  };

  const runJavaScript = () => {
    setIsRunning(true);
    setHasError(false);
    setOutput('');

    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args: any[]) => {
      logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
    };

    try {
      // eslint-disable-next-line no-eval
      eval(code); 
      setOutput(logs.join('\n') || 'Código ejecutado correctamente (sin salida en consola).');
    } catch (err: any) {
      setHasError(true);
      setOutput(`❌ Error de ejecución:\n${err.message}`);
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  const isNativeJS = language === 'javascript';
  const currentLangData = LANGUAGES.find(l => l.id === language);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50">
      {/* Barra superior del IDE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium text-zinc-300">
            {isNativeJS ? 'Editor de Práctica (JS)' : `Compilador en la Nube (${currentLangData?.name})`}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {isNativeJS && (
            <button
              onClick={runJavaScript}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Ejecutar
            </button>
          )}
        </div>
      </div>

      {/* ✅ ÁREA DE TRABAJO DINÁMICA: 
          Si es JS: 2 columnas (Editor + Consola)
          Si NO es JS: 1 columna (El iframe ocupa todo el ancho) */}
      <div className={`grid ${isNativeJS ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} h-[500px]`}>
        
        {/* LADO IZQUIERDO (o completo): Editor de Código o Iframe del Compilador */}
        <div className={`${isNativeJS ? 'border-b lg:border-b-0 lg:border-r' : ''} border-zinc-800 relative`}>
          {isNativeJS ? (
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              }}
            />
          ) : (
            // ✅ El iframe ahora ocupa el 100% del ancho, haciendo el botón "Run" enorme y visible
            <iframe
              key={iframeKey}
              src={currentLangData?.embedUrl}
              className="w-full h-full border-0 bg-zinc-900"
              title={`Compilador de ${currentLangData?.name}`}
              allow="clipboard-write"
            />
          )}
        </div>

        {/* ✅ LADO DERECHO: Consola de Salida (SOLO se renderiza si es JavaScript) */}
        {isNativeJS && (
          <div className="bg-zinc-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Consola de Salida</span>
              </div>
              {output && !isRunning && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${hasError ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {hasError ? <AlertCircle className="w-3 h-3" /> : 'OK'}
                  {hasError ? 'Error' : 'Éxito'}
                </span>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              <pre className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${hasError ? 'text-rose-300' : 'text-zinc-300'}`}>
                {output || <span className="text-zinc-600 italic">// La salida de console.log aparecerá aquí...</span>}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}