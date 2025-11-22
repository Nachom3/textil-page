'use server';

import { prisma } from '../prisma';

export async function listarPedidos() {
  return prisma.pedido.findMany({
    include: {
      cliente: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
