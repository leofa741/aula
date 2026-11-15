import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  start: Date;
  end?: Date;
  type: 'clase' | 'reunion' | 'examen' | 'otro';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    type: { type: String, enum: ['clase', 'reunion', 'examen', 'otro'], default: 'clase' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Evita el error de recompilación en Next.js
const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;