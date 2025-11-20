// app/services/pedidos.ts
'use server';

import { prisma } from '../lib/prisma';
import { LoteEstado } from '../generated/prisma';

// ============= TIPOS =============

export type CrearPedidoInput = {
  numero: number;
  cliente: string;
  contacto?: string;
  items: { productoId: number; cantidad: number }[];
  crearLoteRaiz?: boolean;
};

export type SubLoteInput = {
  codigo: string; // ej "40.3"
  cantidad: number;
};

export type MoverLoteInput = {
  loteId: number;
  procesoId?: number;
  tallerId?: number | null;
  transportistaId?: number | null;
  fechaEntrada?: Date | string;
  fechaSalida?: Date | string | null;
  notas?: string;
  marcarTerminado?: boolean;
};

// ============= CREAR PEDIDO =============

export async function crearPedido(input: CrearPedidoInput) {
  const { numero, cliente, contacto, items, crearLoteRaiz = true } = input;

  if (!items || items.length === 0) {
    throw new Error('Items requeridos para crear un pedido');
  }

  const cantidadTotal = items.reduce((acc, it) => acc + it.cantidad, 0);

  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.create({
      data: {
        numero,
        cliente,
        contacto,
        productos: {
          create: items.map((it) => ({
            productoId: it.productoId,
            cantidad: it.cantidad,
          })),
        },
      },
    });

    let loteRaiz = null;

    if (crearLoteRaiz) {
      const codigoLote = `${pedido.numero}.1`;

      loteRaiz = await tx.lote.create({
        data: {
          codigo: codigoLote,
          pedidoId: pedido.id,
          cantidad: cantidadTotal,
          estado: LoteEstado.ACTIVO,
        },
      });
    }

    return { pedido, loteRaiz };
  });
}

// ============= CREAR LOTE SUELTO =============

export async function crearLote(params: {
  pedidoId: number;
  codigo: string;
  cantidad: number;
  parentId?: number | null;
}) {
  const { pedidoId, codigo, cantidad, parentId = null } = params;

  return prisma.lote.create({
    data: {
      codigo,
      pedidoId,
      cantidad,
      parentId,
      estado: LoteEstado.ACTIVO,
    },
  });
}

// ============= SUBDIVIDIR LOTE =============

export async function subdividirLote(
  loteId: number,
  subLotes: SubLoteInput[],
) {
  return prisma.$transaction(async (tx) => {
    const lotePadre = await tx.lote.findUnique({
      where: { id: loteId },
    });

    if (!lotePadre) throw new Error('Lote padre no encontrado');

    const sumaSubLotes = subLotes.reduce((acc, s) => acc + s.cantidad, 0);

    // Podes cambiar esto a <= si queres permitir merma
    if (sumaSubLotes !== lotePadre.cantidad) {
      throw new Error(
        `La suma (${sumaSubLotes}) no coincide con la cantidad del lote padre (${lotePadre.cantidad})`,
      );
    }

    await tx.lote.update({
      where: { id: lotePadre.id },
      data: { estado: LoteEstado.DIVIDIDO },
    });

    const nuevosSubLotes = await Promise.all(
      subLotes.map((s) =>
        tx.lote.create({
          data: {
            codigo: s.codigo,
            pedidoId: lotePadre.pedidoId,
            parentId: lotePadre.id,
            cantidad: s.cantidad,
            procesoActualId: lotePadre.procesoActualId,
            tallerActualId: lotePadre.tallerActualId,
            transportistaActualId: lotePadre.transportistaActualId,
          },
        }),
      ),
    );

    return { lotePadre, nuevosSubLotes };
  });
}

// ============= MOVER LOTE (HISTORIAL + UBICACION) =============

export async function moverLote(input: MoverLoteInput) {
  const {
    loteId,
    procesoId,
    tallerId = null,
    transportistaId = null,
    fechaEntrada = new Date(),
    fechaSalida = null,
    notas,
    marcarTerminado = false,
  } = input;

  const entrada = fechaEntrada ? new Date(fechaEntrada) : new Date();
  const salida = fechaSalida ? new Date(fechaSalida) : null;

  return prisma.$transaction(async (tx) => {
    const lote = await tx.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new Error('Lote no encontrado');

    const procesoRealizado = await tx.procesoRealizado.create({
      data: {
        loteId,
        procesoId: procesoId ?? null,
        tallerId,
        transportistaId,
        fechaEntrada: entrada,
        fechaSalida: salida,
        notas,
      },
    });

    const loteActualizado = await tx.lote.update({
      where: { id: loteId },
      data: {
        procesoActualId: procesoId ?? null,
        tallerActualId: tallerId,
        transportistaActualId: transportistaId,
        estado: marcarTerminado ? LoteEstado.TERMINADO : lote.estado,
      },
    });

    return { procesoRealizado, loteActualizado };
  });
}

// ============= RASTREO =============

export async function rastrearPedidoPorNumero(numeroPedido: number) {
  return prisma.pedido.findUnique({
    where: { numero: numeroPedido },
    include: {
      lotes: {
        include: {
          parent: true,
          children: true,
          procesoActual: true,
          tallerActual: true,
          transportistaActual: true,
          procesosHistorial: {
            include: {
              proceso: true,
              taller: true,
              transportista: true,
            },
            orderBy: { fechaEntrada: 'asc' },
          },
        },
      },
      productos: {
        include: { producto: true },
      },
    },
  });
}

export async function buscarPedidosPorCliente(nombreCliente: string) {
  return prisma.pedido.findMany({
    where: {
      cliente: {
        contains: nombreCliente,
        mode: 'insensitive',
      },
    },
    include: {
      lotes: {
        include: {
          procesoActual: true,
          tallerActual: true,
          transportistaActual: true,
        },
      },
    },
  });
}

// ============= LOTES POR TALLER =============

export async function verLotesEnTaller(tallerId: number) {
  return prisma.lote.findMany({
    where: {
      tallerActualId: tallerId,
      estado: { in: [LoteEstado.ACTIVO, LoteEstado.DIVIDIDO] },
    },
    include: {
      pedido: true,
      procesoActual: true,
    },
  });
}

// ============= REPORTE DIARIO =============

export async function reporteProcesosDia(fecha: Date) {
  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(fecha);
  fin.setHours(23, 59, 59, 999);

  return prisma.procesoRealizado.findMany({
    where: {
      fechaEntrada: {
        gte: inicio,
        lte: fin,
      },
    },
    include: {
      lote: {
        include: {
          pedido: true,
        },
      },
      proceso: true,
      taller: true,
      transportista: true,
    },
    orderBy: {
      fechaEntrada: 'asc',
    },
  });
}
