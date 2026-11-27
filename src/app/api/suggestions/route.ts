import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Suggestion from '@/app/models/Suggestion';

// ✅ POST: Crear sugerencia (Alumno)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { message, courseId } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    const newSuggestion = await Suggestion.create({
      studentId: session.user.id,
      studentName: session.user.name || 'Usuario',
      studentEmail: session.user.email || 'sin-email@ejemplo.com',
      courseId: courseId || null,
      message: message.trim(),
      isRead: false,
    });

    return NextResponse.json({ success: true, suggestion: newSuggestion }, { status: 201 });
  } catch (error: any) {
    console.error('💥 Error al crear sugerencia:', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}

// ✅ GET: Obtener sugerencias
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtenemos el rol de forma segura (a veces viene en el token, a veces en el objeto user)
    const role = (session.user as any).role || 'alumno';
    const isStaff = ['admin', 'superadmin', 'profesor'].includes(role);

    let query: any = {};
    if (!isStaff) {
      // Si es alumno, solo ve sus propias sugerencias
      query = { studentId: session.user.id };
    }

    // ✅ .lean() es CLAVE: convierte el documento de Mongoose a un objeto JS plano, 
    // evitando errores de serialización al enviarlo como respuesta JSON.
    const suggestions = await Suggestion.find(query)
      .sort({ createdAt: -1 })
      .populate('courseId', 'title')
      .lean(); 
      
    return NextResponse.json({ success: true, suggestions }, { status: 200 });
  } catch (error: any) {
    console.error('💥 Error al obtener sugerencias:', error);
    // Devolvemos el mensaje de error detallado para que puedas verlo en la consola del navegador
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}