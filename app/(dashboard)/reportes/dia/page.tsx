import { LoteTable } from '@/components/LoteTable';

export default function ReporteDiaPage() {
  const data = [
    { codigo: '40.1', cantidad: 5, proceso: 'Corte', taller: 'T1' },
    { codigo: '40.2', cantidad: 3, proceso: 'Bordado', taller: 'T2' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Reporte diario
        </h1>
        <p className="text-sm text-slate-600">
          Consulta los procesos realizados en una fecha.
        </p>
      </header>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-800">
          Fecha
          <input
            type="date"
            className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            defaultValue="2024-01-15"
          />
        </label>
      </div>
      <LoteTable lotes={data} />
    </main>
  );
}
