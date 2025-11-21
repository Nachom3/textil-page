import { TallerDetail } from '@/components/TallerDetail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TallerPage({ params }: PageProps) {
  const { id } = await params;
  const idNum = Number(id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Taller #{idNum}
      </h1>
      <TallerDetail
        nombre={`Taller ${idNum}`}
        tipo="Costura"
        lotes={[
          { codigo: '40.1', cantidad: 5, proceso: 'Corte' },
          { codigo: '41.3', cantidad: 8, proceso: 'Bordado' },
        ]}
      />
    </main>
  );
}
