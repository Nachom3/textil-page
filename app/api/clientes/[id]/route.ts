import { NextResponse } from 'next/server';
import {
  obtenerCliente,
  actualizarCliente,
  eliminarCliente,
  type ActualizarClienteInput,
} from '@/lib/clientes';
import { actualizarClienteSchema } from '@/lib/validators';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'id debe ser numérico' }, { status: 400 });
  }

  try {
    const cliente = await obtenerCliente(id);
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json(cliente, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo cliente' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'id debe ser numérico' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as Omit<ActualizarClienteInput, 'id'>;
    const parsed = actualizarClienteSchema.parse(body);
    const cliente = await actualizarCliente({ ...parsed, id });
    return NextResponse.json(cliente, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error && typeof error === 'object' && (error as any).name === 'ZodError'
            ? 'Payload inválido'
            : 'Error actualizando cliente',
        code: (error as any)?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'SERVER_ERROR',
      },
      { status: (error as any)?.name === 'ZodError' ? 400 : 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'id debe ser numérico' }, { status: 400 });
  }

  try {
    await eliminarCliente(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error eliminando cliente' },
      { status: 500 },
    );
  }
}
