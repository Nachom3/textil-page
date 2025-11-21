// lib/clientes.ts
'use server';

import { prisma } from './prisma';

export type CrearClienteInput = {
  nombre?: string | null;
  apellido?: string | null;
  ubicacion?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export type ActualizarClienteInput = {
  id: number;
  nombre?: string | null;
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
  return prisma.cliente.create({
    data: {
      nombre: input.nombre ?? null,
      apellido: input.apellido ?? null,
      ubicacion: input.ubicacion ?? null,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
    },
  });
}

export async function actualizarCliente(input: ActualizarClienteInput) {
  const { id, ...data } = input;

  return prisma.cliente.update({
    where: { id },
    data, // data ya tiene string | null | undefined, que Prisma acepta
  });
}

export async function eliminarCliente(id: number) {
  return prisma.cliente.delete({
    where: { id },
  });
}
    