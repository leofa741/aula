import mongoose, { Schema, Document } from 'mongoose';

export interface IModule {
  title: string;
  description: string;
  content: string; // Puede ser texto, un enlace a video o instrucciones
  order: number;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  image: string;
  professor: mongoose.Types.ObjectId; // Referencia al User (rol: profesor o admin)
  students: mongoose.Types.ObjectId[]; // Array de referencias a Users (rol: alumno)
  modules: IModule[];
  status: 'activo' | 'borrador' | 'finalizado';
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, required: true }, // Aquí irán los links a PDFs, videos, etc.
  order: { type: Number, required: true }
}, { _id: false }); // _id: false para no generar IDs innecesarios en subdocumentos

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80' },
    
    // ✅ Relaciones con el modelo User
    professor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }], // MVP: Array directo. Escalable a 100-500 alumnos por curso.
    
    // ✅ Contenido del curso
    modules: [ModuleSchema],
    
    // ✅ Estado del curso
    status: { 
      type: String, 
      enum: ['activo', 'borrador', 'finalizado'], 
      default: 'borrador' 
    }
  },
  { 
    timestamps: true // Agrega createdAt y updatedAt automáticamente
  }
);

// Generar slug automático antes de guardar si no se proporciona
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