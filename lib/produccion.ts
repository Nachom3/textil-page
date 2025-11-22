'use server';

import type {
  PlantillaPaso,
  ProcesoRealizado,
  Prisma,
  PrismaClient,
} from '@/app/generated/prisma';
import { prisma } from './prisma';

type AvanzarEstado = 'EN_PROCESO' | 'COMPLETADO';

type AvanzarDatos = {
  estado: AvanzarEstado;
  fecha?: Date;
  tallerId?: number | null;
  notas?: string | null;
};

type TxClient = PrismaClient | Prisma.TransactionClient;

const normalizeFecha = (fecha?: Date) => fecha ?? new Date();

async function ensureProcesosForPlantilla(
  tx: TxClient,
  plantilla: Pick<PlantillaPaso, 'nombre' | 'orden' | 'duracionEstimadaDias'>[],
) {
  const procesosMap = new Map<string, number>();

  for (const paso of plantilla) {
    const proc = await tx.proceso.upsert({
      where: { nombre: paso.nombre },
      update: {
        orden: paso.orden,
        duracionEstandarDias: paso.duracionEstimadaDias ?? undefined,
      },
      create: {
        nombre: paso.nombre,
        orden: paso.orden,
        duracionEstandarDias: paso.duracionEstimadaDias ?? 1,
      },
    });
    procesosMap.set(paso.nombre, proc.id);
  }

  return procesosMap;
}

export async function generarPlanDeProduccion(
  loteId: number,
  productoId: number,
) {
  return prisma.$transaction(async (tx) => {
    if (
      typeof (tx as any).procesoRealizado?.findMany !== 'function' ||
      typeof (tx as any).proceso?.upsert !== 'function'
    ) {
      return [];
    }

    const existing = await tx.procesoRealizado.findMany({ where: { loteId } });
    if (existing.length) return existing;

    const plantilla = await tx.plantillaPaso.findMany({
      where: { productoId },
      orderBy: { orden: 'asc' },
      select: {
        nombre: true,
        orden: true,
        duracionEstimadaDias: true,
        tallerPorDefectoId: true,
      },
    });

    if (!plantilla.length) return [];

    const procesosMap = await ensureProcesosForPlantilla(tx, plantilla);

    const creados: ProcesoRealizado[] = [];
    for (const paso of plantilla) {
      const procesoId = procesosMap.get(paso.nombre);
      if (!procesoId) continue;

      const creado = await tx.procesoRealizado.create({
        data: {
          loteId,
          procesoId,
          tallerId: paso.tallerPorDefectoId ?? null,
          fechaEntrada: null,
          fechaSalida: null,
          notas: paso.duracionEstimadaDias
            ? `Estimado: ${paso.duracionEstimadaDias} dias`
            : null,
        },
      });
      creados.push(creado);
    }

    return creados;
  });
}

export async function avanzarProceso(
  loteId: number,
  procesoNombre: string,
  datos: AvanzarDatos,
) {
  const ahora = normalizeFecha(datos.fecha);

  return prisma.$transaction(async (tx) => {
    const target = await tx.procesoRealizado.findFirst({
      where: {
        loteId,
        proceso: { nombre: { equals: procesoNombre, mode: 'insensitive' } },
      },
      include: { proceso: true },
    });

    if (!target || !target.proceso) {
      throw new Error('Proceso no encontrado para el lote');
    }

    const fechaEntrada =
      datos.estado === 'EN_PROCESO' || datos.estado === 'COMPLETADO'
        ? target.fechaEntrada ?? ahora
        : target.fechaEntrada;
    const fechaSalida =
      datos.estado === 'COMPLETADO'
        ? target.fechaSalida ?? ahora
        : target.fechaSalida;

    await tx.procesoRealizado.update({
      where: { id: target.id },
      data: {
        fechaEntrada,
        fechaSalida,
        tallerId: datos.tallerId ?? target.tallerId,
        notas: datos.notas ?? target.notas,
      },
    });

    if (datos.estado === 'COMPLETADO') {
      const prevPendientes = await tx.procesoRealizado.findMany({
        where: {
          loteId,
          fechaSalida: null,
          proceso: {
            orden: { lt: target.proceso.orden ?? 0 },
          },
        },
        include: { proceso: true },
      });

      for (const prev of prevPendientes) {
        await tx.procesoRealizado.update({
          where: { id: prev.id },
          data: {
            fechaEntrada: prev.fechaEntrada ?? ahora,
            fechaSalida: ahora,
            notas: prev.notas
              ? `${prev.notas} | Auto-completado`
              : 'Auto-completado',
          },
        });
      }
    }

    return getEstadoLote(loteId, tx);
  });
}

export async function getEstadoLote(
  loteId: number,
  txClient: TxClient = prisma,
) {
  const procesos = await txClient.procesoRealizado.findMany({
    where: { loteId },
    include: { proceso: true },
    orderBy: { id: 'asc' },
  });

  if (!procesos.length) return { status: 'PENDIENTE' as const };

  const completados = procesos.filter((p) => p.fechaSalida);
  const iniciados = procesos.filter((p) => p.fechaEntrada);

  const allCompleted = completados.length === procesos.length;
  const anyStarted = iniciados.length > 0;

  const status = allCompleted
    ? ('TERMINADO' as const)
    : anyStarted
      ? ('EN_PROCESO' as const)
      : ('PENDIENTE' as const);

  let procesoActualId: number | null = null;
  let tallerActualId: number | null = null;

  if (!allCompleted) {
    const activo =
      procesos.find((p) => p.fechaEntrada && !p.fechaSalida) ??
      procesos.find((p) => !p.fechaSalida);
    if (activo) {
      procesoActualId = activo.procesoId ?? null;
      tallerActualId = activo.tallerId ?? null;
    }
  }

  if (status === 'TERMINADO') {
    procesoActualId = null;
    tallerActualId = null;
  }

  await txClient.lote.update({
    where: { id: loteId },
    data: {
      procesoActualId,
      tallerActualId,
      estado: status === 'TERMINADO' ? 'TERMINADO' : undefined,
    },
  });

  return { status, procesoActualId, tallerActualId };
}
