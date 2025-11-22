import { NextRequest, NextResponse } from 'next/server';
import { dashboardPedidosQuerySchema } from '@/lib/validators';
import { getDashboardPedidosResumen } from '@/lib/dashboard/pedidos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = {
    cliente: searchParams.get('cliente') ?? undefined,
    desde: searchParams.get('desde') ?? undefined,
    hasta: searchParams.get('hasta') ?? undefined,
    status: (searchParams.get('status') as any) ?? undefined,
  };

  const parsed = dashboardPedidosQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message, code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const data = await getDashboardPedidosResumen(parsed.data);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo resumen de pedidos', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
