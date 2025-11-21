import { NextRequest, NextResponse } from 'next/server';
import { rastrearPedidoPorNumero } from '@/lib/pedidos';

type Params = {
  params: Promise<{ numero: string }>;
};

export async function GET(_req: NextRequest, ctx: Params) {
  const { numero: numeroStr } = await ctx.params;
  const numero = Number(numeroStr);
  if (Number.isNaN(numero)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const pedido = await rastrearPedidoPorNumero(numero);
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  return NextResponse.json(pedido);
}
