import { NextRequest, NextResponse } from 'next/server';
import { subdividirLote } from '@/lib/pedidos';

type Params = {
  params: Promise<{ loteId: string }>;
};

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function POST(req: NextRequest, ctx: Params) {
  try {
    const { loteId } = await ctx.params;
    const id = Number(loteId);
    if (Number.isNaN(id)) {
      return badRequest('loteId inválido');
    }

    const body = await req.json();
    const { subLotes } = body ?? {};

    if (!Array.isArray(subLotes) || !subLotes.length) {
      return badRequest('subLotes debe ser un array con al menos un elemento');
    }

    const parsed = [];
    for (const item of subLotes) {
      if (!item?.codigo || typeof item.codigo !== 'string') {
        return badRequest('Cada sublote requiere un codigo de texto');
      }
      const cantidad = Number(item.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return badRequest('Cada sublote debe tener una cantidad numérica > 0');
      }
      parsed.push({ codigo: item.codigo, cantidad });
    }

    const result = await subdividirLote(id, parsed);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : 'Error subdividiendo lote';
    const status =
      message.toLowerCase().includes('no se puede') ||
      message.toLowerCase().includes('no encontrado')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
