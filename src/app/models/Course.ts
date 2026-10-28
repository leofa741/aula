import mongoose, { Schema, Document } from 'mongoose';

export interface IModule {
  title: string;
  description: string;
  content?: string; // Ahora opcional, una actividad puede solo tener archivo
  type?: 'texto' | 'video' | 'pdf' | 'enlace' | 'actividad';
  assignmentFileUrl?: string; // URL del archivo de consigna subido por el profesor
  order: number;
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

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' }, // Cambiado a default ''
  type: { type: String, enum: ['texto', 'video', 'pdf', 'enlace', 'actividad'], default: 'texto' },
  assignmentFileUrl: { type: String, default: '' },
  order: { type: Number, required: true }
}, { _id: false }); // Mantenemos _id: false para compatibilidad con tu BD actual

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