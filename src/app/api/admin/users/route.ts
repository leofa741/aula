import { NextRequest, NextResponse } from 'next/server';


import jwt from 'jsonwebtoken';
import cloudinary from '@/app/lib/cloudinary';
import User from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';

interface DecodedToken {
  id: string;
  role: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
}

connectDB();

function getTokenFromRequest(req: NextRequest): string | null {
  return req.headers.get('Authorization')?.split(' ')[1] || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ message: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Si viene id, buscar un usuario
      const user = await User.findById(id).select('-password');
      if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    // Si no hay id, devolver todos
    const users = await User.find().select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error en GET:', error);
    return NextResponse.json({ message: 'Error al obtener los usuarios intente salir y volver a entrar ' }, { status: 500 });
  }
}


// ✅ PUT - Actualizar un usuario (solo admin)
export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID de usuario requerido' }, { status: 400 });

    const formData = await req.formData();
    
    // ✅ CORRECCIÓN: Solo agregamos al objeto de actualización los campos que realmente vienen en la petición
    const updateData: any = {};

    if (formData.has('name')) updateData.name = formData.get('name')?.toString().trim();
    if (formData.has('lastName')) updateData.lastName = formData.get('lastName')?.toString().trim();
    if (formData.has('address')) updateData.address = formData.get('address')?.toString().trim();
    if (formData.has('city')) updateData.city = formData.get('city')?.toString().trim();
    if (formData.has('zipCode')) updateData.zipCode = formData.get('zipCode')?.toString().trim();
    if (formData.has('phone')) updateData.phone = formData.get('phone')?.toString().trim();
    if (formData.has('role')) updateData.role = formData.get('role')?.toString().trim();
    
    // ✅ EXTRAER EL NUEVO ESTADO DE PAGO (Solo si viene en la petición)
    if (formData.has('paymentStatus')) {
      updateData.paymentStatus = formData.get('paymentStatus')?.toString() as 'free' | 'pagado';
    }
    
    const imgFile = formData.get('img') as File | null;
    if (imgFile && imgFile.size > 0) {
      const arrayBuffer = await imgFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'users' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(buffer);
      });
      updateData.img = (result as any).secure_url;
    }

    // Verificar que haya al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No hay datos válidos para actualizar' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error en PUT:', error);
    return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
  }
}


// ✅ DELETE - Eliminar un usuario (solo admin)
export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 });

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE:', error);
    return NextResponse.json({ message: 'Error al eliminar el usuario' }, { status: 500 });
  }
}
