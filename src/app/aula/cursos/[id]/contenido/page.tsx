'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaSpinner, FaPlus, FaYoutube, FaFileAlt, FaFilePdf, FaTrash, FaExternalLinkAlt, FaEdit, FaCheckCircle, FaTimesCircle, FaUsers, FaLayerGroup, FaLink } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = { bg: 'bg-slate-950', bgCard: 'bg-slate-900/80', border: 'border-slate-700/50', textPrimary: 'text-white', textSecondary: 'text-slate-400' };

interface Module {
  _id?: string;
  title: string;
  description: string;
  content: string;
  links: string[];
  pdfs?: string[]; // ✅ Agregado
  type: 'texto' | 'video' | 'enlace' | 'pdf'; // ✅ Agregado 'pdf'
  order: number;
  assignmentType?: 'todos' | 'especificos' | 'grupo';
  assignedStudentIds?: string[];
  customGroupName?: string;
}

interface Submission {
  _id: string;
  studentId: any;
  studentName: string;
  studentEmail: string;
  deliveryLink: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback?: string;
  submittedAt: string;
}

const getStudentId = (student: any) => typeof student === 'string' ? student : (student._id?.$oid ? student._id.$oid : String(student._id));
const getStudentName = (student: any) => {
  if (typeof student === 'string') return `Alumno (ID: ${student.slice(0, 6)}...)`;
  return `${student.name || ''} ${student.lastName || ''}`.trim() || student.email || 'Alumno';
};

