/* eslint-disable no-console */
import { crearProducto } from '@/lib/productos';
import { crearPedido, subdividirLote } from '@/lib/pedidos';
import { avanzarProceso, getEstadoLote } from '@/lib/produccion';
import { prisma } from '@/lib/prisma';

async function main() {
  const producto = await crearProducto({
    nombre: 'Producto Smoke',
    codigo: `SMK-${Date.now()}`,
    plantilla: [
      { nombre: 'Corte', orden: 1, duracionEstimadaDias: 1 },
      { nombre: 'Costura', orden: 2, duracionEstimadaDias: 1 },
    ],
  });
  console.log('Producto creado', producto.id);

  const pedidoRes = await crearPedido({
    numero: Math.floor(Math.random() * 100000),
    clienteNombre: 'Cliente Smoke',
    contacto: 'smoke@test',
    items: [{ productoId: producto.id, cantidad: 10 }],
  });
  const lote =
    Array.isArray((pedidoRes as any).lotesRaiz) && (pedidoRes as any).lotesRaiz.length
      ? (pedidoRes as any).lotesRaiz[0]
      : null;
  if (!lote) throw new Error('No se creó lote raíz');
  console.log('Pedido y lote creados', (pedidoRes as any).pedido.id, lote.id);

  await avanzarProceso(lote.id, 'Corte', { estado: 'EN_PROCESO' });
  await avanzarProceso(lote.id, 'Corte', { estado: 'COMPLETADO' });
  await avanzarProceso(lote.id, 'Costura', { estado: 'EN_PROCESO' });

  await subdividirLote(lote.id, [
    { codigo: `${(pedidoRes as any).pedido.numero}.1a`, cantidad: 5 },
    { codigo: `${(pedidoRes as any).pedido.numero}.1b`, cantidad: 5 },
  ]);
  console.log('Lote subdividido');

  const estados = await prisma.lote.findMany({
    where: { parentId: lote.id },
    select: { id: true, codigo: true },
  });
  for (const sub of estados) {
    const estado = await getEstadoLote(sub.id);
    console.log('Sub-lote', sub.codigo, estado);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
