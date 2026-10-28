'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaPlus, FaFilePdf, FaYoutube, FaFileAlt, FaTrash, FaExternalLinkAlt, FaEdit, FaFileWord, FaCheckCircle, FaTimesCircle, FaDownload } from 'react-icons/fa';
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
  type?: 'texto' | 'video' | 'pdf' | 'enlace' | 'actividad';
  assignmentFileUrl?: string;
  order: number;
}

interface Submission {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileName: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback?: string;
  submittedAt: string;
}

const formatUrl = (url: string) => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const getProxyDownloadUrl = (url: string, filename: string) => {
  if (!url) return '#';
  return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
};

export default function CursoContenidoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // ✅ 1. TODOS LOS useState VAN AL PRINCIPIO, ANTES DE CUALQUIER RETURN
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('alumno');
  
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'texto' as 'texto' | 'video' | 'pdf' | 'enlace' | 'actividad',
  });
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ✅ 2. TODOS LOS useEffect VAN DESPUÉS DE LOS useState
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading' || !mounted) {
      console.log('⏳ Cargando sesión o componente...');
      return;
    }

    // 🔍 ESTE CONSOLE.LOG ES CLAVE: Nos dirá qué tiene realmente tu sesión
    console.log('🔍 DATOS REALES DE LA SESIÓN NEXTAUTH:', session);

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    let role = 'alumno'; 

    // 1. Intentamos obtenerlo de la sesión de NextAuth
    if (session?.user?.role) {
      role = session.user.role;
    } 
    // 2. Si no está, intentamos obtenerlo del token en localStorage
    else {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role) role = payload.role;
        } catch (e) {
          console.error('Error decodificando token:', e);
        }
      }
    }

    console.log('✅ ROL DETECTADO FINAL:', role);
    setUserRole(role);
    setIsAuthorized(true);
  }, [status, session, router, mounted]);

  // ✅ 3. Funciones auxiliares
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
    if (status === 'authenticated' && courseId && isAuthorized) fetchModules();
  }, [status, courseId, isAuthorized]);
  const fetchSubmissions = async (moduleOrder: number, forceRefresh = false) => {
    const submissionModuleId = `module-${moduleOrder}`;
    
    // ✅ Si NO es forzado y ya tenemos los datos, usamos el caché (para no saturar)
    if (!forceRefresh && submissions[submissionModuleId]) return;
    
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${submissionModuleId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [submissionModuleId]: data.submissions }));
      }
    } catch (error) {
      console.error('Error cargando entregas:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (moduleOrder: number, submissionId: string, statusGrade: 'aprobado' | 'rechazado', feedback: string) => {
    const submissionModuleId = `module-${moduleOrder}`;
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${submissionModuleId}/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusGrade, feedback }),
      });

      if (res.ok) {
        Swal.fire({ 
          icon: 'success', 
          title: 'Corregido', 
          text: `El alumno ha sido marcado como ${statusGrade}.`, 
          background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6' 
        });
        
        // ✅ AQUÍ ESTÁ LA MAGIA: El 'true' obliga a recargar los datos frescos del servidor
        fetchSubmissions(moduleOrder, true); 
        
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar');
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
    }
  };

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
    setFileToUpload(null);
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
      text: "Se eliminarán también las entregas de los alumnos.",
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
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
        if (res.ok) {
          if (editingModuleId === moduleId) {
            setFormData({ title: '', description: '', content: '', type: 'texto' });
            setFileToUpload(null);
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
      let finalContent = formData.content;
      let assignmentFileUrl = '';

      console.log('🔍 DEBUG: Tipo seleccionado:', formData.type);
      console.log('🔍 DEBUG: Archivo a subir:', fileToUpload);

      // 1. Validación: Si es actividad o pdf, debe haber un archivo (si es nuevo)
      if ((formData.type === 'actividad' || formData.type === 'pdf') && !editingModuleId && !fileToUpload) {
        throw new Error('Debes seleccionar un archivo PDF o DOC para este tipo de módulo.');
      }

      // 2. Subida del archivo si existe
      if ((formData.type === 'pdf' || formData.type === 'actividad') && fileToUpload) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', fileToUpload);
        
        console.log('⏳ Subiendo archivo a Cloudinary...');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
        
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Error al subir el archivo: ${errText}`);
        }
        
        const uploadData = await uploadRes.json();
        console.log('✅ Archivo subido. URL:', uploadData.url);

        if (formData.type === 'actividad') {
          assignmentFileUrl = uploadData.url;
        } else {
          finalContent = uploadData.url;
        }
      }

      // 3. Parche para que el backend no rechace el "content" vacío en actividades
      if (!finalContent || finalContent.trim() === '') {
        finalContent = 'Archivo adjunto a la actividad';
      }

      const url = editingModuleId 
        ? `/api/courses/${courseId}/modules/${editingModuleId}` 
        : `/api/courses/${courseId}/modules`;
      
      const method = editingModuleId ? 'PUT' : 'POST';

      const payload = { 
        ...formData, 
        content: finalContent, 
        assignmentFileUrl // <-- ESTO ES LO QUE EL BACKEND DEBE RECIBIR
      };
      
      console.log('📦 Enviando al backend:', payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ title: '', description: '', content: '', type: 'texto' });
        setFileToUpload(null);
        setEditingModuleId(null);
        fetchModules();
        Swal.fire({
          icon: 'success',
          title: editingModuleId ? '¡Módulo actualizado!' : '¡Módulo agregado!',
          text: 'El contenido se ha guardado correctamente.',
          background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6'
        });
      } else {
        throw new Error(data.error || 'Error al guardar el módulo');
      }
    } catch (error: any) {
      console.error('❌ ERROR EN handleSubmit:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444'
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
      case 'actividad': return <FaFileWord className="text-blue-500" />;
      default: return <FaFileAlt className="text-slate-400" />;
    }
  };

  const allowedProfessorRoles = ['superadmin', 'admin', 'profesor', 'professor'];
  const isProfessor = allowedProfessorRoles.includes(userRole);

  console.log('Mounted:', mounted, 'Status:', status, 'IsAuthorized:', isAuthorized, 'UserRole:', userRole, 'IsProfessor:', isProfessor);

  // ✅ 4. LOS RETURNS CONDICIONALES VAN AL FINAL, DESPUÉS DE TODOS LOS HOOKS
  if (status === 'loading' || isAuthorized === null || !mounted || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-violet-500" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  // ✅ 5. RENDERIZADO JSX
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mt-40  mb-8">
          <button onClick={() => router.push('/aula/cursos')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestionar Contenido</h1>
            <p className="text-slate-400 text-sm">Curso: <span className="text-violet-400 font-medium">{courseTitle}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {isProfessor && (
            <div className="lg:col-span-1">
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-6 sticky top-6`}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  {editingModuleId ? <FaEdit className="text-violet-400" /> : <FaPlus className="text-violet-400" />} 
                  {editingModuleId ? 'Editar Módulo' : 'Nuevo Módulo'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Título *</label>
                    <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm" placeholder="Ej: Introducción al tema" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Contenido *</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm">
                      <option value="texto">📝 Texto / Instrucciones</option>
                      <option value="video">🎥 Enlace de Video (YouTube/Vimeo)</option>
                      <option value="pdf">📄 Subir Archivo PDF</option>
                      <option value="enlace">🔗 Enlace Externo</option>
                      <option value="actividad">📚 Actividad / Entrega (Requiere tarea del alumno)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                      {formData.type === 'texto' ? 'Contenido (Texto)' : (formData.type === 'pdf' || formData.type === 'actividad') ? 'Archivo PDF/DOC *' : 'URL del Contenido *'}
                    </label>
                    
                    {(formData.type === 'pdf' || formData.type === 'actividad') ? (
                      <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} required={!editingModuleId} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500" />
                    ) : (
                      <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm resize-none" placeholder={formData.type === 'texto' ? 'Escribe las instrucciones o el contenido aquí...' : 'Ej: https://youtube.com/watch?v=...'} />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Descripción Corta (Opcional)</label>
                    <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-sm" placeholder="Breve resumen del módulo" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {submitting ? <FaSpinner className="animate-spin" /> : (editingModuleId ? <FaEdit /> : <FaPlus />)}
                      {submitting ? 'Guardando...' : (editingModuleId ? 'Actualizar Módulo' : 'Agregar Módulo')}
                    </button>
                    
                    {editingModuleId && (
                      <button type="button" onClick={() => { setFormData({ title: '', description: '', content: '', type: 'texto' }); setFileToUpload(null); setEditingModuleId(null); }} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={`${isProfessor ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
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
                const submissionModuleId = `module-${module.order}`;
                const moduleSubmissions = submissions[submissionModuleId] || [];

                return (
                  <div key={safeKey} className={`${theme.bgCard} border ${theme.border} rounded-xl p-5 hover:border-violet-500/30 transition-colors group`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 border border-slate-700">
                          {getIcon(module.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">Módulo {module.order || index + 1}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">{moduleType}</span>
                          </div>
                          <h4 className="text-white font-semibold mb-1">{module.title}</h4>
                          {module.description && <p className="text-sm text-slate-400 mb-2">{module.description}</p>}
                          
                          {moduleType === 'texto' ? (
                            <div className="mt-2 p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{module.content}</p>
                            </div>
                          ) : (moduleType === 'video' || moduleType === 'enlace') ? (
                            <a href={formatUrl(module.content)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300 transition-all text-sm font-semibold group/link">
                              <FaExternalLinkAlt className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                              Abrir {moduleType === 'video' ? 'Video' : 'Enlace Externo'}
                            </a>
                          ) : null}

                          {(moduleType === 'actividad' || moduleType === 'pdf') && (
                            <div className="mt-4 space-y-4">
                              {moduleType === 'pdf' && !module.assignmentFileUrl && (
                                <a href={formatUrl(module.content)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-semibold">
                                  <FaExternalLinkAlt className="w-4 h-4" /> Abrir Documento PDF
                                </a>
                              )}

                              {module.assignmentFileUrl && (
                                <a href={getProxyDownloadUrl(module.assignmentFileUrl, module.title + '.pdf')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-semibold">
                                  <FaDownload className="w-4 h-4" /> Descargar Consigna del Profesor
                                </a>
                              )}

                              {isProfessor && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                  <button onClick={() => fetchSubmissions(module.order)} className="text-xs text-violet-400 hover:text-violet-300 mb-3 flex items-center gap-1 font-semibold">
                                    <FaSpinner className={`w-3 h-3 ${loadingSubmissions ? 'animate-spin' : ''}`} /> 
                                    {loadingSubmissions ? 'Cargando entregas...' : `📥 Ver entregas de alumnos y Corregir (${moduleSubmissions.length})`}
                                  </button>
                                  
                                  {moduleSubmissions.length > 0 ? (
                                    <div className="space-y-3">
                                      {moduleSubmissions.map((sub) => (
                                        <div key={sub._id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-700">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <p className="text-sm font-semibold text-white">{sub.studentName}</p>
                                              <p className="text-xs text-slate-400">{sub.studentEmail}</p>
                                              <p className="text-[10px] text-slate-500 mt-1">Entregado: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${sub.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400' : sub.status === 'rechazado' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                              {sub.status.toUpperCase()}
                                            </span>
                                          </div>
                                          
                                          <a href={getProxyDownloadUrl(sub.fileUrl, sub.fileName)} className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-3">
                                            <FaFileWord className="w-3 h-3" /> Descargar entrega: {sub.fileName}
                                          </a>
                                          
                                          <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            const formData = new FormData(form);
                                            
                                            const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                                            const status = submitter?.value === 'aprobado' ? 'aprobado' : 'rechazado';
                                            const feedback = (formData.get('feedback') as string) || '';

                                            handleGradeSubmission(module.order, sub._id, status, feedback);
                                          }} className="space-y-2">
                                            <textarea 
                                              name="feedback" 
                                              defaultValue={sub.feedback || ''} 
                                              placeholder="Escribe tu devolución o calificación..." 
                                              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" 
                                              rows={2} 
                                            />
                                            <div className="flex gap-2">
                                              <button type="submit" name="status" value="aprobado" className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1">
                                                <FaCheckCircle className="w-3 h-3"/> Aprobar
                                              </button>
                                              <button type="submit" name="status" value="rechazado" className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1">
                                                <FaTimesCircle className="w-3 h-3"/> Rechazar
                                              </button>
                                            </div>
                                          </form>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic mt-2">Aún no hay entregas para este módulo.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isProfessor && (
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(module)} className="p-2 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors" title="Editar módulo"><FaEdit /></button>
                          <button onClick={() => handleDelete(module)} className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Eliminar módulo"><FaTrash /></button>
                        </div>
                      )}
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