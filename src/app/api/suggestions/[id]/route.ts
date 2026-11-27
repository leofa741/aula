import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongoose';
import Suggestion from '@/app/models/Suggestion';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const isStaff = ['admin', 'superadmin', 'profesor'].includes(session.user.role);
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const updated = await Suggestion.findByIdAndUpdate(id, { isRead: true }, { new: true });
    
    if (!updated) return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });

    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}