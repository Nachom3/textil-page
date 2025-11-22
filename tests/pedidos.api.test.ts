/// <reference types="vitest" />

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/pedidos/route';

const crearPedidoMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/pedidos', () => ({
  crearPedido: crearPedidoMock,
}));

const buildRequest = (body: unknown) =>
  ({
    json: async () => body,
  }) as unknown as Request;

describe('POST /api/pedidos', () => {
  beforeEach(() => {
    crearPedidoMock.mockReset();
  });

  it('valida payloads incompletos', async () => {
    const resp = await POST(buildRequest({}) as any);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toMatch(/requeridos/);
  });

  it('repondes 400 si items no es array', async () => {
    const resp = await POST(
      buildRequest({ numero: 1, clienteNombre: 'ACME', items: 'bad' }) as any,
    );
    expect(resp.status).toBe(400);
  });

  it('crea pedido con payload valido', async () => {
    crearPedidoMock.mockResolvedValue({ ok: true });
    const body = {
      numero: 10,
      clienteNombre: 'ACME',
      contacto: 'john',
      items: [{ productoId: 1, cantidad: 2 }],
      crearLoteRaiz: true,
    };

    const resp = await POST(buildRequest(body) as any);
    expect(crearPedidoMock).toHaveBeenCalledWith(body);
    expect(resp.status).toBe(201);
    const json = await resp.json();
    expect(json).toEqual({ ok: true });
  });
});
