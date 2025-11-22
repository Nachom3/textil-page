import type { Lote, Pedido, ProcesoRealizado } from '@/app/generated/prisma';

export type ProcesoLigero = {
  id: number;
  nombre?: string;
  orden?: number | null;
  duracionEstandarDias?: number | null;
};



type HistorialConProceso = ProcesoRealizado & {
  proceso: ProcesoLigero | null;
  taller?: any | null;
  transportista?: any | null;

  // ✅ Add these lines 👇
  createdAt?: Date;
  updatedAt?: Date;
  notas?: string | null;
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

export function calcularAvanceLote(lote: LoteConHistorial): number {
  if (lote.estado === 'TERMINADO') return 1;

  if (!lote.procesosHistorial.length) return 0;

  const completados = lote.procesosHistorial.filter((p) => Boolean(p.fechaSalida));
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
  procesos: ProcesoLigero[],
): number {
  if (lote.estado === 'TERMINADO') return 0;

  const completadosPorOrden = lote.procesosHistorial
    .filter((p) => p.fechaSalida && p.proceso)
    .map((p) => p.proceso!)
    .filter((p) => typeof p.orden === 'number')
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const ultimoOrden = completadosPorOrden.at(-1)?.orden ?? 0;

  const restante = procesos
    .filter((p) => typeof p.orden === 'number' && p.orden > ultimoOrden)
    .reduce((acc, p) => acc + Math.max(p.duracionEstandarDias ?? 0, 0), 0);

  return Math.max(restante, 0);
}

export function calcularTiempoRestantePedido(
  pedido: PedidoConLotes,
  procesos: ProcesoLigero[],
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
