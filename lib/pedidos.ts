// lib/pedidos.ts
'use server';

import { prisma } from './prisma';
import {
  calcularAvanceLote,
  calcularAvancePedido,
  calcularTiempoRestanteLote,
  calcularTiempoRestantePedido,
  type LoteConHistorial,
} from './calculos';

// ---------- TIPOS ----------

export type CrearPedidoInput = {
  numero: number;
  clienteId?: number;
  clienteNombre?: string;
  contacto?: string;
  items: { productoId: number; cantidad: number }[];
  /**
   * @deprecated
   * Antes se usaba para crear un único lote raíz.
   * Ahora, si es true (o se omite), se crean lotes raíz por cada item.
   * Si es false, no se crean lotes automáticamente.
   */
  crearLoteRaiz?: boolean;
};

export type SubLoteInput = {
  codigo: string;
  cantidad: number;
};

export type MoverLoteInput = {
  loteId: number;
  procesoId?: number;
  tallerId?: number | null;
  transportistaId?: number | null;
  fechaEntrada?: Date;
  fechaSalida?: Date | null;
  notas?: string;
  marcarTerminado?: boolean;
};

// ---------- CREAR PEDIDO ----------

export async function crearPedido(input: CrearPedidoInput) {
  const {
    numero,
    clienteId,
    clienteNombre,
    contacto,
    items,
    crearLoteRaiz = true,
  } = input;

  const nombreParaCrear = clienteNombre;

  if (!clienteId && !nombreParaCrear) {
    throw new Error('clienteId o clienteNombre son requeridos');
  }

  return prisma.$transaction(async (tx) => {
    let resolvedClienteId = clienteId ?? null;

    if (!resolvedClienteId && nombreParaCrear) {
      const clienteExistente = await tx.cliente.findFirst({
        where: { nombre: { equals: nombreParaCrear, mode: 'insensitive' } },
      });

      if (clienteExistente) {
        resolvedClienteId = clienteExistente.id;
      } else {
        const nuevoCliente = await tx.cliente.create({
          data: { nombre: nombreParaCrear },
        });
        resolvedClienteId = nuevoCliente.id;
      }
    }

    // 1) Crear el pedido + sus items
    const pedido = await tx.pedido.create({
      data: {
        numero,
        clienteId: resolvedClienteId!,
        contacto,
        productos: {
          create: items.map((it) => ({
            productoId: it.productoId,
            cantidad: it.cantidad,
          })),
        },
      },
    });

    // 2) Crear lotes raíz por cada item (40.1, 40.2, ...) si se pidió
    let lotesRaiz: unknown[] = [];

    if (crearLoteRaiz) {
      lotesRaiz = await Promise.all(
        items.map((it, index) =>
          tx.lote.create({
            data: {
              codigo: `${pedido.numero}.${index + 1}`, // ej: 40.1, 40.2
              pedidoId: pedido.id,
              cantidad: it.cantidad,
              estado: 'ACTIVO',
              productoId: it.productoId,
            },
          }),
        ),
      );
    }

    return { pedido, lotesRaiz };
  });
}

// ---------- CREAR LOTE SUELTO ----------

export async function crearLote(params: {
  pedidoId: number;
  codigo: string;
  cantidad: number;
  parentId?: number | null;
  productoId?: number | null;
}) {
  const {
    pedidoId,
    codigo,
    cantidad,
    parentId = null,
    productoId = null,
  } = params;

  return prisma.lote.create({
    data: {
      codigo,
      pedidoId,
      cantidad,
      parentId,
      estado: 'ACTIVO',
      productoId,
    },
  });
}

// ---------- SUBDIVIDIR LOTE ----------

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
    if (sumaSubLotes !== lotePadre.cantidad) {
      throw new Error(
        `La suma de los sublotes (${sumaSubLotes}) no coincide con la cantidad del lote padre (${lotePadre.cantidad})`,
      );
    }

    // 1) Marcar padre como DIVIDIDO
    await tx.lote.update({
      where: { id: lotePadre.id },
      data: { estado: 'DIVIDIDO' },
    });

    // 2) Crear sublotes heredando el producto del padre
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
            productoId: lotePadre.productoId ?? null,
          },
        }),
      ),
    );

    return { lotePadre, nuevosSubLotes };
  });
}

