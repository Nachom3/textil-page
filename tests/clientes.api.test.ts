/// <reference types="vitest" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as GET_LIST, POST as POST_LIST } from '../app/api/clientes/route';
import {
  GET as GET_DETAIL,
  PATCH as PATCH_DETAIL,
  DELETE as DELETE_DETAIL,
} from '../app/api/clientes/[id]/route';

const listarClientesMock = vi.hoisted(() => vi.fn());
const crearClienteMock = vi.hoisted(() => vi.fn());
const obtenerClienteMock = vi.hoisted(() => vi.fn());
const actualizarClienteMock = vi.hoisted(() => vi.fn());
const eliminarClienteMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/clientes', () => ({
  listarClientes: listarClientesMock,
  crearCliente: crearClienteMock,
  obtenerCliente: obtenerClienteMock,
  actualizarCliente: actualizarClienteMock,
  eliminarCliente: eliminarClienteMock,
}));

const buildReq = (body?: unknown) =>
  new Request('http://localhost/api/clientes', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  });

describe('/api/clientes', () => {
  beforeEach(() => {
    [
      listarClientesMock,
      crearClienteMock,
      obtenerClienteMock,
      actualizarClienteMock,
      eliminarClienteMock,
    ].forEach((m) => m.mockReset());
  });

  it('lista clientes', async () => {
    listarClientesMock.mockResolvedValue([{ id: 1, nombre: 'ACME' }]);
    const resp = await GET_LIST({} as any);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toHaveLength(1);
  });

  it('crea cliente', async () => {
    crearClienteMock.mockResolvedValue({ id: 2, nombre: 'Foo' });
    const resp = await POST_LIST(buildReq({ nombre: 'Foo' }) as any);
    expect(resp.status).toBe(201);
    expect(await resp.json()).toEqual({ id: 2, nombre: 'Foo' });
  });
});

describe('/api/clientes/[id]', () => {
  beforeEach(() => {
    [
      listarClientesMock,
      crearClienteMock,
      obtenerClienteMock,
      actualizarClienteMock,
      eliminarClienteMock,
    ].forEach((m) => m.mockReset());
  });

  it('valida id no numérico', async () => {
    const resp = await GET_DETAIL({} as any, { params: { id: 'abc' } });
    expect(resp.status).toBe(400);
  });

  it('devuelve 404 cuando no existe', async () => {
    obtenerClienteMock.mockResolvedValue(null);
    const resp = await GET_DETAIL({} as any, { params: { id: '10' } });
    expect(resp.status).toBe(404);
  });

  it('obtiene cliente', async () => {
    obtenerClienteMock.mockResolvedValue({ id: 1, nombre: 'ACME' });
    const resp = await GET_DETAIL({} as any, { params: { id: '1' } });
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ id: 1, nombre: 'ACME' });
  });

  it('actualiza cliente', async () => {
    actualizarClienteMock.mockResolvedValue({ id: 1, nombre: 'NEW' });
    const resp = await PATCH_DETAIL(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ nombre: 'NEW' }),
      }) as any,
      { params: { id: '1' } },
    );
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ id: 1, nombre: 'NEW' });
  });

  it('elimina cliente', async () => {
    eliminarClienteMock.mockResolvedValue({ ok: true });
    const resp = await DELETE_DETAIL({} as any, { params: { id: '1' } });
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: true });
  });
});
