'use server';

import type { Prisma } from '@/app/generated/prisma/client';
import { prisma } from './prisma';

export type PlantillaPasoInput = {
  id?: number;
  nombre: string;
  orden: number;
  duracionEstimadaDias?: number | null;
  tallerPorDefectoId?: number | null;
  precio?: number | null;
  requiereAdelanto?: boolean;
  especificaciones?: string | null;
  esTransporte?: boolean;
};

export type CrearProductoInput = {
  nombre: string;
  codigo: string;
  tieneTalles?: boolean;
  plantilla?: PlantillaPasoInput[];
};

export type ActualizarProductoInput = {
  id: number;
  nombre?: string;
  codigo?: string;
  tieneTalles?: boolean;
  plantilla?: PlantillaPasoInput[];
};

export async function listarProductos() {
  return prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export async function crearProducto(input: CrearProductoInput) {
  const { nombre, codigo, tieneTalles = false, plantilla } = input;

  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.create({
      data: { nombre, codigo, tieneTalles },
    });

    if (plantilla?.length) {
      await tx.plantillaPaso.createMany({
        data: plantilla.map((p) => ({
          productoId: producto.id,
          nombre: p.nombre,
          orden: p.orden,
          duracionEstimadaDias: p.duracionEstimadaDias ?? null,
          tallerPorDefectoId: p.tallerPorDefectoId ?? null,
          precio: p.precio ?? null,
          requiereAdelanto: p.requiereAdelanto ?? false,
          especificaciones: p.especificaciones ?? null,
          esTransporte: p.esTransporte ?? false,
        })),
      });
    }

    return producto;
  });
}

export async function actualizarProducto(input: ActualizarProductoInput) {
  const { id, plantilla, ...rest } = input;

  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.update({
      where: { id },
      data: rest,
    });

    if (plantilla) {
      const existentes = await tx.plantillaPaso.findMany({
        where: { productoId: id },
        select: { id: true },
      });
      const incomingIds = new Set(
        plantilla.map((p) => (p.id ? Number(p.id) : null)).filter(Boolean) as number[],
      );

      const toDelete = existentes
        .map((p) => p.id)
        .filter((eid) => !incomingIds.has(eid));

      if (toDelete.length) {
        await tx.plantillaPaso.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const paso of plantilla) {
        if (paso.id) {
          await tx.plantillaPaso.update({
            where: { id: paso.id },
            data: {
              nombre: paso.nombre,
              orden: paso.orden,
              duracionEstimadaDias: paso.duracionEstimadaDias ?? null,
              tallerPorDefectoId: paso.tallerPorDefectoId ?? null,
              precio: paso.precio ?? null,
              requiereAdelanto: paso.requiereAdelanto ?? false,
              especificaciones: paso.especificaciones ?? null,
              esTransporte: paso.esTransporte ?? false,
            },
          });
        } else {
          await tx.plantillaPaso.create({
            data: {
              productoId: id,
              nombre: paso.nombre,
              orden: paso.orden,
              duracionEstimadaDias: paso.duracionEstimadaDias ?? null,
              tallerPorDefectoId: paso.tallerPorDefectoId ?? null,
              precio: paso.precio ?? null,
              requiereAdelanto: paso.requiereAdelanto ?? false,
              especificaciones: paso.especificaciones ?? null,
              esTransporte: paso.esTransporte ?? false,
            },
          });
        }
      }
    }

    return producto;
  });
}

export async function eliminarProducto(id: number) {
  return prisma.producto.delete({
    where: { id },
  });
}

export async function obtenerConfiguracionProducto(productoId: number) {
  return prisma.producto.findUnique({
    where: { id: productoId },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      tieneTalles: true,
      plantillaPasos: {
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          nombre: true,
          orden: true,
          duracionEstimadaDias: true,
          tallerPorDefectoId: true,
          precio: true,
          requiereAdelanto: true,
          especificaciones: true,
          esTransporte: true,
          tallerPorDefecto: { select: { id: true, nombre: true } },
        },
      },
    },
  });
}
