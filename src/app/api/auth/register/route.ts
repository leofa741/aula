// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/mongoose'; // ⚠️ Ajusta si tu ruta es diferente
import User from '@/app/models/User';       // ⚠️ Ajusta si tu ruta es diferente

// Nota: He eliminado las funciones de "Cliente" e "Inmobiliaria" 
// porque ensucian el código del Aula Virtual. Si las necesitas para otra cosa, 
// puedes volver a agregarlas, pero para el registro de alumnos/profesores no son necesarias.

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const { 
      email, 
      password,
      name = '',
      lastName = '',
      phone = '',
      address = '',
      city = '',
      zipCode = '',
      role = 'alumno' // ✅ Por defecto es alumno si no se especifica
    } = body;

    // 1. Validar campos obligatorios
    if (!email || !password) {
      return NextResponse.json({ message: 'El correo y la contraseña son obligatorios' }, { status: 400 });
    }

    // 2. Validar que el correo no esté registrado
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 400 });
    }

    // 3. ✅ LÓGICA CLAVE: Determinar rol y estado de activación
    const isTeacher = role === 'profesor';
    const userRole = isTeacher ? 'profesor' : 'alumno';
    const userIsActive = isTeacher ? false : true; // Profesor = pendiente, Alumno = activo

    // 4. Crear el usuario
    // El middleware de tu modelo User.ts se encargará de hashear la contraseña automáticamente
    const newUser = new User({ 
      email: email.toLowerCase(), 
      password,
      name: name.trim(),
      lastName: lastName.trim(),
      phone,
      address,
      city,
      zipCode,
      role: userRole,
      isActive: userIsActive, // ✅ Campo nuevo que controla el acceso
      google: false
    });
    
    await newUser.save();

    // 5. Generar token JWT (Solo si el usuario está activo, aunque para el registro 
    // a veces se envía, pero el login es el que realmente bloquea con isActive)
    const token = jwt.sign(
      { 
        id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '30d' } // Alineado con tu config de NextAuth
    );

    // 6. Responder según el rol
    if (isTeacher) {
      return NextResponse.json({ 
        message: 'Registro exitoso. Tu cuenta de profesor está pendiente de aprobación por un administrador.', 
        pendingApproval: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        }
      }, { status: 201 });
    } else {
      return NextResponse.json({ 
        message: 'Usuario registrado exitosamente. Ya puedes iniciar sesión.', 
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        },
        token // Enviamos el token para que pueda loguearse automáticamente si quieres
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('❌ Error en el registro:', error);
    return NextResponse.json({ message: 'Error en el servidor al procesar el registro' }, { status: 500 });
  }
}