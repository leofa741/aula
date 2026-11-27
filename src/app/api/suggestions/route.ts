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
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { message, courseId } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
    }

    const newSuggestion = await Suggestion.create({
      studentId: session.user.id,
      studentName: session.user.name,
      studentEmail: session.user.email,
      courseId: courseId || null,
      message: message.trim(),
      isRead: false,
    });

    return NextResponse.json({ success: true, suggestion: newSuggestion }, { status: 201 });
  } catch (error) {
    console.error('Error al crear sugerencia:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ GET: Obtener sugerencias
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const role = session.user.role;
    const isStaff = ['admin', 'superadmin', 'profesor'].includes(role);

    let query = {};
    if (!isStaff) {
      // Si es alumno, solo ve sus propias sugerencias
      query = { studentId: session.user.id };
    }

    const suggestions = await Suggestion.find(query)
      .sort({ createdAt: -1 })
      .populate('courseId', 'title');
      
    return NextResponse.json({ success: true, suggestions }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}