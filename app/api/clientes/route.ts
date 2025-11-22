import { NextRequest, NextResponse } from 'next/server';
import {
  listarClientes,
  crearCliente,
  type CrearClienteInput,
} from '@/lib/clientes';

export async function GET(_req: NextRequest) {
  try {
    const clientes = await listarClientes();
    return NextResponse.json(clientes);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message ?? 'Error listando clientes' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrearClienteInput;

    const cliente = await crearCliente(body);
    return NextResponse.json(cliente, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message ?? 'Error creando cliente' },
      { status: 500 },
    );
  }
}
