'use server';

import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { listarPedidos } from '@/lib/api/pedidos';
import { obtenerPedidoConMetricas } from '@/lib/pedidos';

const estadoChipColor = (estado?: string | null) => {
  switch (estado) {
    case 'TERMINADO':
      return 'success';
    case 'DIVIDIDO':
      return 'warning';
    default:
      return 'default';
  }
};

export default async function PedidosPage() {
  const pedidos = await listarPedidos();

  // Preload metrics for each pedido (sequential to avoid heavy load; can be parallelized if needed)
  const pedidosConMetricas = [];
  for (const p of pedidos) {
    const detalle = await obtenerPedidoConMetricas(p.numero);
    pedidosConMetricas.push(detalle);
  }

  return (
    <Box p={3} className="space-y-3">
      <div className="flex items-center justify-between">
        <Typography variant="h5">Pedidos</Typography>
        <Link href="/dashboard/pedidos/nuevo">
          <Button component="a" variant="contained">
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Numero</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Avance</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {pedidosConMetricas.map((p) => {
            if (!p) return null;
            const estadoLotes = p.lotes.every((l) => l.estado === 'TERMINADO')
              ? 'TERMINADO'
              : p.lotes.some((l) => l.estado === 'DIVIDIDO')
                ? 'DIVIDIDO'
                : 'ACTIVO';
            const avance = p.metricas.avancePedido ?? 0;
            return (
              <TableRow key={p.pedido.id} hover>
                <TableCell>#{p.pedido.numero}</TableCell>
                <TableCell>{p.pedido.cliente?.nombre ?? 'N/A'}</TableCell>
                <TableCell>{p.pedido.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip size="small" label={estadoLotes} color={estadoChipColor(estadoLotes) as any} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <LinearProgress
                      variant="determinate"
                      value={avance * 100}
                      sx={{ width: 120, height: 8, borderRadius: 4 }}
                    />
                    <span className="text-xs text-slate-600">{Math.round(avance * 100)}%</span>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <Link href={`/dashboard/pedidos/${p.pedido.numero}`}>
                    <Button component="a" size="small">
                      Ver
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
