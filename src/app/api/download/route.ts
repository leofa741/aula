import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'documento.pdf';

  if (!url) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  try {
    // ✅ Agregamos headers de navegador para evitar que el firewall de Cloudinary bloquee la petición
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf, application/octet-stream, */*',
      },
    });

    if (!response.ok) {
      console.error(`❌ Cloudinary rechazó la petición. Estado: ${response.status} ${response.statusText}`);
      console.error(`URL intentada: ${url}`);
      throw new Error(`Error al obtener el archivo: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Tu servidor se lo entrega al navegador del alumno forzando la descarga
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('💥 Error en proxy de descarga:', error.message);
    return NextResponse.json(
      { error: 'No se pudo descargar el archivo. Es posible que el archivo haya sido eliminado o sea privado.' }, 
      { status: 500 }
    );
  }
}