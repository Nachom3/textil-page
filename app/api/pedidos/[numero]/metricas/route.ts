import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { formatRFC7231 } from 'date-fns';
import { obtenerPedidoConMetricas } from '@/lib/pedidos';

export async function GET(
  req: Request,
  { params }: { params: { numero: string } },
) {
  const numero = Number(params.numero);

  if (!Number.isFinite(numero)) {
    return NextResponse.json(
      { error: 'numero debe ser numérico', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const data = await obtenerPedidoConMetricas(numero);
    if (!data) {
      return NextResponse.json(
        { error: 'Pedido no encontrado', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    const body = JSON.stringify(data);
    const etag = createHash('sha1').update(body).digest('hex');
    const ifNoneMatch = req.headers.get('if-none-match');
    const lastModified = formatRFC7231(data.metricas.lastUpdated);

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Last-Modified': lastModified },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ETag: etag,
        'Last-Modified': lastModified,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo métricas del pedido', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
