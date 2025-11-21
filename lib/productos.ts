'use server';

import { prisma } from './prisma';

export type CrearProductoInput = {
  nombre: string;
  codigo: string;
  tieneTalles?: boolean;
};

export type ActualizarProductoInput = {
  id: number;
  nombre?: string;
  codigo?: string;
  tieneTalles?: boolean;
};

export async function listarProductos() {
  return prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export async function crearProducto(input: CrearProductoInput) {
  const { nombre, codigo, tieneTalles = false } = input;

  return prisma.producto.create({
    data: {
      nombre,
      codigo,
      tieneTalles,
    },
  });
}

export async function actualizarProducto(input: ActualizarProductoInput) {
  const { id, ...data } = input;

  return prisma.producto.update({
    where: { id },
    data,
  });
}

export async function eliminarProducto(id: number) {
  return prisma.producto.delete({
    where: { id },
  });
}
