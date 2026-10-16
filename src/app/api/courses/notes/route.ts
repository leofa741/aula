import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose'; 
import StudentNote from '@/app/models/StudentNote'; 

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { courseId, studentId, note, isVisibleToStudent } = body;

    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'Faltan datos requeridos (courseId o studentId)' }, { status: 400 });
    }

    // ✅ AQUÍ ESTÁ LA CLAVE: Usamos StudentNote, NO Course.
    // upsert: true significa: "Si existe, actualízalo. Si no, créalo".
    const updatedNote = await StudentNote.findOneAndUpdate(
      { courseId, studentId },
      { note, isVisibleToStudent },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Nota guardada correctamente',
      data: updatedNote 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al guardar nota:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}