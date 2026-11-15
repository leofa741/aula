import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import User from '@/app/models/User';

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'superadmin', 'profesor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtenemos solo los alumnos, ordenados por nombre
    const students = await User.find({ role: 'alumno' })
      .select('name lastName email')
      .sort({ name: 1 });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}