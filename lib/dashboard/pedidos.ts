'use server';

import type { z } from 'zod';
import { prisma } from '../prisma';
import { dashboardPedidosQuerySchema } from '../validators';
import {
  calcularAvancePedido,
  calcularTiempoRestantePedido,
  type PedidoConLotes,
} from '../calculos';
import { Prisma } from '@/app/generated/prisma/client';

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
  const where: Prisma.PedidoWhereInput = {
    lotes: { some: { estado: { not: 'TERMINADO' } } },
  };

  if (query.cliente) {
    where.cliente = {
      is: {
        nombre: {
          contains: query.cliente,
          mode: 'insensitive',
        },
      },
    };
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
        clienteId: true,
        contacto: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            nombre: true,
          },
        },
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
                estado: true,
                fechaEntrada: true,
                fechaSalida: true,
                notas: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.proceso.findMany({
      select: {
        id: true,
        orden: true,
        duracionEstandarDias: true,
      },
      orderBy: {
        orden: 'asc',
      },
    }),
  ]);

  type PedidoConCliente = PedidoConLotes & {
    cliente?: { nombre?: string | null } | null;
  };

  const mapped = pedidos.map<PedidoResumen>((pedido) => {
    const pedidoTyped = pedido as unknown as PedidoConCliente;

    const avancePedido = calcularAvancePedido(pedidoTyped as PedidoConLotes);
    const tiempoRestantePedido = calcularTiempoRestantePedido(
      pedidoTyped as PedidoConLotes,
      procesos,
    );
    const status = deriveStatus(avancePedido, tiempoRestantePedido);

    return {
      id: pedido.id,
      numero: pedido.numero,
      cliente: pedidoTyped.cliente?.nombre ?? 'N/A',
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
