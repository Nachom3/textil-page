import { NextRequest, NextResponse } from 'next/server';
import { crearRegistroManual } from '@/lib/reportes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, descripcion, monto, fecha, usuario, pedidoId, tallerId } = body ?? {};

    if (!tipo || !['PAGO', 'RECORDATORIO', 'NOTA_GENERAL'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo invalido' }, { status: 400 });
    }
    if (!descripcion || typeof descripcion !== 'string') {
      return NextResponse.json({ error: 'descripcion es requerida' }, { status: 400 });
    }

    const registro = await crearRegistroManual({
      tipo,
      descripcion,
      monto: monto ?? null,
      fecha: fecha ? new Date(fecha) : undefined,
      usuario: usuario ?? null,
      pedidoId: pedidoId ?? null,
      tallerId: tallerId ?? null,
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error creando registro manual' },
      { status: 500 },
    );
  }
}
