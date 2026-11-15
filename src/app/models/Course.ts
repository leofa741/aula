import mongoose, { Schema, Document } from 'mongoose';

// ✅ 1. NUEVA INTERFAZ PARA LOS ARCHIVOS ADJUNTOS
export interface IModuleFile {
  url: string;
  fileName: string;
  fileType: string;
}

export interface IModule {
  title: string;
  description: string;
  content?: string;
  type?: 'texto' | 'video' | 'pdf' | 'enlace' | 'actividad' | 'comprimido';
  
  // ✅ 2. CAMPOS DE ARCHIVOS (Nuevo array + campo antiguo por compatibilidad)
  assignmentFiles?: IModuleFile[]; 
  assignmentFileUrl?: string; 
  
  order: number;
  assignmentType?: 'todos' | 'especificos' | 'grupo';
  assignedStudentIds?: mongoose.Types.ObjectId[];
  customGroupName?: string;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  image: string;
  professor: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  modules: IModule[];
  status: 'activo' | 'borrador' | 'finalizado';
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 3. SCHEMA PARA EL ARCHIVO INDIVIDUAL
const ModuleFileSchema = new Schema<IModuleFile>({
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true }
}, { _id: false });

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  type: { type: String, enum: ['texto', 'video', 'pdf', 'enlace', 'actividad', 'comprimido'], default: 'texto' },
  
  // ✅ 4. ACTUALIZAR SCHEMA DEL MÓDULO
  assignmentFiles: { type: [ModuleFileSchema], default: [] },
  assignmentFileUrl: { type: String, default: '' }, // Mantenido por compatibilidad
  
  order: { type: Number, required: true },
  assignmentType: { type: String, enum: ['todos', 'especificos', 'grupo'], default: 'todos' },
  assignedStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  customGroupName: { type: String, default: '' }
}, { _id: false });

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80' },
    professor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    modules: [ModuleSchema],
    status: {
      type: String,
      enum: ['activo', 'borrador', 'finalizado'],
      default: 'borrador'
    }
  },
  { timestamps: true }
);

CourseSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});


const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;