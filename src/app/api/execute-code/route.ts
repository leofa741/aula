import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, files } = body;

    console.log('🚀 [Piston Proxy] Enviando solicitud:', { language, filesCount: files?.length });

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        version: '*',
        files: files,
      }),
    });

    const data = await response.json();
    console.log('✅ [Piston Proxy] Respuesta recibida:', data);

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.message || data.error || 'La API de ejecución rechazó la solicitud', 
          details: data 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('❌ [Piston Proxy] Error CRÍTICO:', error);
    return NextResponse.json(
      { error: 'Error de red o del servidor', details: error.message }, 
      { status: 500 }
    );
  }
}