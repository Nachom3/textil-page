import { NextRequest, NextResponse } from 'next/server';
import { obtenerTallerConLotes } from '@/lib/talleres';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: Params) {
  try {
    const { id } = await ctx.params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const taller = await obtenerTallerConLotes(idNum);

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json(taller);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error obteniendo taller',
      },
      { status: 500 },
    );
  }
}
