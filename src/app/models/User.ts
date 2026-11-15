import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'superadmin' | 'admin' | 'profesor' | 'alumno';
export type PaymentStatus = 'free' | 'pagado'; // ✅ NUEVO TIPO

export interface IUser extends Document {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  img?: string;
  google: boolean;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  address?: string;
  city?: string;
  zipCode?: string;
  paymentStatus?: PaymentStatus; // ✅ NUEVO CAMPO
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'profesor', 'alumno'], default: 'alumno' },
    isActive: { type: Boolean, default: true },
    phone: { type: String, default: '', trim: true },
    img: { type: String, default: '' },
    google: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Number, default: null },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    // ✅ NUEVO CAMPO EN EL SCHEMA
    paymentStatus: { type: String, enum: ['free', 'pagado'], default: 'free' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password === 'google-auth-dummy') return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;