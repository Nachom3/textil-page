import { NextRequest, NextResponse } from 'next/server';
import { actualizarProducto, eliminarProducto } from '@/lib/productos';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Params) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await req.json();
    const { nombre, codigo, tieneTalles, plantilla } = body;

    const producto = await actualizarProducto({
      id,
      nombre,
      codigo,
      tieneTalles,
      plantilla,
    });

    return NextResponse.json(producto);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error actualizando producto',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Params) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    await eliminarProducto(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error eliminando producto',
      },
      { status: 500 },
    );
  }
}
