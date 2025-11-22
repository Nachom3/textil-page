'use server';

import { notFound } from 'next/navigation';
import PedidoDetailClient from '@/components/pedidos/PedidoDetailClient';
import { obtenerPedidoConMetricas } from '@/lib/pedidos';

type Params = { params: Promise<{ numero: string }> };

export default async function Page({ params }: Params) {
  const { numero } = await params;
  const numeroPedido = Number(numero);
  if (Number.isNaN(numeroPedido)) {
    notFound();
  }

  const pedido = await obtenerPedidoConMetricas(numeroPedido);
  if (!pedido) {
    notFound();
  }

  return (
    <div className="h-full w-full">
      <PedidoDetailClient pedido={pedido} />
    </div>
  );
}
