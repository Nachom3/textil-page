'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs, Typography } from '@mui/material';
import PedidoTreeView from './PedidoTreeView';
import LoteDetail from './LoteDetail';
import { type PedidoConLotes } from '@/lib/calculos';

type Props = {
  pedido: NonNullable<Awaited<ReturnType<typeof import('@/lib/pedidos').obtenerPedidoConMetricas>>>;
};

export default function PedidoDetailClient({ pedido }: Props) {
  const detailTopRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ type: 'producto' | 'lote'; id: number }>(() => {
    const firstLote = pedido.lotes[0];
    return firstLote
      ? { type: 'lote', id: firstLote.id }
      : { type: 'producto', id: pedido.pedido.productos[0]?.producto.id ?? 0 };
  });

  const lotesById = useMemo(() => {
    const map = new Map<number, (typeof pedido.lotes)[number]>();
    pedido.lotes.forEach((l) => map.set(l.id, l));
    return map;
  }, [pedido.lotes]);

  const selectedLote = selectedNode.type === 'lote' ? lotesById.get(selectedNode.id) : null;

  useEffect(() => {
    if (detailTopRef.current) {
      detailTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedNode]);

  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <Breadcrumbs aria-label="breadcrumb" className="text-sm">
        <Link href="/dashboard/pedidos" className="text-blue-600 hover:underline">
          Pedidos
        </Link>
        <Typography color="text.primary">#{pedido.pedido.numero}</Typography>
        {selectedLote ? (
          <Typography color="text.primary">Lote {selectedLote.codigo}</Typography>
        ) : (
          <Typography color="text.primary">
            {pedido.pedido.productos[0]?.producto.nombre ?? 'Producto'}
          </Typography>
        )}
      </Breadcrumbs>

      <div className="flex h-full w-full gap-4">
        <div className="w-full max-w-xs rounded-lg border bg-white p-3 shadow-sm">
          <PedidoTreeView
            pedido={{ ...pedido.pedido, lotes: pedido.lotes } as unknown as PedidoConLotes}
            productoId={pedido.pedido.productos[0]?.producto.id}
            productoNombre={pedido.pedido.productos[0]?.producto.nombre}
            selectedNode={selectedNode}
            onSelect={(next) => setSelectedNode(next)}
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border bg-white p-4 shadow-sm">
          <div ref={detailTopRef} />
          <LoteDetail
            pedidoNumero={pedido.pedido.numero}
            pedidoCliente={pedido.pedido.cliente?.nombre ?? null}
            selectedLote={selectedLote ?? undefined}
            productoNombre={pedido.pedido.productos[0]?.producto.nombre}
          />
        </div>
      </div>
    </div>
  );
}
