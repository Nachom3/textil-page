import { NextRequest, NextResponse } from 'next/server';
import {
  obtenerTallerConDetalle,
  actualizarTaller,
  eliminarTaller,
} from '@/lib/talleres';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const taller = await obtenerTallerConDetalle(id);
  if (!taller) {
    return NextResponse.json({ error: 'Taller no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json(taller, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const body = await req.json();
  const taller = await actualizarTaller({ id, ...body });

  return NextResponse.json(taller, { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  await eliminarTaller(id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
