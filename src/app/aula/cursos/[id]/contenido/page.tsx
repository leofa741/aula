'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaPlus, FaFilePdf, FaYoutube, FaFileAlt, FaTrash, FaExternalLinkAlt, FaEdit } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

interface Module {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  content: string;
  type?: 'texto' | 'video' | 'pdf' | 'enlace';
  order: number;
}

const formatUrl = (url: string) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function CursoContenidoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'texto' as 'texto' | 'video' | 'pdf' | 'enlace',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchModules = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`);
      if (res.ok) {
        const data = await res.json();
        setCourseTitle(data.courseTitle);
        setModules(data.modules || []);
      } else {
        router.push('/aula/cursos');
      }
    } catch (error) {
      console.error('Error cargando módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && courseId) fetchModules();
  }, [status, courseId]);

  const handleEdit = (module: Module) => {
    const moduleId = module._id || module.id || (module.order ? module.order.toString() : null);
    
    if (!moduleId) {
      Swal.fire({
        icon: 'error',
        title: 'Error de datos',
        text: 'Este módulo no tiene un identificador válido para ser editado.',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
      });
      return;
    }

    setFormData({
      title: module.title,
      description: module.description || '',
      content: module.content,
      type: (module.type as any) || 'texto',
    });
    setEditingModuleId(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (module: Module) => {
    const moduleId = module._id || module.id || (module.order ? module.order.toString() : null);

    if (!moduleId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el módulo para eliminar.',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f1f5f9',
      customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          if (editingModuleId === moduleId) {
            setFormData({ title: '', description: '', content: '', type: 'texto' });
            setEditingModuleId(null);
          }
          fetchModules();
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El módulo ha sido eliminado correctamente.',
            background: '#0f172a',
            color: '#f1f5f9',
            confirmButtonColor: '#8b5cf6',
            customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
          });
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Error al eliminar el módulo');
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message,
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#ef4444',
          customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingModuleId 
        ? `/api/courses/${courseId}/modules/${editingModuleId}` 
        : `/api/courses/${courseId}/modules`;
      
      const method = editingModuleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ title: '', description: '', content: '', type: 'texto' });
        setEditingModuleId(null);
        fetchModules();
        Swal.fire({
          icon: 'success',
          title: editingModuleId ? '¡Módulo actualizado!' : '¡Módulo agregado!',
          text: editingModuleId ? 'El contenido se ha actualizado correctamente.' : 'El contenido se ha añadido al curso correctamente.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#8b5cf6',
          customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
        });
      } else {
        throw new Error(data.error || 'Error al guardar el módulo');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string | undefined) => {
    if (!type) return <FaFileAlt className="text-slate-400" />;
    switch (type) {
      case 'video': return <FaYoutube className="text-red-500" />;
      case 'pdf': return <FaFilePdf className="text-rose-500" />;
      case 'enlace': return <FaFileAlt className="text-blue-400" />;
      default: return <FaFileAlt className="text-slate-400" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-violet-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 mt-40 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/aula/cursos')} 
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestionar Contenido</h1>
            <p className="text-slate-400 text-sm">Curso: <span className="text-violet-400 font-medium">{courseTitle}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-6 sticky top-6`}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {editingModuleId ? <FaEdit className="text-violet-400" /> : <FaPlus className="text-violet-400" />} 
                {editingModuleId ? 'Editar Módulo' : 'Nuevo Módulo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Título *</label>
                  <input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm" 
                    placeholder="Ej: Introducción al tema"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Contenido *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm"
                  >
                    <option value="texto">📝 Texto / Instrucciones</option>
                    <option value="video">🎥 Enlace de Video (YouTube/Vimeo)</option>
                    <option value="pdf">📄 Enlace a PDF / Drive</option>
                    <option value="enlace">🔗 Enlace Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    {formData.type === 'texto' ? 'Contenido (Texto)' : 'URL del Contenido *'}
                  </label>
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    required 
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm resize-none" 
                    placeholder={formData.type === 'texto' ? 'Escribe las instrucciones o el contenido aquí...' : 'Ej: https://youtube.com/watch?v=...'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Descripción Corta (Opcional)</label>
                  <input 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm" 
                    placeholder="Breve resumen del módulo"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <FaSpinner className="animate-spin" /> : (editingModuleId ? <FaEdit /> : <FaPlus />)}
                    {submitting ? 'Guardando...' : (editingModuleId ? 'Actualizar Módulo' : 'Agregar Módulo')}
                  </button>
                  
                  {editingModuleId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData({ title: '', description: '', content: '', type: 'texto' });
                        setEditingModuleId(null);
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Contenido del Curso ({modules.length})</h3>
            
            {modules.length === 0 ? (
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-8 text-center`}>
                <p className="text-slate-400">Aún no hay contenido en este curso.</p>
                <p className="text-slate-500 text-sm mt-1">Usa el formulario para agregar el primer módulo.</p>
              </div>
            ) : (
              modules.map((module, index) => {
                const moduleType = module.type ? String(module.type).toLowerCase().trim() : 'texto';
                const safeKey = module._id || module.id || `order-${module.order}` || `module-${index}`;

                return (
                  <div 
                    key={safeKey} 
                    className={`${theme.bgCard} border ${theme.border} rounded-xl p-5 hover:border-violet-500/30 transition-colors group`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 border border-slate-700">
                          {getIcon(module.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                              Módulo {module.order || index + 1}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                              {moduleType}
                            </span>
                          </div>
                          <h4 className="text-white font-semibold mb-1">{module.title}</h4>
                          {module.description && <p className="text-sm text-slate-400 mb-2">{module.description}</p>}
                          
                          {/* ✅ AQUÍ ESTÁ LA MEJORA: Botón claro y clicable para URLs, PDFs y Videos */}
                          {moduleType === 'texto' ? (
                            <div className="mt-2 p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {module.content}
                              </p>
                            </div>
                          ) : (
                            <a 
                              href={formatUrl(module.content)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300 transition-all text-sm font-semibold group/link"
                            >
                              <FaExternalLinkAlt className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                              Abrir {moduleType === 'video' ? 'Video' : moduleType === 'pdf' ? 'Documento PDF' : 'Enlace Externo'}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(module)}
                          className="p-2 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                          title="Editar módulo"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(module)}
                          className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar módulo"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}