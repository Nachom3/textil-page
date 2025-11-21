// app/api/lotes/[id]/subdividir/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { subdividirLote } from '@/lib/pedidos';

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
    const { subLotes } = body; // [{ codigo, cantidad }]

    if (!Array.isArray(subLotes) || subLotes.length === 0) {
      return NextResponse.json(
        { error: 'subLotes debe ser un array con al menos un elemento' },
        { status: 400 },
      );
    }

    const result = await subdividirLote(loteId, subLotes);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error subdividiendo lote',
      },
      { status: 500 },
    );
  }
}
