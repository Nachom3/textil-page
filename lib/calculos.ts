import type { Lote, Pedido, ProcesoRealizado } from '@/app/generated/prisma';

type ProcesoLigero = {
  id: number;
  orden?: number | null;
  duracionEstandarDias?: number | null;
};

type HistorialConProceso = ProcesoRealizado & { proceso: ProcesoLigero | null };

export type LoteConHistorial = Lote & {
  procesosHistorial: HistorialConProceso[];
};

export type PedidoConLotes = Pedido & {
  lotes: LoteConHistorial[];
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Calcula el porcentaje de avance de un lote en base a los procesos que ya se terminaron.
 * Usa fechaSalida como indicador de finalizaci�n de cada proceso.
 */
export function calcularAvanceLote(lote: LoteConHistorial): number {
  if (lote.estado === 'TERMINADO') return 1;

  if (!lote.procesosHistorial.length) return 0;

  const completados = lote.procesosHistorial.filter(
    (p) => Boolean(p.fechaSalida),
  );
  return clamp(completados.length / lote.procesosHistorial.length);
}

/**
 * Porcentaje ponderado por cantidad del pedido (promedia los avances de sus lotes).
 */
export function calcularAvancePedido(pedido: PedidoConLotes): number {
  if (!pedido.lotes.length) return 0;

  const totalCantidad = pedido.lotes.reduce(
    (acc, lote) => acc + (lote.cantidad ?? 0),
    0,
  );
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
    .reduce(
      (acc, p) => acc + Math.max(p.duracionEstandarDias ?? 0, 0),
      0,
    );

  return Math.max(restante, 0);
}

/**
 * D�as restantes ponderados del pedido: pondera cada lote por su cantidad.
 */
export function calcularTiempoRestantePedido(
  pedido: PedidoConLotes,
  procesos: ProcesoLigero[],
): number {
  if (!pedido.lotes.length) return 0;

  const totalCantidad = pedido.lotes.reduce(
    (acc, lote) => acc + (lote.cantidad ?? 0),
    0,
  );
  if (totalCantidad === 0) return 0;

  const acumulado = pedido.lotes.reduce((acc, lote) => {
    const peso = (lote.cantidad ?? 0) / totalCantidad;
    return acc + calcularTiempoRestanteLote(lote, procesos) * peso;
  }, 0);

  return Math.max(acumulado, 0);
}
