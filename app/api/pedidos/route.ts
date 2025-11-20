// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crearPedido } from '@/app/services/pedidos';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { numero, cliente, contacto, items, crearLoteRaiz } = body;

    const result = await crearPedido({
      numero,
      cliente,
      contacto,
      items,
      crearLoteRaiz,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? 'Error creando pedido' },
      { status: 500 },
    );
  }
}
