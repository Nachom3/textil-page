'use client';

import { useMemo } from 'react';
import { Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import {
  LocalShipping,
  CheckCircleOutline,
  CallSplit,
  SwapHoriz,
  AccessTime,
} from '@mui/icons-material';
import { usePedidoActions } from '@/lib/hooks/usePedidoActions';

type Proceso = {
  id: number;
  procesoId: number | null;
  estado?: string | null;
  fechaEntrada?: Date | string | null;
  fechaSalida?: Date | string | null;
  notas?: string | null;
  esTransporte?: boolean | null;
  proceso?: { nombre?: string; orden?: number | null } | null;
};

type Lote = {
  id: number;
  codigo: string;
  cantidad: number;
  estado: string;
  tallerActual?: { nombre: string } | null;
  transportistaActual?: { nombre: string } | null;
  procesosHistorial: Proceso[];
};

type Props = {
  pedidoNumero: number;
  pedidoCliente?: string | null;
  productoNombre?: string | null;
  selectedLote?: Lote;
};

export default function LoteDetail({ selectedLote, pedidoNumero, pedidoCliente, productoNombre }: Props) {
  const { marcarCompleto, subdividirLote, moverLote } = usePedidoActions();

  const procesosOrdenados = useMemo(() => {
    if (!selectedLote) return [];
    return [...selectedLote.procesosHistorial].sort(
      (a, b) => (a.proceso?.orden ?? 0) - (b.proceso?.orden ?? 0),
    );
  }, [selectedLote]);

  if (!selectedLote) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Selecciona un lote para ver detalles</Typography>
        </CardContent>
      </Card>
    );
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="contained"
        size="small"
        startIcon={<CallSplit />}
        onClick={() => subdividirLote(selectedLote.id)}
      >
        Subdividir
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SwapHoriz />}
        onClick={() => moverLote(selectedLote.id)}
      >
        Mover/Transferir
      </Button>
      <Button
        variant="contained"
        color="success"
        size="small"
        startIcon={<CheckCircleOutline />}
        onClick={() => {
          const last = procesosOrdenados.find(
            (p) => p.estado !== 'COMPLETADO' && p.estado !== 'NO_ENVIADO',
          );
          if (last) marcarCompleto(selectedLote.id, last.proceso?.nombre ?? '');
        }}
      >
        Marcar completo
      </Button>
    </div>
  );

  return (
    <Stack spacing={2}>
      <Card className="sticky top-0 z-10 border border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-1">
          <Typography variant="h6">Lote {selectedLote.codigo}</Typography>
          <Typography variant="body2" color="text.secondary">
            Pedido #{pedidoNumero} · {pedidoCliente ?? 'Cliente'} · {productoNombre ?? 'Producto'}
          </Typography>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Chip label={selectedLote.estado} size="small" />
            <span>Cant: {selectedLote.cantidad}</span>
            {selectedLote.tallerActual?.nombre && <span>Taller: {selectedLote.tallerActual.nombre}</span>}
            {selectedLote.transportistaActual?.nombre && (
              <span>Transporte: {selectedLote.transportistaActual.nombre}</span>
            )}
          </div>
          <Divider className="my-2" />
          {headerActions}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Procesos
          </Typography>
          <Stack divider={<Divider />} spacing={1}>
            {procesosOrdenados.map((proc) => {
              const isTransporte = !!proc.esTransporte;
              const icon = isTransporte ? <LocalShipping fontSize="small" /> : <AccessTime fontSize="small" />;
              const color =
                proc.estado === 'COMPLETADO'
                  ? 'success'
                  : proc.estado === 'EN_PROCESO'
                    ? 'warning'
                    : 'default';

              return (
                <div key={proc.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {icon}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{proc.proceso?.nombre ?? 'Proceso'}</span>
                      <span className="text-xs text-slate-500">
                        {proc.estado ?? 'PENDIENTE'}
                        {proc.esTransporte ? ' · Transporte' : ''}
                      </span>
                    </div>
                  </div>
                  <Chip
                    size="small"
                    color={color as any}
                    label={proc.estado ?? 'PENDIENTE'}
                    variant={isTransporte ? 'outlined' : 'filled'}
                  />
                </div>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
