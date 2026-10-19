'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaBookOpen, FaPlus, FaSpinner, FaChalkboardTeacher, FaUsers, FaCalendarAlt, FaEdit, FaTrash, FaVideo, FaRegSmile, FaCheckCircle, FaQuoteLeft, FaLightbulb } from 'react-icons/fa';
import Swal from 'sweetalert2';

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  border: 'border-slate-700/50',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
};

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  status: 'activo' | 'borrador' | 'finalizado';
  professor: { name: string; email: string };
  students: any[];
  createdAt: string;
}

export default function CursosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // 📝 Estado para las notas (clave: studentId ESTABLE)
  const [studentNotes, setStudentNotes] = useState<Record<string, { note: string; isVisibleToStudent: boolean }>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'borrador' as 'activo' | 'borrador' | 'finalizado',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchCourses();
  }, [status]);



  // 📝 Inicializar notas cuando se abre el modal
  useEffect(() => {
    if (selectedCourse) {
      // 👇 AGREGA ESTA LÍNEA: Abre la consola del navegador (F12) y mira qué llega
      console.log("🔍 DATOS DE ALUMNOS QUE LLEGAN DEL BACKEND:", selectedCourse.students);

      const initialNotes: Record<string, { note: string; isVisibleToStudent: boolean }> = {};

      selectedCourse.students?.forEach((student: any) => {
        const studentId = typeof student === 'string'
          ? student
          : (typeof student._id === 'object' && student._id.$oid ? student._id.$oid : String(student._id));

        initialNotes[studentId] = {
          note: student.note || '', // Ahora sí debería tener el texto guardado
          isVisibleToStudent: student.isNoteVisible || false
        };
      });

      setStudentNotes(initialNotes);
    }
  }, [selectedCourse]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingCourseId ? 'PUT' : 'POST';
      const url = editingCourseId ? `/api/courses?id=${editingCourseId}` : '/api/courses';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setIsFormModalOpen(false);
        setEditingCourseId(null);
        setFormData({ title: '', description: '', status: 'borrador' });
        fetchCourses();

        Swal.fire({
          icon: 'success',
          title: editingCourseId ? '¡Curso actualizado!' : '¡Curso creado!',
          text: data.message || 'La operación se realizó correctamente.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#8b5cf6',
          customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
        });
      } else {
        throw new Error(data.error || 'Error en la operación');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo conectar con el servidor.',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleEditClick = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      status: course.status,
    });
    setEditingCourseId(course._id);
    setSelectedCourse(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = async (course: Course) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará permanentemente el curso "${course.title}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/courses?id=${course._id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setSelectedCourse(null);
        fetchCourses();
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El curso ha sido eliminado.', background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#8b5cf6', customClass: { popup: 'border border-slate-700/50 rounded-2xl' } });
      } else {
        throw new Error(data.error || 'Error al eliminar');
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#0f172a', color: '#f1f5f9', confirmButtonColor: '#ef4444', customClass: { popup: 'border border-slate-700/50 rounded-2xl' } });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <FaSpinner className="animate-spin text-4xl text-violet-500" />
      </div>
    );
  }

  const canCreate = session?.user?.role === 'admin' || session?.user?.role === 'superadmin' || session?.user?.role === 'profesor';

  // 🔍 FUNCIONES AUXILIARES PARA EXTRAER DATOS DE FORMA SEGURA
  const getStudentId = (student: any) => {
    if (typeof student === 'string') return student;
    if (student._id) return typeof student._id === 'object' && student._id.$oid ? student._id.$oid : String(student._id);
    return `fallback-${Math.random()}`;
  };

  const getStudentName = (student: any) => {
    if (typeof student === 'string') return `Alumno (ID: ${student.slice(0, 6)}...)`;
    const fullName = `${student.name || ''} ${student.lastName || ''}`.trim();
    return fullName || student.email || 'Alumno sin nombre';
  };

  const getStudentEmail = (student: any) => {
    if (typeof student === 'string') return '';
    return student.email || '';
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();


  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto mt-40 px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
              <FaBookOpen className="text-violet-400" />
              Gestión de Cursos
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Administra las materias, asigna profesores y organiza el contenido.</p>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setEditingCourseId(null);
                setFormData({ title: '', description: '', status: 'borrador' });
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium text-sm hover:shadow-lg hover:shadow-violet-900/30 transition-all active:scale-95"
            >
              <FaPlus /> Nuevo Curso
            </button>
          )}
        </div>


        {courses.length === 0 ? (
          <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-12 text-center`}>
            <FaBookOpen className="mx-auto text-5xl text-slate-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay cursos registrados</h3>
            {canCreate && (
              <button onClick={() => setIsFormModalOpen(true)} className="text-violet-400 hover:text-violet-300 font-medium">
                + Crear primer curso
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 group`}>
                <div className="relative h-40 bg-slate-800 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg ${course.status === 'activo' ? 'bg-emerald-500/90 text-white' : course.status === 'borrador' ? 'bg-amber-500/90 text-white' : 'bg-slate-600/90 text-white'}`}>
                      {course.status}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FaChalkboardTeacher className="text-violet-400" />
                      <span className="truncate">{course.professor?.name || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FaUsers className="text-fuchsia-400" />
                      <span>{course.students?.length || 0} alumnos inscritos</span>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setSelectedCourse(course)} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors border border-slate-700">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* ───────── MODAL DE FORMULARIO (CREAR / EDITAR) ───────── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">{editingCourseId ? 'Editar Curso' : 'Crear Nuevo Curso'}</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Título del Curso *</label>
                <input name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors" placeholder="Ej: Matemáticas Avanzadas" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Descripción *</label>
                <textarea name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors resize-none" placeholder="Describe el objetivo y contenido..." />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Estado</label>
                <select name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors">
                  <option value="borrador">📝 Borrador</option>
                  <option value="activo">✅ Activo</option>
                  <option value="finalizado">🏁 Finalizado</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {submitting ? <FaSpinner className="animate-spin" /> : (editingCourseId ? <FaEdit /> : <FaPlus />)}
                  {submitting ? 'Guardando...' : (editingCourseId ? 'Actualizar Curso' : 'Crear Curso')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ───────── MODAL DE DETALLES DEL CURSO ───────── */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}>
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-r from-violet-600 to-fuchsia-600 flex-shrink-0">
              <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors">✕</button>
              <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center overflow-hidden shadow-lg">
                <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="pt-12 px-6 pb-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
                  <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedCourse.status === 'activo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : selectedCourse.status === 'borrador' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'}`}>
                    {selectedCourse.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <FaCalendarAlt className="text-slate-400" />
                  Creado: {new Date(selectedCourse.createdAt).toLocaleDateString('es-AR')}
                </div>
              </div>

              <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">{selectedCourse.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <FaChalkboardTeacher className="text-violet-400 text-lg" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Profesor a cargo</span>
                  </div>
                  <p className="text-white font-medium">{selectedCourse.professor?.name || 'Sin asignar'}</p>
                  <p className="text-sm text-slate-500">{selectedCourse.professor?.email || ''}</p>
                </div>



                {/* 📝 SECCIÓN DE ALUMNOS Y NOTAS (LÓGICA ACTUALIZADA) */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 sm:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <FaUsers className="text-fuchsia-400 text-lg" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Alumnos Inscritos ({selectedCourse.students?.length || 0})
                    </span>
                  </div>

                  {selectedCourse.students && selectedCourse.students.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {selectedCourse.students.map((student: any) => {
                        // Usamos las funciones auxiliares para garantizar datos estables
                        const studentId = getStudentId(student);
                        const studentName = getStudentName(student);
                        const studentEmail = getStudentEmail(student);
                        const initial = getInitial(studentName);

                        const currentNote = studentNotes[studentId] || { note: '', isVisibleToStudent: false };

                        return (
                          <div key={studentId} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold text-xs flex-shrink-0">
                                  {initial}
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">{studentName}</p>
                                  {studentEmail && <p className="text-xs text-slate-500">{studentEmail}</p>}
                                </div>
                              </div>
                              <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 flex-shrink-0">
                                Inscrito
                              </span>
                            </div>
                        


                            {/* 📝 SECCIÓN DE NOTA DEL PROFESOR (Diseño Estudiantil Mejorado) */}
                            <div className="mt-6">
                              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-violet-500/5 to-slate-900/50 border border-amber-500/20 backdrop-blur-sm shadow-lg">

                                {/* Badge flotante superior */}
                                <div className="absolute -top-3.5 left-5 px-3 py-1.5 rounded-full bg-slate-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl">
                                  <FaLightbulb className="w-3.5 h-3.5" />
                                Notas del profesor
                                </div>

                                {currentNote.note ? (
                                  <div className="mt-3">
                                    {/* Cita estilizada */}
                                    <div className="relative pl-4 py-1">
                                      <FaQuoteLeft className="absolute -left-1 top-0 w-4 h-4 text-amber-500/30" />
                                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic font-light">
                                        "{currentNote.note}"
                                      </p>
                                    </div>

                                    {/* Footer de la nota */}
                                    <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <FaCheckCircle className="text-emerald-500 w-3.5 h-3.5" />
                                        <span>Compartido por tu docente</span>
                                      </div>
                                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                                        {new Date().toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  /* Estado vacío motivador */
                                  <div className="mt-3 text-center py-4">
                                    <FaRegSmile className="mx-auto w-8 h-8 text-slate-600 mb-2" />
                                    <p className="text-slate-300 text-sm font-medium">¡Todo en orden!</p>
                                    <p className="text-slate-500 text-xs mt-1">
                                      Tu profesor aún no ha dejado notas específicas para ti. <br />
                                      ¡Sigue participando y aprovechando el curso! 🚀
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-700/50">
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-2">
                                  📝 ingresar Nota
                                </label>
                                <textarea
                                  value={currentNote.note}
                                  onChange={(e) => {
                                    // Esta actualización inmutable preserva el foco del teclado
                                    setStudentNotes(prev => ({
                                      ...prev,
                                      [studentId]: {
                                        note: e.target.value,
                                        isVisibleToStudent: prev[studentId]?.isVisibleToStudent ?? false
                                      }
                                    }));
                                  }}
                                  rows={2}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors resize-none placeholder-slate-600"
                                  placeholder="Ej: El alumno necesita refuerzo en el tema 3..."
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={currentNote.isVisibleToStudent}
                                      onChange={(e) => {
                                        setStudentNotes(prev => ({
                                          ...prev,
                                          [studentId]: {
                                            note: prev[studentId]?.note ?? '',
                                            isVisibleToStudent: e.target.checked
                                          }
                                        }));
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                                  </div>
                                  <span className={`text-xs font-medium transition-colors ${currentNote.isVisibleToStudent ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                    {currentNote.isVisibleToStudent ? '👁️ Visible para el alumno' : '🔒 Oculta para el alumno'}
                                  </span>
                                </label>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/courses/notes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          courseId: selectedCourse._id,
                                          studentId,
                                          note: currentNote.note,
                                          isVisibleToStudent: currentNote.isVisibleToStudent
                                        })
                                      });

                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.error || 'Error al guardar');

                                      // ✅ 1. Actualizar el estado del curso seleccionado (para que el modal refleje el cambio al instante)
                                      setSelectedCourse(prev => {
                                        if (!prev) return null;
                                        return {
                                          ...prev,
                                          students: prev.students.map((s: any) => {
                                            const sId = getStudentId(s);
                                            return sId === studentId
                                              ? { ...s, note: currentNote.note, isNoteVisible: currentNote.isVisibleToStudent }
                                              : s;
                                          })
                                        };
                                      });

                                      // ✅ 2. Actualizar también la lista general de cursos (para consistencia global)
                                      setCourses(prevCourses =>
                                        prevCourses.map(course =>
                                          course._id === selectedCourse._id
                                            ? {
                                              ...course,
                                              students: course.students.map((s: any) => {
                                                const sId = getStudentId(s);
                                                return sId === studentId
                                                  ? { ...s, note: currentNote.note, isNoteVisible: currentNote.isVisibleToStudent }
                                                  : s;
                                              })
                                            }
                                            : course
                                        )
                                      );

                                      Swal.fire({
                                        icon: 'success',
                                        title: 'Nota guardada',
                                        text: `La nota para ${studentName} se ha actualizado.`,
                                        background: '#0f172a',
                                        color: '#f1f5f9',
                                        confirmButtonColor: '#8b5cf6',
                                        timer: 2000,
                                        showConfirmButton: false,
                                        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
                                      });
                                    } catch (error: any) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: error.message || 'No se pudo guardar la nota.',
                                        background: '#0f172a',
                                        color: '#f1f5f9',
                                        confirmButtonColor: '#ef4444',
                                        customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
                                      });
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-violet-900/20"
                                >
                                  💾 Guardar
                                </button>



                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-xl bg-slate-900/50 border border-slate-700/50 border-dashed">
                      <FaUsers className="mx-auto text-2xl text-slate-600 mb-2" />
                      <p className="text-slate-500 text-sm">No hay alumnos inscritos en este curso aún.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reemplaza o agrega este bloque de botones al final del modal de detalles del profesor */}
              {canCreate && (
                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-800">

                  {/* ✅ NUEVO BOTÓN: INICIAR CLASE EN VIVO (Solo para el profesor) */}
                  <button
                    onClick={() => {
                      const roomName = `AulaVirtual-${selectedCourse.title.replace(/\s+/g, '-')}-${selectedCourse._id}`;
                      const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(session?.user?.name || 'Profesor')}`;

                      // Copiar el enlace al portapapeles
                      navigator.clipboard.writeText(jitsiUrl).then(() => {
                        Swal.fire({
                          icon: 'success',
                          title: '¡Clase Iniciada!',
                          html: `El enlace del aula se ha copiado al portapapeles.<br><br><code class="bg-slate-800 p-2 rounded text-xs break-all text-emerald-400">${jitsiUrl}</code><br><br>Puedes pegarlo en WhatsApp o en el grupo del curso para que los alumnos se unan.`,
                          background: '#0f172a',
                          color: '#f1f5f9',
                          confirmButtonColor: '#ef4444',
                          customClass: { popup: 'border border-slate-700/50 rounded-2xl' }
                        });
                        // Abrir la clase para el profesor
                        window.open(jitsiUrl, '_blank');
                      });
                    }}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20"
                  >
                    <FaVideo className="w-4 h-4" /> Iniciar Clase en Vivo
                  </button>

                  <button onClick={() => router.push(`/aula/cursos/${selectedCourse._id}/contenido`)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <FaBookOpen className="w-4 h-4" /> Gestionar Contenido
                  </button>
                  <button onClick={() => handleDeleteClick(selectedCourse)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors flex items-center gap-2">
                    <FaTrash className="w-4 h-4" /> Eliminar
                  </button>
                  <button onClick={() => handleEditClick(selectedCourse)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors flex items-center gap-2">
                    <FaEdit className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => setSelectedCourse(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}