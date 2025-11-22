// lib/clientes.ts
'use server';

import type { Prisma } from '@/app/generated/prisma';
import { prisma } from './prisma';

export type CrearClienteInput = {
  nombre: string;
  apellido?: string | null;
  ubicacion?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export type ActualizarClienteInput = {
  id: number;
  nombre?: string;
  apellido?: string | null;
  ubicacion?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export async function listarClientes() {
  return prisma.cliente.findMany({
    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
  });
}

export async function obtenerCliente(id: number) {
  return prisma.cliente.findUnique({
    where: { id },
  });
}

export async function crearCliente(input: CrearClienteInput) {
  const data: Prisma.ClienteCreateInput = {
    nombre: input.nombre,
    apellido: input.apellido ?? null,
    ubicacion: input.ubicacion ?? null,
    telefono: input.telefono ?? null,
    email: input.email ?? null,
  };

  return prisma.cliente.create({ data });
}

export async function actualizarCliente(input: ActualizarClienteInput) {
  const { id, ...rest } = input;

  const data: Prisma.ClienteUpdateInput = {
    nombre: rest.nombre ?? undefined,
    apellido: rest.apellido ?? undefined,
    ubicacion: rest.ubicacion ?? undefined,
    telefono: rest.telefono ?? undefined,
    email: rest.email ?? undefined,
  };

  return prisma.cliente.update({
    where: { id },
    data,
  });
}

export async function eliminarCliente(id: number) {
  return prisma.cliente.delete({
    where: { id },
  });
}
    
