import type { z } from 'zod';
import {
  calcularAvancePedido,
  calcularTiempoRestantePedido,
  type PedidoConLotes,
} from '../calculos';
import { prisma } from '../prisma';
import { dashboardPedidosQuerySchema } from '../validators';

export type DashboardPedidosQuery = z.infer<typeof dashboardPedidosQuerySchema>;

export type PedidoResumenStatus = 'IN_PROCESS' | 'DELAYED' | 'COMPLETED';

export type PedidoResumen = {
  id: number;
  numero: number;
  cliente: string;
  contacto: string | null;
  createdAt: Date;
  updatedAt: Date;
  avancePedido: number;
  tiempoRestantePedido: number;
  status: PedidoResumenStatus;
};

const deriveStatus = (
  avance: number,
  tiempoRestante: number,
): PedidoResumenStatus => {
  if (avance >= 1) return 'COMPLETED';
  if (tiempoRestante <= 0) return 'DELAYED';
  return 'IN_PROCESS';
};

export async function getDashboardPedidosResumen(
  query: DashboardPedidosQuery,
): Promise<PedidoResumen[]> {
  const where: Parameters<typeof prisma.pedido.findMany>[0]['where'] = {
    lotes: { some: { estado: { not: 'TERMINADO' } } },
  };

  if (query.cliente) {
    where.cliente = { contains: query.cliente, mode: 'insensitive' };
  }
  if (query.desde || query.hasta) {
    where.createdAt = {
      gte: query.desde ?? undefined,
      lte: query.hasta ?? undefined,
    };
  }

  const [pedidos, procesos] = await Promise.all([
    prisma.pedido.findMany({
      where,
      select: {
        id: true,
        numero: true,
        cliente: true,
        contacto: true,
        createdAt: true,
        updatedAt: true,
        lotes: {
          select: {
            id: true,
            codigo: true,
            pedidoId: true,
            cantidad: true,
            estado: true,
            createdAt: true,
            updatedAt: true,
            procesosHistorial: {
              orderBy: { fechaEntrada: 'asc' },
              select: {
                id: true,
                loteId: true,
                procesoId: true,
                tallerId: true,
                transportistaId: true,
                fechaEntrada: true,
                fechaSalida: true,
                notas: true,
                updatedAt: true,
                proceso: {
                  select: {
                    id: true,
                    orden: true,
                    duracionEstandarDias: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.proceso.findMany({
      select: { id: true, orden: true, duracionEstandarDias: true },
      orderBy: { orden: 'asc' },
    }),
  ]);

  const mapped = pedidos.map<PedidoResumen>((pedido) => {
    const pedidoTyped = pedido as unknown as PedidoConLotes;
    const avancePedido = calcularAvancePedido(pedidoTyped);
    const tiempoRestantePedido = calcularTiempoRestantePedido(
      pedidoTyped,
      procesos,
    );
    const status = deriveStatus(avancePedido, tiempoRestantePedido);

    return {
      id: pedido.id,
      numero: pedido.numero,
      cliente: pedido.cliente,
      contacto: pedido.contacto ?? null,
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
      avancePedido,
      tiempoRestantePedido,
      status,
    };
  });

  if (query.status) {
    return mapped.filter((p) => p.status === query.status);
  }

  return mapped;
}
