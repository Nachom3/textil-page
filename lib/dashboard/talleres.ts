'use server';

import type { z } from 'zod';
import { prisma } from '../prisma';
import { dashboardTalleresQuerySchema } from '../validators';
import { Prisma } from '@/app/generated/prisma/client';

export type DashboardTalleresQuery = z.infer<typeof dashboardTalleresQuerySchema>;

export type TallerResumen = {
  id: number;
  nombre: string;
  tipo: string;
  lotesActivos: number;
  totalPrendas: number;
};

export async function getDashboardTalleresResumen(
  query: DashboardTalleresQuery,
): Promise<TallerResumen[]> {
  const where: Prisma.TallerWhereInput = {}; // ✅ Correct type usage

  if (query.q) {
    where.nombre = {
      contains: query.q,
      mode: 'insensitive',
    };
  }

  if (query.tipo) {
    where.tipo = {
      equals: query.tipo,
      mode: 'insensitive',
    };
  }

  const talleres = await prisma.taller.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      tipo: true,
      lotesActuales: {
        where: {
          estado: {
            in: ['ACTIVO', 'DIVIDIDO'],
          },
        },
        select: {
          id: true,
          cantidad: true,
        },
      },
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  return talleres.map((t) => {
    const lotesActivos = t.lotesActuales.length;
    const totalPrendas = t.lotesActuales.reduce((acc, l) => acc + (l.cantidad ?? 0), 0);

    return {
      id: t.id,
      nombre: t.nombre,
      tipo: t.tipo,
      lotesActivos,
      totalPrendas,
    };
  });
}
