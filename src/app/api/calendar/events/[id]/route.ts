import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Event from '@/app/models/Event';

// ✅ PUT: Actualizar un evento
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, start, end, type } = body;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { title, start, end, type },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    const formattedEvent = {
      ...updatedEvent.toObject(),
      id: updatedEvent._id.toString(),
      backgroundColor: type === 'clase' ? '#8b5cf6' : type === 'reunion' ? '#10b981' : '#f59e0b',
      borderColor: type === 'clase' ? '#8b5cf6' : type === 'reunion' ? '#10b981' : '#f59e0b',
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar un evento
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    return NextResponse.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}