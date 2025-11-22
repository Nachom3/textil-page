/// <reference types="vitest" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { obtenerPedidoConMetricas } from '../lib/pedidos';
import type { LoteConHistorial } from '../lib/calculos';

const findUniqueMock = vi.hoisted(() => vi.fn());
const findManyMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pedido: { findUnique: findUniqueMock },
    proceso: { findMany: findManyMock },
  },
}));

const baseLote = (overrides: Partial<LoteConHistorial> = {}): LoteConHistorial => ({
  id: overrides.id ?? 1,
  codigo: overrides.codigo ?? '10.1',
  pedidoId: overrides.pedidoId ?? 1,
  cantidad: overrides.cantidad ?? 5,
  estado: overrides.estado ?? 'ACTIVO',
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
  procesosHistorial: overrides.procesosHistorial ?? [],
  pedido: overrides.pedido ?? null,
  parentId: overrides.parentId ?? null,
  porcentajeCompletado: overrides.porcentajeCompletado ?? 0,
  fechaIngresoProcesoActual: overrides.fechaIngresoProcesoActual ?? null,
  fechaEstimadaFinalizacion: overrides.fechaEstimadaFinalizacion ?? null,
  tiempoRestanteDias: overrides.tiempoRestanteDias ?? 0,
  procesoActualId: overrides.procesoActualId ?? null,
  tallerActualId: overrides.tallerActualId ?? null,
  transportistaActualId: overrides.transportistaActualId ?? null,
  productoId: overrides.productoId ?? null,
});

describe('obtenerPedidoConMetricas', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    findManyMock.mockReset();
  });

  it('devuelve null si no encuentra pedido', async () => {
    findUniqueMock.mockResolvedValue(null);
    findManyMock.mockResolvedValue([]);

    const result = await obtenerPedidoConMetricas(99);
    expect(result).toBeNull();
  });

  it('calcula avance y tiempo restante', async () => {
    const ahora = new Date();
    findManyMock.mockResolvedValue([
      { id: 1, nombre: 'Corte', orden: 1, duracionEstandarDias: 2 },
      { id: 2, nombre: 'Costura', orden: 2, duracionEstandarDias: 1 },
    ]);

    findUniqueMock.mockResolvedValue({
      id: 1,
      numero: 10,
      clienteId: 1,
      createdAt: ahora,
      updatedAt: ahora,
      contacto: null,
      cliente: null,
      productos: [],
      lotes: [
        baseLote({
          procesosHistorial: [
            {
              id: 1,
              loteId: 1,
              procesoId: 1,
              tallerId: null,
              transportistaId: null,
              fechaEntrada: ahora,
              fechaSalida: ahora,
              notas: null,
              proceso: { id: 1, orden: 1, duracionEstandarDias: 2 },
              taller: null,
              transportista: null,
              createdAt: ahora,
              updatedAt: ahora,
            },
          ],
        }),
        baseLote({ id: 2, codigo: '10.2', procesosHistorial: [] }),
      ],
    });

    const result = await obtenerPedidoConMetricas(10);

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { numero: 10 } }),
    );
    expect(result?.metricas.avancePedido).toBeCloseTo(0.5, 2);
    expect(result?.metricas.tiempoRestantePedido).toBeCloseTo(2, 2);

    const lote1 = result?.lotes.find((l) => l.id === 1);
    const lote2 = result?.lotes.find((l) => l.id === 2);

    expect(lote1?.avance).toBe(1);
    expect(lote1?.tiempoRestanteDias).toBe(1);
    expect(lote2?.avance).toBe(0);
    expect(lote2?.tiempoRestanteDias).toBe(3);
  });
});
