import { NextRequest, NextResponse } from 'next/server';
import { listarClientes, crearCliente, type CrearClienteInput } from '@/lib/clientes';
import { crearClienteSchema } from '@/lib/validators';

export async function GET(_req: NextRequest) {
  try {
    const clientes = await listarClientes();
    return NextResponse.json(clientes);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message ?? 'Error listando clientes', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrearClienteInput;
    const parsed = crearClienteSchema.parse(body);

    const cliente = await crearCliente(parsed);
    return NextResponse.json(cliente, { status: 201 });
  } catch (e: any) {
    console.error(e);
    const status =
      e?.name === 'ZodError'
        ? 400
        : 500;
    return NextResponse.json(
      { error: e.message ?? 'Error creando cliente', code: status === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR' },
      { status },
    );
  }
}
