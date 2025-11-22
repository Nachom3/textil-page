// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crearPedido } from '@/lib/pedidos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      numero,
      clienteId,
      clienteNombre,
      cliente, // compatibilidad con payloads antiguos
      contacto,
      items,
      crearLoteRaiz,
    } = body;

    const nombreNormalizado = clienteNombre ?? cliente;

    if (
      !numero ||
      (!clienteId && !nombreNormalizado) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'numero, clienteId/clienteNombre e items son requeridos' },
        { status: 400 },
      );
    }

    const result = await crearPedido({
      numero,
      clienteId,
      clienteNombre: nombreNormalizado,
      contacto,
      items,
      crearLoteRaiz,
    });

    return NextResponse.json(result, { status: 201 }); // { pedido, lotesRaiz }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error creando pedido',
      },
      { status: 500 },
    );
  }
}
