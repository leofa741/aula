import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// ✅ 1. Definimos los roles permitidos para el Aula Virtual
export type UserRole = 'superadmin' | 'admin' | 'profesor' | 'alumno';

export interface IUser extends Document {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  img?: string;
  google: boolean; // ✅ Cambiado a booleano (es más lógico que un string)
  isActive: boolean; // ✅ Campo para indicar si el usuario está activo
  
  // Campos de recuperación de contraseña
  resetPasswordToken?: string;
  resetPasswordExpires?: number;

  // Campos legacy (mantenidos por compatibilidad con tu DB actual, pero opcionales)
  address?: string;
  city?: string;
  zipCode?: string;

  // Método personalizado
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { type: String, required: true },
    
    // ✅ 2. ACTUALIZACIÓN CLAVE: Enum de roles y valor por defecto 'alumno'
    role: { 
      type: String, 
      enum: ['superadmin', 'admin', 'profesor', 'alumno'], 
      default: 'alumno' 
    },
    isActive: { type: Boolean, default: true }, 
    
    phone: { type: String, default: '', trim: true },
    img: { type: String, default: '' },
    
    // ✅ 3. Google ahora es un booleano
    google: { type: Boolean, default: false },

    // Campos de recuperación de contraseña
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Number, default: null },

    // Campos legacy (si no los vas a usar en el aula, puedes borrarlos en el futuro)
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
  },
  { 
    timestamps: true // ✅ Agrega createdAt y updatedAt automáticamente (muy útil)
  }
);

// Middleware para hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  // Solo hashear si la contraseña fue modificada o es nueva
  if (!this.isModified('password')) return next();
  
  // Si la contraseña es el dummy de Google, no la hasheamos de nuevo
  if (this.password === 'google-auth-dummy') return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Verificar si el modelo ya existe para evitar errores de recarga en Next.js (Hot Reload)
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;