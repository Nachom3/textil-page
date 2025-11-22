import * as client from '@/app/generated/prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (client as any).PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1) Clean slate respecting FK order
  await prisma.procesoRealizado.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.pedidoProducto.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.plantillaPaso.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.taller.deleteMany();
  await prisma.transportista.deleteMany();
  await prisma.proceso.deleteMany();

  // 2) Talleres
  await prisma.taller.createMany({
    data: [
      { nombre: 'Corte Central', tipo: 'CORTE' },
      { nombre: 'Costura Mónica', tipo: 'COSTURA' },
      { nombre: 'Bordados Express', tipo: 'BORDADO' },
      { nombre: 'Terminación Final', tipo: 'TERMINACION' },
    ],
  });
  const talleresMap = await prisma.taller.findMany();

  // 3) Transportistas
  await prisma.transportista.createMany({
    data: [
      { nombre: 'Flete Juan' },
      { nombre: 'MotoMensajería' },
    ],
  });
  const transportistas = await prisma.transportista.findMany();

  // 4) Clientes
  await prisma.cliente.createMany({
    data: [
      { nombre: 'Zara Local' },
      { nombre: 'Marca Independiente' },
      { nombre: 'La Salada Top' },
      { nombre: 'Urban Outfit' },
      { nombre: 'Textil Norte' },
    ],
  });
  const clientes = await prisma.cliente.findMany();

  // 5) Asegurar procesos base
  const procesoNames = ['Corte', 'Costura', 'Bordado', 'Terminación', 'Transporte'];
  for (const [idx, nombre] of procesoNames.entries()) {
    await prisma.proceso.upsert({
      where: { nombre },
      update: { orden: idx + 1 },
      create: { nombre, orden: idx + 1, duracionEstandarDias: 1 },
    });
  }

  // 6) Productos con plantilla
  const corteCentralId = talleresMap.find((t: any) => t.nombre === 'Corte Central')?.id;
  const costuraMonicaId = talleresMap.find((t: any) => t.nombre === 'Costura Mónica')?.id;
  const bordadosExpressId = talleresMap.find((t: any) => t.nombre === 'Bordados Express')?.id;
  const terminacionId = talleresMap.find((t: any) => t.nombre === 'Terminación Final')?.id;
  const fleteJuanId = transportistas.find((t: any) => t.nombre === 'Flete Juan')?.id;

  const remera = await prisma.producto.create({
    data: {
      nombre: 'Remera Básica',
      codigo: 'REM-001',
      plantillaPasos: {
        create: [
          {
            nombre: 'Corte',
            orden: 1,
            duracionEstimadaDias: 1,
            tallerPorDefectoId: corteCentralId ?? null,
          },
          {
            nombre: 'Transporte',
            orden: 2,
            duracionEstimadaDias: 0.1,
            esTransporte: true,
            tallerPorDefectoId: null,
          },
          {
            nombre: 'Costura',
            orden: 3,
            duracionEstimadaDias: 2,
            tallerPorDefectoId: costuraMonicaId ?? null,
          },
          {
            nombre: 'Terminación',
            orden: 4,
            duracionEstimadaDias: 0.5,
            tallerPorDefectoId: terminacionId ?? null,
          },
        ],
      },
    },
  });

  const buzo = await prisma.producto.create({
    data: {
      nombre: 'Buzo Bordado',
      codigo: 'BUZ-001',
      plantillaPasos: {
        create: [
          { nombre: 'Corte', orden: 1, duracionEstimadaDias: 1, tallerPorDefectoId: corteCentralId ?? null },
          { nombre: 'Costura', orden: 2, duracionEstimadaDias: 2, tallerPorDefectoId: costuraMonicaId ?? null },
          { nombre: 'Transporte', orden: 3, duracionEstimadaDias: 0.1, esTransporte: true },
          { nombre: 'Bordado', orden: 4, duracionEstimadaDias: 1, tallerPorDefectoId: bordadosExpressId ?? null },
          { nombre: 'Terminación', orden: 5, duracionEstimadaDias: 0.5, tallerPorDefectoId: terminacionId ?? null },
        ],
      },
    },
  });

  console.log(`Created talleres: ${talleresMap.length}`);
  console.log(`Created transportistas: ${transportistas.length}`);
  console.log(`Created clientes: ${clientes.length}`);
  console.log(`Created productos: 2 (${remera.nombre}, ${buzo.nombre})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
