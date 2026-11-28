import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Suggestion from '@/app/models/Suggestion';

// ✅ POST: Crear sugerencia
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    const newSuggestion = await Suggestion.create({
      studentId: session.user.id,
      studentName: session.user.name || 'Usuario',
      studentEmail: session.user.email || 'sin-email@ejemplo.com',
      message: message.trim(),
      isRead: false,
    });

    return NextResponse.json({ success: true, suggestion: newSuggestion }, { status: 201 });
  } catch (error: any) {
    console.error('💥 Error al crear sugerencia:', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}

// ✅ GET: Obtener sugerencias (CON .lean() PARA EVITAR ERROR 500)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtenemos el rol de forma segura
    const role = (session.user as any).role || 'alumno';
    const isStaff = ['admin', 'superadmin', 'profesor'].includes(role);

    let query: any = {};
    if (!isStaff) {
      // Si es alumno, solo ve sus propias sugerencias
      query = { studentId: session.user.id };
    }

    // 🔑 LA CLAVE: .lean() convierte el documento de Mongoose en un objeto JS plano,
    // evitando que NextResponse.json() falle con Error 500 al serializar fechas o IDs.
    const suggestions = await Suggestion.find(query)
      .sort({ createdAt: -1 })
      .lean(); 
      
    return NextResponse.json({ success: true, suggestions }, { status: 200 });
  } catch (error: any) {
    console.error('💥 Error al obtener sugerencias:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}