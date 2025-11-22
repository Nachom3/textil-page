'use server';

import { prisma } from './prisma';

export type CrearTransportistaInput = {
  nombre: string;
  telefono?: string | null;
};

export type ActualizarTransportistaInput = {
  id: number;
  nombre?: string;
  telefono?: string | null;
};

export async function listarTransportistas() {
  return prisma.transportista.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
}

export async function crearTransportista(input: CrearTransportistaInput) {
  const { nombre, telefono = null } = input;
  return prisma.transportista.create({
    data: { nombre, telefono },
  });
}

export async function actualizarTransportista(
  input: ActualizarTransportistaInput,
) {
  const { id, ...data } = input;
  return prisma.transportista.update({
    where: { id },
    data,
  });
}

export async function eliminarTransportista(id: number) {
  const activos = await prisma.lote.count({
    where: {
      transportistaActualId: id,
      estado: { in: ['ACTIVO', 'DIVIDIDO'] },
    },
  });
  if (activos > 0) {
    throw new Error('No se puede eliminar transportista con lotes activos');
  }

  return prisma.transportista.update({
    where: { id },
    data: { activo: false },
  });
}
