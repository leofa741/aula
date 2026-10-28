import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  courseId: mongoose.Types.ObjectId;
  moduleId: string; // Usaremos el 'order' del módulo como identificador (ej: "1", "2")
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileName: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback: string;
}

const SubmissionSchema = new Schema<ISubmission>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleId: { type: String, required: true }, // Guarda el 'order' del módulo en formato string
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  status: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  feedback: { type: String, default: '' }
}, { timestamps: true });

// Índice compuesto: un alumno solo puede tener UNA entrega por módulo
SubmissionSchema.index({ courseId: 1, moduleId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;