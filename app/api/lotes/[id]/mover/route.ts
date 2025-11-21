// app/api/lotes/[id]/mover/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { moverLote } from '@/lib/pedidos';

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: Params) {
  try {
    const { id } = await ctx.params;
    const loteId = Number(id);
    if (Number.isNaN(loteId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await req.json();

    const result = await moverLote({
      loteId,
      procesoId: body.procesoId,
      tallerId: body.tallerId,
      transportistaId: body.transportistaId,
      fechaEntrada: body.fechaEntrada ? new Date(body.fechaEntrada) : undefined,
      fechaSalida: body.fechaSalida ? new Date(body.fechaSalida) : undefined,
      notas: body.notas,
      marcarTerminado: body.marcarTerminado,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error moviendo lote',
      },
      { status: 500 },
    );
  }
}
