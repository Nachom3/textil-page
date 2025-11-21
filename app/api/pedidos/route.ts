// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crearPedido } from '@/lib/pedidos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { numero, cliente, contacto, items, crearLoteRaiz } = body;

    if (!numero || !cliente || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'numero, cliente e items son requeridos' },
        { status: 400 },
      );
    }

    const result = await crearPedido({
      numero,
      cliente,
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
