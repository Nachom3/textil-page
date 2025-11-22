import { NextRequest, NextResponse } from 'next/server';
import { avanzarProceso } from '@/lib/produccion';

type Params = {
  params: Promise<{ loteId: string }>;
};

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

const parseOptionalNumber = (value: unknown, field: string) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${field} debe ser numérico`);
  }
  return parsed;
};

export async function POST(req: NextRequest, ctx: Params) {
  try {
    const { loteId } = await ctx.params;
    const id = Number(loteId);
    if (Number.isNaN(id)) {
      return badRequest('loteId inválido');
    }

    const body = await req.json();
    const procesoNombre = body.proceso ?? body.procesoNombre;
    if (!procesoNombre || typeof procesoNombre !== 'string') {
      return badRequest('procesoNombre es requerido y debe ser texto');
    }

    let tallerId: number | null | undefined;
    let transportistaId: number | null | undefined;
    try {
      tallerId = parseOptionalNumber(body.tallerId, 'tallerId');
      transportistaId = parseOptionalNumber(
        body.transportistaId,
        'transportistaId',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payload inválido';
      return badRequest(message);
    }

    const fecha =
      body.fecha || body.fechaEntrada
        ? new Date(body.fecha ?? body.fechaEntrada)
        : undefined;

    const result = await avanzarProceso(id, procesoNombre, {
      estado: 'EN_PROCESO',
      fecha,
      tallerId,
      transportistaId,
      notas: body.notas ?? null,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : 'Error iniciando proceso';
    const status =
      message.toLowerCase().includes('no encontrado') ||
      message.toLowerCase().includes('no se pueden') ||
      message.toLowerCase().includes('ya fue')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
