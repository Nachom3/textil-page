import { NextRequest, NextResponse } from 'next/server';
import { buscarClientesPorNombre } from '@/lib/clientes';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? '';

  if (!query.trim()) {
    return NextResponse.json([], { status: 200 });
  }

  const clientes = await buscarClientesPorNombre(query, 10);
  return NextResponse.json(clientes, { status: 200 });
}
