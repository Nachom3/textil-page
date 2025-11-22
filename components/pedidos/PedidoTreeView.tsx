'use client';

import { memo, useMemo } from 'react';
import { TreeItem, TreeView } from '@mui/lab';
import { Inventory2Outlined, LayersOutlined, ExpandMore, ChevronRight } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { type PedidoConLotes } from '@/lib/calculos';

type Selected = { type: 'producto' | 'lote'; id: number };

type Props = {
  pedido: PedidoConLotes;
  productoId?: number;
  productoNombre?: string;
  selectedNode: Selected;
  onSelect: (sel: Selected) => void;
};

const statusColor = (estado?: string | null) => {
  switch (estado) {
    case 'TERMINADO':
      return 'success';
    case 'DIVIDIDO':
      return 'warning';
    default:
      return 'default';
  }
};

function PedidoTreeView({ pedido, productoId, productoNombre, selectedNode, onSelect }: Props) {
  const productId = productoId ?? 0;
  const treeData = useMemo(() => {
    const lotes = pedido.lotes;
    const roots = lotes.filter((l) => !l.parentId);
    const byParent = new Map<number, typeof lotes>();
    lotes.forEach((l) => {
      if (!byParent.has(l.parentId ?? -1)) byParent.set(l.parentId ?? -1, []);
      byParent.get(l.parentId ?? -1)!.push(l);
    });
    const buildChildren = (parentId: number | null): typeof lotes => {
      return (byParent.get(parentId ?? -1) ?? []).map((child) => child);
    };
    return { roots, buildChildren };
  }, [pedido.lotes]);

  const renderLote = (lote: (typeof pedido.lotes)[number]) => {
    const nodeId = `lote-${lote.id}`;
    const chip = (
      <Chip
        size="small"
        color={statusColor(lote.estado) as any}
        label={lote.estado}
        className="ml-2"
      />
    );
    return (
      <TreeItem
        key={nodeId}
        nodeId={nodeId}
        label={
          <div className="flex items-center gap-2">
            <LayersOutlined fontSize="small" />
            <span>{lote.codigo}</span>
            {chip}
          </div>
        }
        onClick={() => onSelect({ type: 'lote', id: lote.id })}
      >
        {treeData.buildChildren(lote.id).map((child) => renderLote(child))}
      </TreeItem>
    );
  };

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
        selected={
          selectedNode.type === 'lote'
            ? [`lote-${selectedNode.id}`]
            : [`product-${productId}`]
        }
      >
        <TreeItem
          nodeId={`product-${productId}`}
          label={
            <div className="flex items-center gap-2">
              <Inventory2Outlined fontSize="small" />
            <span>{productoNombre ?? 'Producto'}</span>
          </div>
        }
        onClick={() => onSelect({ type: 'producto', id: productId })}
      >
        {treeData.roots.map((l) => renderLote(l))}
      </TreeItem>
    </TreeView>
  );
}

export default memo(PedidoTreeView);
