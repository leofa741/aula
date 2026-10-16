import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentNote extends Document {
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  note: string;
  isVisibleToStudent: boolean;
}

const StudentNoteSchema = new Schema<IStudentNote>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    isVisibleToStudent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Esto evita que se creen dos notas para el mismo alumno en el mismo curso
StudentNoteSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

const StudentNote = mongoose.models.StudentNote || mongoose.model<IStudentNote>('StudentNote', StudentNoteSchema);

export default StudentNote;