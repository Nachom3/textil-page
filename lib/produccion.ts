'use server';

import type {
  EstadoProceso,
  Lote,
  PlantillaPaso,
  ProcesoRealizado,
  Prisma,
  PrismaClient,
} from '@/app/generated/prisma/client';
import { prisma } from './prisma';

type AvanzarEstado = Extract<EstadoProceso, 'EN_PROCESO' | 'COMPLETADO'>;

type AvanzarDatos = {
  estado: AvanzarEstado;
  fecha?: Date;
  tallerId?: number | null;
  transportistaId?: number | null;
  notas?: string | null;
};

type TxClient = PrismaClient | Prisma.TransactionClient;

const normalizeFecha = (fecha?: Date) => fecha ?? new Date();

async function ensureProcesosForPlantilla(
  tx: TxClient,
  plantilla: Pick<
    PlantillaPaso,
    | 'nombre'
    | 'orden'
    | 'duracionEstimadaDias'
    | 'esTransporte'
    | 'precio'
    | 'requiereAdelanto'
    | 'especificaciones'
    | 'tallerPorDefectoId'
  >[],
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

async function generarPlanConTx(
  tx: TxClient,
  loteId: number,
  productoId: number,
) {
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
      esTransporte: true,
      precio: true,
      requiereAdelanto: true,
      especificaciones: true,
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
        estado: 'PENDIENTE',
        fechaEntrada: null,
        fechaSalida: null,
        tallerId: paso.tallerPorDefectoId ?? null,
        esTransporte: paso.esTransporte ?? false,
        precio: paso.precio ?? null,
        requiereAdelanto: paso.requiereAdelanto ?? false,
        especificaciones: paso.especificaciones ?? null,
        notas: paso.duracionEstimadaDias
          ? `Estimado: ${paso.duracionEstimadaDias} dias`
          : null,
      },
    });
    creados.push(creado);
  }

  return creados;
}

export async function generarPlanDeProduccion(
  loteId: number,
  productoId: number,
  tx?: TxClient,
) {
  if (tx) {
    return generarPlanConTx(tx, loteId, productoId);
  }

  return prisma.$transaction((innerTx) =>
    generarPlanConTx(innerTx, loteId, productoId),
  );
}

function assertLoteEditable(lote: Pick<Lote, 'estado'>) {
  if (lote.estado === 'TERMINADO') {
    throw new Error('No se pueden modificar procesos de un lote TERMINADO');
  }
}

export async function avanzarProceso(
  loteId: number,
  procesoNombre: string,
  datos: AvanzarDatos,
) {
  const ahora = normalizeFecha(datos.fecha);

  return prisma.$transaction(async (tx) => {
    const lote = await tx.lote.findUnique({
      where: { id: loteId },
      select: { estado: true },
    });
    if (!lote) throw new Error('Lote no encontrado');
    assertLoteEditable(lote);

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

    if (datos.estado === 'EN_PROCESO') {
      if (target.estado === 'EN_PROCESO') {
        throw new Error('El proceso ya fue iniciado');
      }
      if (target.estado === 'COMPLETADO') {
        throw new Error('El proceso ya fue completado');
      }

      await tx.procesoRealizado.update({
        where: { id: target.id },
        data: {
          estado: 'EN_PROCESO',
          fechaEntrada: target.fechaEntrada ?? ahora,
          fechaSalida: null,
          tallerId: datos.tallerId ?? target.tallerId,
          transportistaId: datos.transportistaId ?? target.transportistaId,
          notas: datos.notas ?? target.notas,
        },
      });
    }

    if (datos.estado === 'COMPLETADO') {
      if (target.estado === 'COMPLETADO') {
        throw new Error('El proceso ya fue completado');
      }

      const fechaEntrada = target.fechaEntrada ?? ahora;

      await tx.procesoRealizado.update({
        where: { id: target.id },
        data: {
          estado: 'COMPLETADO',
          fechaEntrada,
          fechaSalida: target.fechaSalida ?? ahora,
          tallerId: datos.tallerId ?? target.tallerId,
          transportistaId: datos.transportistaId ?? target.transportistaId,
          notas: datos.notas ?? target.notas,
        },
      });

      const prevPendientes = await tx.procesoRealizado.findMany({
        where: {
          loteId,
          estado: { not: 'COMPLETADO' },
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
            estado: 'COMPLETADO',
            fechaEntrada: prev.fechaEntrada ?? ahora,
            fechaSalida: prev.fechaSalida ?? ahora,
            notas: prev.notas
              ? `${prev.notas} | Auto-completado`
              : 'Auto-completado',
          },
        });
      }
    }

    if (target.esTransporte) {
      const transportistaActual =
        datos.transportistaId ?? target.transportistaId ?? null;
      await tx.lote.update({
        where: { id: loteId },
        data: { transportistaActualId: transportistaActual },
      });
    }

    return getEstadoLote(loteId, tx);
  });
}

export async function getEstadoLote(
  loteId: number,
  txClient: TxClient = prisma,
) {
  if (
    !(txClient as any).procesoRealizado ||
    typeof (txClient as any).procesoRealizado.findMany !== 'function'
  ) {
    return { status: 'PENDIENTE' as const };
  }

  const procesos = await txClient.procesoRealizado.findMany({
    where: { loteId },
    include: { proceso: true },
    orderBy: { id: 'asc' },
  });

  if (!procesos.length) return { status: 'PENDIENTE' as const };

  const allCompleted = procesos.every(
    (p) => p.estado === 'COMPLETADO' || (!!p.fechaSalida && !p.estado),
  );
  const anyInProgress = procesos.some((p) => p.estado === 'EN_PROCESO');

  const status = allCompleted
    ? ('TERMINADO' as const)
    : anyInProgress
      ? ('EN_PROCESO' as const)
      : ('PENDIENTE' as const);

  let procesoActualId: number | null = null;
  let tallerActualId: number | null = null;
  let transportistaActualId: number | null = null;

  if (!allCompleted) {
    const activo =
      procesos.find((p) => p.estado === 'EN_PROCESO') ??
      procesos.find((p) => p.estado !== 'COMPLETADO');

    if (activo) {
      procesoActualId = activo.procesoId ?? null;
      tallerActualId = activo.tallerId ?? null;
      transportistaActualId = activo.esTransporte
        ? activo.transportistaId ?? null
        : null;
    }
  }

  if (status === 'TERMINADO') {
    procesoActualId = null;
    tallerActualId = null;
    transportistaActualId = null;
  }

  await txClient.lote.update({
    where: { id: loteId },
    data: {
      procesoActualId,
      tallerActualId,
      transportistaActualId,
      estado: status === 'TERMINADO' ? 'TERMINADO' : undefined,
    },
  });

  return { status, procesoActualId, tallerActualId, transportistaActualId };
}
