// app/api/reportes/procesos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { reporteProcesosDia } from '@/lib/pedidos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fechaStr = searchParams.get('fecha');

  if (!fechaStr) {
    return NextResponse.json(
      { error: 'Debe enviar ?fecha=YYYY-MM-DD' },
      { status: 400 },
    );
  }

  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) {
    return NextResponse.json({ error: 'Fecha invalida' }, { status: 400 });
  }

  const data = await reporteProcesosDia(fecha);
  return NextResponse.json(data);
}
