/// <reference types="vitest" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../app/api/pedidos/[numero]/metricas/route';

const obtenerPedidoConMetricasMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/pedidos', () => ({
  obtenerPedidoConMetricas: obtenerPedidoConMetricasMock,
}));

const buildReq = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/pedidos/1/metricas', { headers });

describe('GET /api/pedidos/[numero]/metricas', () => {
  beforeEach(() => {
    obtenerPedidoConMetricasMock.mockReset();
  });

  it('responde 400 si el numero no es valido', async () => {
    const resp = await GET(buildReq(), { params: Promise.resolve({ numero: 'abc' }) });
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toMatch(/numero debe ser num/i);
  });

  it('responde 404 si no existe el pedido', async () => {
    obtenerPedidoConMetricasMock.mockResolvedValue(null);
    const resp = await GET(buildReq(), { params: Promise.resolve({ numero: '10' }) });
    expect(resp.status).toBe(404);
  });

  it('devuelve metricas cuando existe', async () => {
    const payload = {
      pedido: { id: 1, numero: 10 },
      lotes: [],
      metricas: {
        avancePedido: 0.5,
        tiempoRestantePedido: 2,
        lastUpdated: new Date(),
      },
    };
    obtenerPedidoConMetricasMock.mockResolvedValue(payload);

    const resp = await GET(buildReq(), { params: Promise.resolve({ numero: '10' }) });
    expect(obtenerPedidoConMetricasMock).toHaveBeenCalledWith(10);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.metricas.avancePedido).toBe(0.5);
    expect(resp.headers.get('etag')).toBeTruthy();
  });

  it('responde 304 si el ETag coincide', async () => {
    const payload = {
      pedido: { id: 1, numero: 10 },
      lotes: [],
      metricas: {
        avancePedido: 0.5,
        tiempoRestantePedido: 2,
        lastUpdated: new Date(),
      },
    };
    obtenerPedidoConMetricasMock.mockResolvedValue(payload);

    // Primera llamada para obtener ETag
    const first = await GET(buildReq(), { params: Promise.resolve({ numero: '10' }) });
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();

    // Segunda llamada con If-None-Match
    const second = await GET(
      buildReq({ 'if-none-match': etag ?? '' }),
      { params: Promise.resolve({ numero: '10' }) },
    );
    expect(second.status).toBe(304);
  });
});
