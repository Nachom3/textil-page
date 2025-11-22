import { NextRequest, NextResponse } from 'next/server';
import { listarTalleres, crearTaller, type CrearTallerInput } from '@/lib/talleres';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  const tipo = searchParams.get('tipo') ?? undefined;

  const talleres = await listarTalleres({ q, tipo });
  return NextResponse.json(talleres, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrearTallerInput;
    if (!body.nombre || !body.tipo) {
      return NextResponse.json(
        { error: 'nombre y tipo son requeridos', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const taller = await crearTaller(body);
    return NextResponse.json(taller, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? 'Error creando taller', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
