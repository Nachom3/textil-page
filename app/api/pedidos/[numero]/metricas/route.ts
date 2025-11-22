import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { obtenerPedidoConMetricas } from '@/lib/pedidos';

export async function GET(
  req: Request,
  { params }: { params: { numero: string } },
) {
  const numero = Number(params.numero);

  if (!Number.isFinite(numero)) {
    return NextResponse.json(
      { error: 'numero debe ser num�rico' },
      { status: 400 },
    );
  }

  try {
    const data = await obtenerPedidoConMetricas(numero);
    if (!data) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 },
      );
    }

    const body = JSON.stringify(data);
    const etag = createHash('sha1').update(body).digest('hex');
    const ifNoneMatch = req.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ETag: etag,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo m�tricas del pedido' },
      { status: 500 },
    );
  }
}
