import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
  progress: number; // 0 a 100
  finalGrade: number | null; // Calificación final (0-10 o 0-100)
  status: 'activo' | 'completado' | 'abandonado';
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    finalGrade: { type: Number, default: null },
    status: { 
      type: String, 
      enum: ['activo', 'completado', 'abandonado'], 
      default: 'activo' 
    }
  },
  { timestamps: true }
);

// Índice compuesto para evitar que un alumno se inscriba dos veces al mismo curso
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;