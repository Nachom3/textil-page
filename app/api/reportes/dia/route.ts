import { NextRequest, NextResponse } from 'next/server';
import { obtenerResumenDiario } from '@/lib/reportes';

export async function GET(req: NextRequest) {
  try {
    const fechaParam = req.nextUrl.searchParams.get('fecha');
    const fecha = fechaParam ? new Date(fechaParam) : new Date();
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json({ error: 'fecha invalida' }, { status: 400 });
    }

    const resumen = await obtenerResumenDiario(fecha);
    return NextResponse.json(resumen);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error obteniendo resumen diario' },
      { status: 500 },
    );
  }
}
