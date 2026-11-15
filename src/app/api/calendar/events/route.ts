import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth'; // Ajusta la ruta si es diferente
import connectDB from '@/app/lib/mongoose';   // Ajusta la ruta si es diferente
import Event from '@/app/models/Event';

// ✅ GET: Obtener todos los eventos
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Obtenemos todos los eventos ordenados por fecha
    const events = await Event.find().sort({ start: 1 });
    
    // Mapeamos _id a id para que FullCalendar lo entienda
    const formattedEvents = events.map(ev => ({
      ...ev.toObject(),
      id: ev._id.toString(),
      backgroundColor: ev.type === 'clase' ? '#8b5cf6' : ev.type === 'reunion' ? '#10b981' : '#f59e0b',
      borderColor: ev.type === 'clase' ? '#8b5cf6' : ev.type === 'reunion' ? '#10b981' : '#f59e0b',
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ✅ POST: Crear un nuevo evento
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { title, start, end, type } = body;

    const newEvent = await Event.create({
      title,
      start,
      end,
      type,
      createdBy: session.user.id,
    });

    const formattedEvent = {
      ...newEvent.toObject(),
      id: newEvent._id.toString(),
      backgroundColor: type === 'clase' ? '#8b5cf6' : type === 'reunion' ? '#10b981' : '#f59e0b',
      borderColor: type === 'clase' ? '#8b5cf6' : type === 'reunion' ? '#10b981' : '#f59e0b',
    };

    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}