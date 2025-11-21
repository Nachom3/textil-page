/// <reference types="vitest" />

type MockFn = ReturnType<typeof vi.fn>;

type TxMock = {
  pedido: { create: MockFn };
  lote: { create: MockFn; update: MockFn; findUnique: MockFn };
  procesoRealizado: { create: MockFn };
};

type PrismaMock = {
  $transaction: MockFn;
  lote: { findMany: MockFn };
  procesoRealizado: { findMany: MockFn };
};

const { prismaMock, txMock } = vi.hoisted<{
  prismaMock: PrismaMock;
  txMock: TxMock;
}>(() => {
  const tx: TxMock = {
    pedido: { create: vi.fn() },
    lote: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    procesoRealizado: {
      create: vi.fn(),
    },
  };

  const prisma: PrismaMock = {
    $transaction: vi.fn(
      async (fn: (client: TxMock) => unknown | Promise<unknown>) =>
        fn(tx),
    ),
    lote: {
      findMany: vi.fn(),
    },
    procesoRealizado: {
      findMany: vi.fn(),
    },
  };

  return { prismaMock: prisma, txMock: tx };
});

vi.mock('../lib/prisma', () => ({
  prisma: prismaMock,
}));

import {
  crearPedido,
  moverLote,
  reporteProcesosDia,
  subdividirLote,
} from '../lib/pedidos';

describe('pedidos service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mocks: MockFn[] = [
      txMock.pedido.create,
      txMock.lote.create,
      txMock.lote.update,
      txMock.lote.findUnique,
      txMock.procesoRealizado.create,
      prismaMock.lote.findMany,
      prismaMock.procesoRealizado.findMany,
      prismaMock.$transaction,
    ];

    mocks.forEach((fn) => fn.mockReset());

    prismaMock.$transaction.mockImplementation(
      async (fn: (client: TxMock) => unknown | Promise<unknown>) =>
        fn(txMock),
    );
  });

  it('crea pedido y lote raiz', async () => {
    txMock.pedido.create.mockResolvedValue({
      id: 1,
      numero: 10,
      cliente: 'ACME',
      contacto: 'John',
    });
    txMock.lote.create.mockResolvedValue({
      id: 7,
      codigo: '10.1',
      cantidad: 5,
      estado: 'ACTIVO',
      pedidoId: 1,
    });

    const result = await crearPedido({
      numero: 10,
      cliente: 'ACME',
      contacto: 'John',
      items: [{ productoId: 3, cantidad: 5 }],
      crearLoteRaiz: true,
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(txMock.pedido.create).toHaveBeenCalledWith({
      data: {
        numero: 10,
        cliente: 'ACME',
        contacto: 'John',
        productos: {
          create: [{ productoId: 3, cantidad: 5 }],
        },
      },
    });
    expect(txMock.lote.create).toHaveBeenCalledWith({
      data: {
        codigo: '10.1',
        pedidoId: 1,
        cantidad: 5,
        estado: 'ACTIVO',
        productoId: 3,
      },
    });
    expect(result).toEqual({
      pedido: {
        id: 1,
        numero: 10,
        cliente: 'ACME',
        contacto: 'John',
      },
      lotesRaiz: [
        {
          id: 7,
          codigo: '10.1',
          cantidad: 5,
          estado: 'ACTIVO',
          pedidoId: 1,
        },
      ],
    });
  });

  it('lanza si la suma de sublotes no coincide', async () => {
    txMock.lote.findUnique.mockResolvedValue({
      id: 8,
      pedidoId: 2,
      cantidad: 10,
    });

    await expect(
      subdividirLote(8, [
        { codigo: '10.1', cantidad: 4 },
        { codigo: '10.2', cantidad: 3 },
      ]),
    ).rejects.toThrow(/no coincide/);
    expect(txMock.lote.update).not.toHaveBeenCalled();
    expect(txMock.lote.create).not.toHaveBeenCalled();
  });

  it('subdivide lote y replica ubicacion', async () => {
    txMock.lote.findUnique.mockResolvedValue({
      id: 5,
      pedidoId: 3,
      cantidad: 6,
      procesoActualId: 1,
      tallerActualId: 2,
      transportistaActualId: 3,
    });
    txMock.lote.update.mockResolvedValue({ id: 5 });
    txMock.lote.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: Math.random(), ...data }),
    );

    const result = await subdividirLote(5, [
      { codigo: '3.1', cantidad: 3 },
      { codigo: '3.2', cantidad: 3 },
    ]);

    expect(txMock.lote.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { estado: 'DIVIDIDO' },
    });
    expect(txMock.lote.create).toHaveBeenCalledTimes(2);
    expect(result.lotePadre.id).toBe(5);
    expect(result.nuevosSubLotes[0].procesoActualId).toBe(1);
    expect(result.nuevosSubLotes[0].tallerActualId).toBe(2);
    expect(result.nuevosSubLotes[0].transportistaActualId).toBe(3);
  });

  it('mueve lote y marca terminado', async () => {
    txMock.lote.findUnique.mockResolvedValue({ id: 4, estado: 'ACTIVO' });
    txMock.procesoRealizado.create.mockResolvedValue({ id: 11 });
    txMock.lote.update.mockResolvedValue({ id: 4, estado: 'TERMINADO' });

    const result = await moverLote({
      loteId: 4,
      procesoId: 9,
      tallerId: 2,
      transportistaId: 3,
      fechaEntrada: new Date('2024-01-02T10:00:00Z'),
      marcarTerminado: true,
    });

    expect(txMock.procesoRealizado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        loteId: 4,
        procesoId: 9,
        tallerId: 2,
        transportistaId: 3,
        fechaEntrada: new Date('2024-01-02T10:00:00Z'),
        fechaSalida: null,
      }),
    });
    expect(txMock.lote.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: expect.objectContaining({
        procesoActualId: 9,
        estado: 'TERMINADO',
      }),
    });
    expect(result.loteActualizado.estado).toBe('TERMINADO');
  });

  it('arma rango de fechas completo en el reporte diario', async () => {
    prismaMock.procesoRealizado.findMany.mockResolvedValue([
      { id: 1, loteId: 2 },
    ]);
    const fecha = new Date('2024-01-15T10:30:00Z');

    const data = await reporteProcesosDia(fecha);

    expect(prismaMock.procesoRealizado.findMany).toHaveBeenCalledTimes(1);
    const args =
      prismaMock.procesoRealizado.findMany.mock.calls[0][0].where
        .fechaEntrada;
    expect(args.gte.getHours()).toBe(0);
    expect(args.gte.getMinutes()).toBe(0);
    expect(args.lte.getHours()).toBe(23);
    expect(args.lte.getMinutes()).toBe(59);
    expect(data[0].id).toBe(1);
  });
});
