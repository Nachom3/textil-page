'use server';

import { prisma } from './prisma';

export type ResumenDiario = {
  fecha: Date;
  procesosCompletados: {
    porTaller: {
      tallerId: number | null;
      tallerNombre: string | null;
      cantidad: number;
    }[];
    porProceso: {
      procesoId: number | null;
      procesoNombre: string | null;
      cantidad: number;
    }[];
  };
  registrosManuales: Awaited<ReturnType<typeof prisma.registroManual.findMany>>;
  alertas: string[];
};

const rangoDia = (fecha: Date) => {
  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(fecha);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
};

export async function obtenerResumenDiario(fecha: Date | string): Promise<ResumenDiario> {
  const fechaBase = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const { inicio, fin } = rangoDia(fechaBase);

  const [procesos, registrosManuales] = await Promise.all([
    prisma.procesoRealizado.findMany({
      where: {
        fechaSalida: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        taller: { select: { id: true, nombre: true } },
        proceso: { select: { id: true, nombre: true } },
      },
    }),
    prisma.registroManual.findMany({
      where: {
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      orderBy: { fecha: 'asc' },
    }),
  ]);

  const porTallerMap = new Map<number | null, { nombre: string | null; count: number }>();
  const porProcesoMap = new Map<number | null, { nombre: string | null; count: number }>();

  for (const p of procesos) {
    const tKey = p.taller?.id ?? null;
    const tEntry = porTallerMap.get(tKey) ?? { nombre: p.taller?.nombre ?? null, count: 0 };
    tEntry.count += 1;
    porTallerMap.set(tKey, tEntry);

    const procKey = p.proceso?.id ?? null;
    const procEntry =
      porProcesoMap.get(procKey) ?? { nombre: p.proceso?.nombre ?? null, count: 0 };
    procEntry.count += 1;
    porProcesoMap.set(procKey, procEntry);
  }

  const procesosCompletados = {
    porTaller: Array.from(porTallerMap.entries()).map(([tallerId, data]) => ({
      tallerId,
      tallerNombre: data.nombre,
      cantidad: data.count,
    })),
    porProceso: Array.from(porProcesoMap.entries()).map(([procesoId, data]) => ({
      procesoId,
      procesoNombre: data.nombre,
      cantidad: data.count,
    })),
  };

  return {
    fecha: inicio,
    procesosCompletados,
    registrosManuales,
    alertas: [],
  };
}

export async function crearRegistroManual(input: {
  tipo: 'PAGO' | 'RECORDATORIO' | 'NOTA_GENERAL';
  descripcion: string;
  monto?: number | null;
  fecha?: Date;
  usuario?: string | null;
  pedidoId?: number | null;
  tallerId?: number | null;
}) {
  const { fecha, ...rest } = input;
  return prisma.registroManual.create({
    data: {
      ...rest,
      fecha: fecha ?? new Date(),
    },
  });
}
