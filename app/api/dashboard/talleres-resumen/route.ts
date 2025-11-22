import { NextRequest, NextResponse } from 'next/server';
import { dashboardTalleresQuerySchema } from '@/lib/validators';
import { getDashboardTalleresResumen } from '@/lib/dashboard/talleres';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = {
    q: searchParams.get('q') ?? undefined,
    tipo: searchParams.get('tipo') ?? undefined,
  };

  const parsed = dashboardTalleresQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message, code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const data = await getDashboardTalleresResumen(parsed.data);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo resumen de talleres', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
