'use server';

import { prisma } from './prisma';

export type CrearTallerInput = {
  nombre: string;
  tipo: string; // ej: "Costura", "Bordado"
  direccion?: string | null;
  telefono?: string | null;
};

export type ActualizarTallerInput = {
  id: number;
  nombre?: string;
  tipo?: string;
  direccion?: string | null;
  telefono?: string | null;
};

export async function listarTalleres(opts?: { q?: string; tipo?: string }) {
  const { q, tipo } = opts || {};

  return prisma.taller.findMany({
    where: {
      activo: true,
      AND: [
        q
          ? {
              nombre: { contains: q, mode: 'insensitive' },
            }
          : {},
        tipo
          ? {
              tipo: { equals: tipo, mode: 'insensitive' },
            }
          : {},
      ],
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function obtenerTallerConDetalle(id: number) {
  return prisma.taller.findUnique({
    where: { id, activo: true },
    include: {
      lotesActuales: {
        include: {
          pedido: true,
          producto: true,
          procesoActual: true,
        },
      },
    },
  });
}

export async function crearTaller(input: CrearTallerInput) {
  const { nombre, tipo, direccion = null, telefono = null } = input;

  return prisma.taller.create({
    data: {
      nombre,
      tipo,
      direccion,
      telefono,
    },
  });
}

export async function actualizarTaller(input: ActualizarTallerInput) {
  const { id, ...data } = input;

  return prisma.taller.update({
    where: { id },
    data,
  });
}

export async function eliminarTaller(id: number) {
  const activos = await prisma.lote.count({
    where: {
      tallerActualId: id,
      estado: { in: ['ACTIVO', 'DIVIDIDO'] },
    },
  });
  if (activos > 0) {
    throw new Error('No se puede eliminar taller con lotes activos');
  }

  return prisma.taller.update({
    where: { id },
    data: { activo: false },
  });
}
