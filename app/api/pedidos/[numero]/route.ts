// app/api/pedidos/[numero]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rastrearPedidoPorNumero } from '@/lib/pedidos';

type Params = {
  params: { numero: string };
};

export async function GET(_req: NextRequest, { params }: Params) {
  const numero = Number(params.numero);

  if (Number.isNaN(numero)) {
    return NextResponse.json(
      { error: 'ID invalido' },
      { status: 400 },
    );
  }

  const pedido = await rastrearPedidoPorNumero(numero);

  if (!pedido) {
    return NextResponse.json(
      { error: 'Pedido no encontrado' },
      { status: 404 },
    );
  }

  return NextResponse.json(pedido);
}
