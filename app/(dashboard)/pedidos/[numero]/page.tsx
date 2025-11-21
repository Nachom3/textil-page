import { PedidoTree } from '@/components/PedidoTree';

type PageProps = {
  params: Promise<{ numero: string }>;
};

export default async function PedidoPage({ params }: PageProps) {
  const { numero: numeroStr } = await params;
  const numero = Number(numeroStr);

  const sample = [
    {
      codigo: `${numero}.1`,
      cantidad: 10,
      estado: 'ACTIVO',
      children: [
        { codigo: `${numero}.1-a`, cantidad: 4, estado: 'ACTIVO' },
        { codigo: `${numero}.1-b`, cantidad: 6, estado: 'DIVIDIDO' },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Pedido #{numero}
      </h1>
      <PedidoTree numero={numero} lotes={sample} />
    </main>
  );
}
