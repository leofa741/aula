import mongoose, { Schema, Document } from 'mongoose';

export interface ISuggestion extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  courseId?: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' }, // Opcional, por si quieres hacerlo por curso
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Suggestion = mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
export default Suggestion;