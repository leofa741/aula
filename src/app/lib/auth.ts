/* eslint-disable @typescript-eslint/no-explicit-any */
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './mongoose';
import UserModel from '../models/User';
import { NextRequest } from 'next/server';
import nodemailer from "nodemailer";

connectDB();

// ✅ Tipos actualizados para Aula Virtual
export interface DecodedToken {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'profesor' | 'alumno';
  name?: string;
}

type ExtendedUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  image?: string;
  token: string;
};

// === Función para enviar email de bienvenida (Adaptada a Aula Virtual) ===
async function sendWelcomeEmail(to: string, name: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.MAILER_SERVICE || 'gmail',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_SECRET_KEY,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.MAILER_EMAIL}>`,
      to,
      subject: '🎓 ¡Bienvenido al Aula Virtual!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; }
            .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 24px; background: #1e293b; border-radius: 0 0 12px 12px; }
            .cta { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 ¡Bienvenido al Aula Virtual!</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${name}</strong>,</p>
            <p>Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma para ver tus cursos, materiales y tareas asignadas.</p>
            <a href="${baseUrl}/aula" class="cta">Ir al Aula Virtual →</a>
            <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">Si no solicitaste este registro, ignora este correo.</p>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Email de bienvenida enviado a ${to}`);
  } catch (error) {
    console.error("❌ Error enviando email de bienvenida:", error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.ID_GOOGLE as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        await connectDB();
        const user = await UserModel.findOne({ email: credentials?.email });
        
        if (!user) throw new Error('Usuario no encontrado');
        
        // ✅ NUEVO: VALIDACIÓN DE CUENTA ACTIVA (Para login con credenciales)
        if (user.isActive === false) {
          throw new Error('Tu cuenta está pendiente de aprobación por un administrador.');
        }
        
        // Si el usuario se registró con Google, no tiene password hash, o usamos un hash dummy
        if (!user.google) {
          const isMatch = await bcrypt.compare(credentials!.password, user.password);
          if (!isMatch) throw new Error('Contraseña incorrecta');
        }

        // Generar token JWT con los datos esenciales del Aula Virtual
        const token = jwt.sign(
          {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '30d' }
        );

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
          image: user.img || user.image,
          token,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();
      let esUsuarioNuevoGoogle = false;

      if (account?.provider === 'google') {
        let existingUser = await UserModel.findOne({ email: user.email });

        if (!existingUser) {
          esUsuarioNuevoGoogle = true;
          // 👤 Usuario NUEVO con Google: Rol por defecto 'alumno' y activo
          existingUser = new UserModel({
            name: user.name || 'Alumno',
            email: user.email,
            img: user.image || '',
            password: await bcrypt.hash('google-auth-dummy', 10),
            role: 'alumno',
            isActive: true, // ✅ Por defecto activo
            google: true,
          });
          await existingUser.save();
          
          await sendWelcomeEmail(existingUser.email, existingUser.name);
        } else {
          // ✅ NUEVO: VALIDACIÓN DE CUENTA ACTIVA (Para login con Google de usuarios existentes)
          if (existingUser.isActive === false) {
            // Devolver false bloquea el inicio de sesión y redirige al error
            return false; 
          }
        }
        
        // 🔑 Generar token JWT para usuarios de Google (nuevos o existentes)
        const token = jwt.sign(
          {
            id: existingUser.id.toString(),
            email: existingUser.email,
            role: existingUser.role,
            name: existingUser.name,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '30d' }
        );

        // 🔗 Mapear user para NextAuth
        const u = user as ExtendedUser;
        u.id = existingUser.id.toString();
        u.role = existingUser.role;
        u.token = token;
        u.name = existingUser.name || '';
        u.image = existingUser.img || existingUser.image || '';
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.email = u.email;
        token.role = u.role;
        token.name = u.name;
        token.image = u.image;
        token.token = u.token;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as any;
      if (session.user) {
        session.user.id = t.id;
        session.user.email = t.email;
        session.user.role = t.role;
        session.user.name = t.name;
        session.user.image = t.image;
        session.user.token = t.token;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login', 
    error: '/login', // Si el signIn devuelve false, irá a /login?error=AccessDenied
  },
  
  secret: process.env.JWT_SECRET,
};

// =========================================================
// 🔒 Helpers de verificación para API Routes (Middleware)
// =========================================================

export const verifyAdmin = async (req: NextRequest): Promise<DecodedToken | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    if (['admin', 'superadmin'].includes(decoded.role)) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
};