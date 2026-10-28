import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configura Cloudinary con tus variables de entorno (.env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        // Convertir el archivo a buffer para subirlo a Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Subir a Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw', // ✅ ESTO ES OBLIGATORIO para PDFs, DOCs, etc.
                    folder: 'aula-virtual/entregas' // Carpeta organizada en tu Cloudinary
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const resultTyped = uploadResult as any;

        return NextResponse.json({
            url: resultTyped.secure_url,
            fileName: file.name
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error subiendo archivo:', error);
        return NextResponse.json({ error: 'Error interno al subir el archivo' }, { status: 500 });
    }
}