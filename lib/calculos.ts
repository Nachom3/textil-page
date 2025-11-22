import type { Lote, Pedido } from '@/app/generated/prisma/client';

export type ProcesoLigero = {
  id: number;
  nombre?: string;
  orden?: number | null;
  duracionEstandarDias?: number | null;
};



type HistorialConProceso = {
  id: number;
  loteId: number;
  procesoId: number | null;
  tallerId: number | null;
  transportistaId: number | null;
  proceso: ProcesoLigero | null;
  taller?: any | null;
  transportista?: any | null;

  estado?: string | null;
  fechaEntrada?: Date | null;
  fechaSalida?: Date | null;
  notas?: string | null;
  precio?: number | null;
  requiereAdelanto?: boolean | null;
  especificaciones?: string | null;
  esTransporte?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
};


export type LoteConHistorial = Lote & {
  procesosHistorial: HistorialConProceso[];
};

export type PedidoConLotes = Pedido & {
  lotes: LoteConHistorial[];
};

export type LoteConMetricas = LoteConHistorial & {
  pedido?: Pedido | null;
  porcentajeCompletado?: number;
  fechaIngresoProcesoActual?: Date | null;
  fechaEstimadaFinalizacion?: Date | null;
  tiempoRestanteDias?: number;
  procesoActualId?: number | null;
  tallerActualId?: number | null;
  transportistaActualId?: number | null;
  productoId?: number | null;
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const DAY_MS = 1000 * 60 * 60 * 24;

const diasEntre = (desde: Date, hasta: Date) =>
  Math.max((hasta.getTime() - desde.getTime()) / DAY_MS, 0);

const buildDuracionLookup = (procesos?: ProcesoLigero[]) => {
  const map = new Map<number, number>();
  procesos?.forEach((p) => {
    if (typeof p.id === 'number' && typeof p.duracionEstandarDias === 'number') {
      map.set(p.id, p.duracionEstandarDias);
    }
  });
  return map;
};

const obtenerDuracionPaso = (
  paso: HistorialConProceso,
  lookup: Map<number, number>,
): number => {
  if (typeof paso.proceso?.duracionEstandarDias === 'number') {
    return paso.proceso.duracionEstandarDias ?? 0;
  }
  if (paso.procesoId && lookup.has(paso.procesoId)) {
    return lookup.get(paso.procesoId) ?? 0;
  }
  return 0;
};

export function calcularAvanceLote(lote: LoteConHistorial): number {
  if (lote.estado === 'TERMINADO') return 1;

  if (!lote.procesosHistorial.length) return 0;

  const completados = lote.procesosHistorial.filter(
    (p) => p.estado === 'COMPLETADO' || Boolean(p.fechaSalida),
  );
  return clamp(completados.length / lote.procesosHistorial.length);
}

export function calcularAvancePedido(pedido: PedidoConLotes): number {
  if (!pedido.lotes.length) return 0;

  const totalCantidad = pedido.lotes.reduce((acc, lote) => acc + (lote.cantidad ?? 0), 0);
  if (totalCantidad === 0) return 0;

  const acumulado = pedido.lotes.reduce((acc, lote) => {
    const peso = (lote.cantidad ?? 0) / totalCantidad;
    return acc + calcularAvanceLote(lote) * peso;
  }, 0);

  return clamp(acumulado);
}

export function calcularTiempoRestanteLote(
  lote: LoteConHistorial,
  procesos?: ProcesoLigero[],
): number {
  if (lote.estado === 'TERMINADO') return 0;

  const lookup = buildDuracionLookup(procesos);
  const completados = lote.procesosHistorial.filter(
    (p) => p.estado === 'COMPLETADO' || (!!p.fechaSalida && !p.estado),
  );

  const ultimoOrden = completados
    .map((p) => p.proceso?.orden ?? null)
    .filter((o): o is number => typeof o === 'number')
    .sort((a, b) => a - b)
    .at(-1) ?? 0;

  const restante = (procesos ?? [])
    .filter(
      (p) =>
        typeof p.orden === 'number' &&
        (ultimoOrden === 0 ? true : (p.orden ?? 0) > ultimoOrden),
    )
    .reduce((acc, p) => acc + Math.max(p.duracionEstandarDias ?? 0, 0), 0);

  return Math.max(restante, 0);
}

export function calcularTiempoRestantePedido(
  pedido: PedidoConLotes,
  procesos?: ProcesoLigero[],
): number {
  if (!pedido.lotes.length) return 0;

  const totalCantidad = pedido.lotes.reduce((acc, lote) => acc + (lote.cantidad ?? 0), 0);
  if (totalCantidad === 0) return 0;

  const acumulado = pedido.lotes.reduce((acc, lote) => {
    const peso = (lote.cantidad ?? 0) / totalCantidad;
    return acc + calcularTiempoRestanteLote(lote, procesos) * peso;
  }, 0);

  return Math.max(acumulado, 0);
}

export function calcularFechaEstimadaEntregaLote(
  lote: LoteConHistorial,
  procesos?: ProcesoLigero[],
): Date | null {
  const restanteDias = calcularTiempoRestanteLote(lote, procesos);
  if (!Number.isFinite(restanteDias)) return null;
  const base = new Date();
  return new Date(base.getTime() + Math.max(restanteDias, 0) * DAY_MS);
}

export function calcularCostoLote(lote: LoteConHistorial): number {
  return lote.procesosHistorial.reduce(
    (acc, paso) => acc + (paso.precio ?? 0),
    0,
  );
}

export function calcularCostoPedido(pedido: PedidoConLotes): number {
  if (!pedido.lotes.length) return 0;
  return pedido.lotes.reduce((acc, lote) => acc + calcularCostoLote(lote), 0);
}
