import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 });
  }

  // Seed mínimo de referencia
  await prisma.proceso.upsert({
    where: { nombre: 'Costura' },
    update: {},
    create: { nombre: 'Costura' },
  });

  return NextResponse.json({ ok: true });
}
