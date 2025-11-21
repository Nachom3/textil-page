'use server';

import { prisma } from './prisma';

/**
 * Devuelve todos los talleres, ordenados por nombre.
 */
export async function listarTalleres() {
  return prisma.taller.findMany({
    orderBy: { nombre: 'asc' },
  });
}

/**
 * Devuelve un taller con los lotes que tiene actualmente.
 * Usa la relación lotesActuales definida en el schema.
 */
export async function obtenerTallerConLotes(id: number) {
  return prisma.taller.findUnique({
    where: { id },
    include: {
      lotesActuales: {
        include: {
          pedido: true,
          procesoActual: true,
        },
        orderBy: { codigo: 'asc' },
      },
    },
  });
}
