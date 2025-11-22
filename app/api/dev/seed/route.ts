import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 });
  }

  // Seed mínimo de referencia
  await prisma.proceso.upsert({
    where: { nombre: 'Costura' },
    update: { orden: 1 },
    create: { nombre: 'Costura', orden: 1 },
  });

  return NextResponse.json({ ok: true });
}
