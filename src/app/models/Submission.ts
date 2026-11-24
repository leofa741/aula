import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  moduleId: string;
  courseId: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  deliveryLink: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  feedback?: string;
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  moduleId: { type: String, required: true },
  courseId: { type: String, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  deliveryLink: { type: String, required: true },
  status: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  feedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
});

const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;