// ---------- MOVER LOTE (HISTORIAL + UBICACIÓN) ----------

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

  return prisma.$transaction(async (tx) => {
    const lote = await tx.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new Error('Lote no encontrado');

    const procesoRealizado = await tx.procesoRealizado.create({
      data: {
        loteId,
        procesoId: procesoId ?? null,
        tallerId,
        transportistaId,
        fechaEntrada,
        fechaSalida,
        notas,
      },
    });

    const loteActualizado = await tx.lote.update({
      where: { id: loteId },
      data: {
        procesoActualId: procesoId ?? null,
        tallerActualId: tallerId,
        transportistaActualId: transportistaId,
        estado: marcarTerminado ? 'TERMINADO' : lote.estado,
      },
    });

    return { procesoRealizado, loteActualizado };
  });
}

// ---------- RASTREO ----------

export async function rastrearPedidoPorNumero(numeroPedido: number) {
  return prisma.pedido.findUnique({
    where: { numero: numeroPedido },
    include: {
      lotes: {
        include: {
          parent: true,
          children: true,
          producto: true, // 👈 ver producto del lote
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
        nombre: { contains: nombreCliente, mode: 'insensitive' },
      },
    },
    include: {
      cliente: true,
      lotes: {
        include: {
          producto: true,
          procesoActual: true,
          tallerActual: true,
          transportistaActual: true,
        },
      },
    },
  });
}

export async function verLotesEnTaller(tallerId: number) {
  return prisma.lote.findMany({
    where: {
      tallerActualId: tallerId,
      estado: { in: ['ACTIVO', 'DIVIDIDO'] },
    },
    include: {
      pedido: true,
      producto: true, // 👈 para mostrar "sábana", "pantalón", etc.
      procesoActual: true,
    },
  });
}

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
          producto: true, // 👈 para que el reporte muestre también el producto
        },
      },
      proceso: true,
      taller: true,
      transportista: true,
    },
    orderBy: { fechaEntrada: 'asc' },
  });
}

// ---------- M�TRICAS / AVANCE ----------

export async function obtenerPedidoConMetricas(
  numeroPedido: number,
) {
  const [pedido, procesos] = await Promise.all([
    prisma.pedido.findUnique({
      where: { numero: numeroPedido },
      include: {
        cliente: true,
        productos: { include: { producto: true } },
        lotes: {
          include: {
            parent: true,
            children: true,
            producto: true,
            procesoActual: true,
            tallerActual: true,
            transportistaActual: true,
            procesosHistorial: {
              include: {
                proceso: {
                  select: {
                    id: true,
                    nombre: true,
                    orden: true,
                    duracionEstandarDias: true,
                  },
                },
                taller: true,
                transportista: true,
              },
              orderBy: { fechaEntrada: 'asc' },
            },
          },
          orderBy: { codigo: 'asc' },
        },
      },
    }),
    prisma.proceso.findMany({
      select: { id: true, nombre: true, orden: true, duracionEstandarDias: true },
      orderBy: { orden: 'asc' },
    }),
  ]);

  if (!pedido) return null;

  const lotesConMetricas = pedido.lotes.map((lote) => {
    const avance = calcularAvanceLote(lote as LoteConHistorial);
    const tiempoRestanteDias = calcularTiempoRestanteLote(
      lote as LoteConHistorial,
      procesos,
    );
    return { ...lote, avance, tiempoRestanteDias };
  });

  const pedidoParaCalcular = { ...pedido, lotes: lotesConMetricas };
  const avancePedido = calcularAvancePedido(pedidoParaCalcular);
  const tiempoRestantePedido = calcularTiempoRestantePedido(
    pedidoParaCalcular,
    procesos,
  );

  return {
    pedido: pedidoParaCalcular,
    lotes: lotesConMetricas,
    metricas: {
      avancePedido,
      tiempoRestantePedido,
    },
  };
}