export default function CursoContenidoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('alumno');
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '', description: '', content: '', type: 'texto' as 'texto' | 'video' | 'enlace' | 'pdf', links: ['']
  });
  const [assignmentType, setAssignmentType] = useState<'todos' | 'especificos' | 'grupo'>('todos');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customGroupName, setCustomGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // ✅ Estados nuevos para manejo de archivos PDF
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [existingPdfs, setExistingPdfs] = useState<string[]>([]);

  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === 'loading' || !mounted) return;
    if (status === 'unauthenticated') { router.push('/login'); return; }
    setUserRole(session?.user?.role || 'alumno');
    setIsAuthorized(true);
  }, [status, session, router, mounted]);

  const fetchData = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/modules`)
      ]);
      if (courseRes.ok) setCourseStudents((await courseRes.json()).course?.students || []);
      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setCourseTitle(data.courseTitle);
        setModules(data.modules || []);
      }
    } catch (error) { console.error('Error cargando datos:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (status === 'authenticated' && courseId && isAuthorized) fetchData(); }, [status, courseId, isAuthorized]);

  const fetchSubmissions = async (moduleId: string, forceRefresh = false) => {
    const cacheKey = `${courseId}-${moduleId}`;
    if (!forceRefresh && submissions[cacheKey]) return;

    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(prev => ({ ...prev, [cacheKey]: data.submissions || [] }));
      }
    } catch (error) { console.error('Error cargando entregas:', error); }
    finally { setLoadingSubmissions(false); }
  };

  const handleGradeSubmission = async (moduleId: string, submissionId: string, statusGrade: 'aprobado' | 'rechazado', feedback: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusGrade, feedback }),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: statusGrade === 'aprobado' ? '¡Aprobado!' : 'Rechazado', text: 'Se ha notificado al alumno por correo.', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6' });
        fetchSubmissions(moduleId, true);
      } else { throw new Error('Error al guardar'); }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
    }
  };

  const handleEdit = (module: Module) => {
    setFormData({
      title: module.title,
      description: module.description,
      content: module.content,
      type: module.type,
      links: module.links && module.links.length > 0 ? module.links : ['']
    });
    setExistingPdfs(module.pdfs || []); // ✅ Cargar PDFs existentes
    setPdfFiles([]); // ✅ Limpiar nuevos archivos
    setAssignmentType(module.assignmentType || 'todos');
    setSelectedStudentIds(module.assignedStudentIds?.map(String) || []);
    setCustomGroupName(module.customGroupName || '');
    setEditingModuleId(module._id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (moduleId: string) => {
    const result = await Swal.fire({ title: '¿Estás seguro?', text: "Se eliminarán también las entregas de los alumnos.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#0f172a', color: '#f1f5f9' });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
        if (res.ok) {
          if (editingModuleId === moduleId) {
            setFormData({ title: '', description: '', content: '', type: 'texto', links: [''] });
            setExistingPdfs([]);
            setPdfFiles([]);
            setEditingModuleId(null);
          }
          fetchData();
          Swal.fire({ icon: 'success', title: 'Eliminado', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6' });
        }
      } catch (error) { Swal.fire({ icon: 'error', title: 'Error', background: '#0f172a', color: '#f1f5f9' }); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalAssignmentType = assignmentType;
      if (selectedStudentIds.length > 0 && assignmentType === 'todos') finalAssignmentType = customGroupName ? 'grupo' : 'especificos';
      else if (selectedStudentIds.length === 0) finalAssignmentType = 'todos';

      let finalPdfs = [...existingPdfs];

      // ✅ Subir nuevos archivos PDF a Cloudinary a través de tu API
      if (formData.type === 'pdf' && pdfFiles.length > 0) {
        for (const file of pdfFiles) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);

          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || `Error al subir el archivo: ${file.name}`);
          }
          const data = await uploadRes.json();
          finalPdfs.push(data.url);
        }
      }

      const payload = {
        ...formData,
        links: (formData.type === 'enlace' || formData.type === 'video') ? formData.links.filter(l => l.trim() !== '') : [],
        pdfs: finalPdfs, // ✅ Enviamos los PDFs
        assignmentType: finalAssignmentType,
        assignedStudentIds: (finalAssignmentType === 'especificos' || finalAssignmentType === 'grupo') ? selectedStudentIds : [],
        customGroupName: finalAssignmentType === 'grupo' ? customGroupName : undefined,
      };

      const url = editingModuleId ? `/api/courses/${courseId}/modules/${editingModuleId}` : `/api/courses/${courseId}/modules`;
      const method = editingModuleId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setFormData({ title: '', description: '', content: '', type: 'texto', links: [''] });
        setExistingPdfs([]);
        setPdfFiles([]);
        setEditingModuleId(null);
        setAssignmentType('todos');
        setSelectedStudentIds([]);
        setCustomGroupName('');
        fetchData();

        if (!editingModuleId) {
          fetch('/api/notify-new-module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId,
              courseTitle,
              moduleTitle: payload.title,
              moduleType: payload.type,
              classroomUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/aula/cursos/${courseId}/contenido`
            })
          }).catch(err => console.error('Error enviando notificación:', err));
        }

        Swal.fire({ icon: 'success', title: '¡Guardado!', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6' });
      } else { throw new Error('Error al guardar'); }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444' });
    } finally { setSubmitting(false); }
  };

  if (status === 'loading' || isAuthorized === null || !mounted || loading) {
    return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><FaSpinner className="animate-spin text-4xl text-violet-500" /></div>;
  }

  const isProfessor = ['superadmin', 'admin', 'profesor', 'professor'].includes(userRole);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mt-20 mb-8">
          <button onClick={() => router.push('/aula/cursos')} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><FaArrowLeft /></button>
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
                    <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" placeholder="Ej: Introducción" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Contenido *</label>
                    <select value={formData.type} onChange={(e) => {
                      const newType = e.target.value as any;
                      setFormData({ ...formData, type: newType, links: [''] });
                      setPdfFiles([]); // Limpiar archivos al cambiar de tipo
                    }} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
                      <option value="texto">📝 Texto / Instrucciones</option>
                      <option value="video">🎥 Enlace(s) de Video</option>
                      <option value="enlace">🔗 Enlace(s) Externo(s)</option>
                      <option value="pdf">📄 Archivo(s) PDF</option> {/* ✅ Nueva opción */}
                    </select>
                  </div>

                  <div className="space-y-4 p-4 bg-slate-950/50 border border-violet-500/20 rounded-lg">
                    <label className="block text-xs font-medium uppercase tracking-wider text-violet-400 mb-1.5 flex items-center gap-2"><FaUsers className="w-3.5 h-3.5" /> Asignar a:</label>
                    <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-violet-500">
                      <option value="todos">🌍 Todos los alumnos</option>
                      <option value="especificos">🎯 Alumnos específicos</option>
                      <option value="grupo">📁 Grupo Personalizado</option>
                    </select>
                    {assignmentType === 'grupo' && (
                      <input type="text" value={customGroupName} onChange={(e) => setCustomGroupName(e.target.value)} placeholder="Nombre del grupo" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-violet-500" />
                    )}
                    {(assignmentType === 'especificos' || assignmentType === 'grupo') && (
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-700 rounded-lg p-3 bg-slate-900/50">
                        {courseStudents.map((student: any) => {
                          const sId = getStudentId(student);
                          return (
                            <label key={sId} className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:bg-slate-800 p-2 rounded">
                              <input type="checkbox" checked={selectedStudentIds.includes(sId)} onChange={(e) => e.target.checked ? setSelectedStudentIds([...selectedStudentIds, sId]) : setSelectedStudentIds(selectedStudentIds.filter(id => id !== sId))} className="rounded border-slate-600 text-violet-600 focus:ring-violet-500 bg-slate-800 w-4 h-4" />
                              <span className="truncate">{getStudentName(student)}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ✅ RENDERIZADO CONDICIONAL DEL INPUT */}
                  {formData.type === 'texto' ? (
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Contenido (Texto) *</label>
                      <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none" placeholder="Escribe las instrucciones..." />
                    </div>
                  ) : formData.type === 'pdf' ? (
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Archivos PDF *</label>

                      {existingPdfs.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="text-[10px] text-slate-500 uppercase">Archivos ya guardados:</p>
                          {existingPdfs.map((pdfUrl, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-xs">
                              <span className="text-emerald-400 truncate flex-1 flex items-center gap-2">
                                <FaCheckCircle className="w-3 h-3" /> {pdfUrl.split('/').pop() || 'documento.pdf'}
                              </span>
                              <button type="button" onClick={() => setExistingPdfs(existingPdfs.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors">
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => {
                          // ✅ CORRECCIÓN TYPESCRIPT: Extraemos los archivos a una variable local segura
                          if (e.target.files && e.target.files.length > 0) {
                            const newFiles: File[] = [];
                            for (let i = 0; i < e.target.files.length; i++) {
                              newFiles.push(e.target.files[i]);
                            }
                            setPdfFiles(prev => [...prev, ...newFiles]);
                          }
                        }}
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500"
                      />

                      {pdfFiles.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <p className="text-[10px] text-slate-500 uppercase">Nuevos archivos a subir:</p>
                          {pdfFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-2 rounded-lg text-sm">
                              <span className="text-slate-300 truncate flex-1 flex items-center gap-2">
                                <FaFileAlt className="text-violet-400" /> {file.name}
                              </span>
                              <button type="button" onClick={() => setPdfFiles(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors">
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                        {formData.type === 'video' ? 'Enlaces de Video *' : 'Enlaces Externos *'}
                      </label>
                      {formData.links.map((link, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...formData.links];
                              newLinks[index] = e.target.value;
                              setFormData({ ...formData, links: newLinks });
                            }}
                            required
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            placeholder="https://..."
                          />
                          {formData.links.length > 1 && (
                            <button type="button" onClick={() => setFormData({ ...formData, links: formData.links.filter((_, i) => i !== index) })} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-colors">
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1">
                        <FaPlus className="w-3 h-3" /> Agregar otro enlace
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <FaSpinner className="animate-spin" /> : (editingModuleId ? <FaEdit /> : <FaPlus />)}
                      {submitting ? 'Guardando...' : (editingModuleId ? 'Actualizar' : 'Agregar')}
                    </button>
                    {editingModuleId && <button type="button" onClick={() => { setFormData({ title: '', description: '', content: '', type: 'texto', links: [''] }); setExistingPdfs([]); setPdfFiles([]); setEditingModuleId(null); }} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">Cancelar</button>}
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={`${isProfessor ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            <h3 className="text-lg font-bold text-white mb-2">Contenido del Curso ({modules.length})</h3>
            {modules.length === 0 ? (
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-8 text-center`}><p className="text-slate-400">Aún no hay contenido.</p></div>
            ) : (
              modules.map((module) => {
                const moduleId = module._id || String(module.order);
                const moduleSubmissions = submissions[`${courseId}-${moduleId}`] || [];

                return (
                  <div key={moduleId} className={`${theme.bgCard} border ${theme.border} rounded-xl p-5 hover:border-violet-500/30 transition-colors group`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 border border-slate-700">
                          {module.type === 'video' ? <FaYoutube className="text-red-500" /> : module.type === 'enlace' ? <FaLink className="text-blue-400" /> : module.type === 'pdf' ? <FaFilePdf className="text-rose-500" /> : <FaFileAlt className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">Módulo {module.order}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">{module.type}</span>
                            {module.assignmentType && (
                              <span className="text-[10px] uppercase tracking-wider text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <FaLayerGroup className="w-2.5 h-2.5" />
                                {module.assignmentType === 'todos' ? 'Para todos' : `${module.assignedStudentIds?.length || 0} alumnos`}
                                {module.customGroupName && ` (${module.customGroupName})`}
                              </span>
                            )}
                          </div>
                          <h4 className="text-white font-semibold mb-1">{module.title}</h4>
                          {module.description && <p className="text-sm text-slate-400 mb-2">{module.description}</p>}

                          {/* ✅ RENDERIZADO DE CONTENIDO ACTUALIZADO */}
                          <div className="mt-3 space-y-3">
                            {module.type === 'texto' && module.content && module.content.trim() !== '' && (
                              <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">
                                {module.content}
                              </div>
                            )}

                            {(module.type === 'video' || module.type === 'enlace' || module.type === 'pdf') && (
                              <div className="space-y-2">
                                {/* Renderizar PDFs */}
                                {module.type === 'pdf' && module.pdfs && module.pdfs.length > 0 && (
                                  module.pdfs.map((pdfUrl: string, idx: number) => {
                                    const fileName = pdfUrl.split('/').pop() || 'documento.pdf';
                                    return (
                                      <a
                                        key={idx}
                                        href={`/api/download?url=${encodeURIComponent(pdfUrl)}&filename=${encodeURIComponent(fileName)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-sm font-semibold w-full sm:w-auto"
                                      >
                                        <FaFilePdf className="w-4 h-4" />
                                        Descargar PDF {(module.pdfs?.length ?? 0) > 1 ? idx + 1 : ''}
                                      </a>
                                    );
                                  })
                                )}

                                {/* Renderizar Links (Video/Enlace) */}
                                {(module.type === 'video' || module.type === 'enlace') && module.links && module.links.length > 0 && module.links.some((l: string) => l.trim() !== '') ? (
                                  module.links.filter((l: string) => l.trim() !== '').map((link: string, idx: number) => {
                                    const totalValid = module.links.filter((l: string) => l.trim() !== '').length;
                                    return (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold w-full sm:w-auto ${module.type === 'video'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                          }`}
                                      >
                                        {module.type === 'video' ? <FaYoutube className="w-4 h-4" /> : <FaExternalLinkAlt className="w-4 h-4" />}
                                        {module.type === 'video'
                                          ? `Ver Video ${totalValid > 1 ? idx + 1 : ''}`
                                          : `Abrir Enlace ${totalValid > 1 ? idx + 1 : ''}`
                                        }
                                      </a>
                                    );
                                  })
                                ) : (module.type === 'video' || module.type === 'enlace') && module.content && module.content.trim().startsWith('http') ? (
                                  <a
                                    href={module.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold w-full sm:w-auto ${module.type === 'video'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                      }`}
                                  >
                                    {module.type === 'video' ? <FaYoutube className="w-4 h-4" /> : <FaExternalLinkAlt className="w-4 h-4" />}
                                    {module.type === 'video' ? 'Ver Video' : 'Abrir Enlace Externo'}
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {isProfessor && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              <button onClick={() => fetchSubmissions(moduleId)} className="text-xs text-violet-400 hover:text-violet-300 mb-3 flex items-center gap-1 font-semibold">
                                <FaSpinner className={`w-3 h-3 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                                {loadingSubmissions ? 'Cargando...' : `📥 Ver entregas (${moduleSubmissions.length})`}
                              </button>
                              {moduleSubmissions.length > 0 ? (
                                <div className="space-y-3">
                                  {moduleSubmissions.map((sub) => (
                                    <div key={sub._id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-700">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="text-sm font-semibold text-white">{sub.studentName}</p>
                                          <p className="text-[10px] text-slate-500 mt-1">Entregado: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                          {sub.deliveryLink && (
                                            <a href={sub.deliveryLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                                              <FaExternalLinkAlt className="w-3 h-3" /> Ver resolución del alumno
                                            </a>
                                          )}
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold ${sub.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400' : sub.status === 'rechazado' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                          {sub.status.toUpperCase()}
                                        </span>
                                      </div>
                                      <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                                        const status = submitter?.value === 'aprobado' ? 'aprobado' : 'rechazado';
                                        const feedback = (form.querySelector('textarea') as HTMLTextAreaElement)?.value || '';
                                        handleGradeSubmission(moduleId, sub._id, status, feedback);
                                      }} className="space-y-2 mt-3">
                                        <textarea name="feedback" defaultValue={sub.feedback || ''} placeholder="Escribe tu devolución..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" rows={2} />
                                        <div className="flex gap-2">
                                          <button type="submit" name="status" value="aprobado" className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1"><FaCheckCircle className="w-3 h-3" /> Aprobar</button>
                                          <button type="submit" name="status" value="rechazado" className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1"><FaTimesCircle className="w-3 h-3" /> Rechazar</button>
                                        </div>
                                      </form>
                                    </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-500 italic mt-2">Aún no hay entregas.</p>}
                            </div>
                          )}
                        </div>
                      </div>
                      {isProfessor && (
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(module)} className="p-2 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10"><FaEdit /></button>
                          <button onClick={() => handleDelete(moduleId)} className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10"><FaTrash /></button>
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