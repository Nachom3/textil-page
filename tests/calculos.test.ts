import { describe, expect, it } from 'vitest';
import {
  calcularAvanceLote,
  calcularAvancePedido,
  calcularTiempoRestanteLote,
  calcularTiempoRestantePedido,
  type LoteConMetricas,
  type PedidoConLotes,
  type ProcesoLigero,
} from '../lib/calculos';

const procesos: ProcesoLigero[] = [
  { id: 1, nombre: 'Corte', orden: 1, duracionEstandarDias: 1 },
  { id: 2, nombre: 'Costura', orden: 2, duracionEstandarDias: 1 },
  { id: 3, nombre: 'Plancha', orden: 3, duracionEstandarDias: 1 },
];

const baseLote = (overrides: Partial<LoteConMetricas> = {}): LoteConMetricas => ({
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

describe('calculos', () => {
  it('calcula avance de lote según procesos completados', () => {
    const lote = baseLote({
      procesosHistorial: [
        {
          id: 1,
          loteId: 1,
          procesoId: 1,
          tallerId: null,
          transportistaId: null,
          fechaEntrada: new Date(),
          fechaSalida: new Date(),
          notas: null,
          proceso: procesos[0],
          taller: null,
          transportista: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          loteId: 1,
          procesoId: 2,
          tallerId: null,
          transportistaId: null,
          fechaEntrada: new Date(),
          fechaSalida: null,
          notas: null,
          proceso: procesos[1],
          taller: null,
          transportista: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    expect(calcularAvanceLote(lote)).toBeCloseTo(0.5, 1);
  });

  it('pondera avance del pedido por cantidad de lotes', () => {
    const pedido: PedidoConLotes = {
      id: 1,
      numero: 10,
      clienteId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      contacto: null,
      lotes: [
        baseLote({
          id: 1,
          cantidad: 6,
          procesosHistorial: [
            {
              id: 1,
              loteId: 1,
              procesoId: 1,
              tallerId: null,
              transportistaId: null,
              fechaEntrada: new Date(),
              fechaSalida: new Date(),
              notas: null,
              proceso: procesos[0],
              taller: null,
              transportista: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }),
        baseLote({
          id: 2,
          codigo: '10.2',
          cantidad: 4,
          procesosHistorial: [],
        }),
      ],
    };

    // Lote 1 tiene 1/1 completado => 1. Lote 2 => 0. Ponderado: (1*6 + 0*4) / 10 = 0.6
    expect(calcularAvancePedido(pedido)).toBeCloseTo(0.6, 2);
  });

  it('calcula tiempo restante del lote', () => {
    const lote = baseLote({
      procesosHistorial: [
        {
          id: 1,
          loteId: 1,
          procesoId: 1,
          tallerId: null,
          transportistaId: null,
          fechaEntrada: new Date(),
          fechaSalida: new Date(),
          notas: null,
          proceso: procesos[0],
          taller: null,
          transportista: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    expect(calcularTiempoRestanteLote(lote, procesos)).toBe(2);

  });

  it('pondera tiempo restante del pedido por cantidad', () => {
    const lotes: LoteConMetricas[] = [
      baseLote({
        id: 1,
        cantidad: 5,
        procesosHistorial: [
          {
            id: 1,
            loteId: 1,
            procesoId: 1,
            tallerId: null,
            transportistaId: null,
            fechaEntrada: new Date(),
            fechaSalida: new Date(),
            notas: null,
            proceso: procesos[0],
            taller: null,
            transportista: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }),
      baseLote({ id: 2, codigo: '10.2', cantidad: 5, procesosHistorial: [] }),
    ];

    const pedido: PedidoConLotes = {
      id: 1,
      numero: 11,
      clienteId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      contacto: null,
      lotes,
    };

    // Lote1: faltan 2 procesos => 2d. Lote2: faltan 3 procesos => 3d. Ponderado: (2*5 + 3*5) / 10 = 2.5
    expect(calcularTiempoRestantePedido(pedido, procesos)).toBeCloseTo(2.5, 1);
  });
});

describe('calculos edge cases', () => {
  it('devuelve 1 de avance y 0 dias cuando el lote está TERMINADO', () => {
    const lote = baseLote({ estado: 'TERMINADO' });
    expect(calcularAvanceLote(lote)).toBe(1);
    expect(calcularTiempoRestanteLote(lote, procesos)).toBe(0);
  });

  it('devuelve 0 de avance si no hay historial', () => {
    const lote = baseLote({ procesosHistorial: [] });
    expect(calcularAvanceLote(lote)).toBe(0);
  });

  it('omite procesos sin orden o sin duración', () => {
    const lote = baseLote({
      procesosHistorial: [
        {
          id: 1,
          loteId: 1,
          procesoId: 10,
          tallerId: null,
          transportistaId: null,
          fechaEntrada: new Date(),
          fechaSalida: new Date(),
          notas: null,
          proceso: { id: 10, orden: null, duracionEstandarDias: null },
          taller: null,
          transportista: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const procesosSinOrden: ProcesoLigero[] = [
      { id: 10, orden: null, duracionEstandarDias: null },
    ];

    expect(calcularTiempoRestanteLote(lote, procesosSinOrden)).toBe(0);
  });

  it('retorna 0 si la cantidad total del pedido es 0', () => {
    const pedido: PedidoConLotes = {
      id: 1,
      numero: 1,
      clienteId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      contacto: null,
      lotes: [baseLote({ cantidad: 0 })],
    };

    expect(calcularAvancePedido(pedido)).toBe(0);
    expect(calcularTiempoRestantePedido(pedido, procesos)).toBe(0);
  });
});
