type LoteTableProps = {
  lotes: Array<{
    codigo: string;
    cantidad: number;
    proceso?: string | null;
    taller?: string | null;
  }>;
};

export function LoteTable({ lotes }: LoteTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Cantidad</th>
            <th className="px-4 py-3">Proceso</th>
            <th className="px-4 py-3">Taller</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lotes.map((lote) => (
            <tr key={lote.codigo} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-800">
                {lote.codigo}
              </td>
              <td className="px-4 py-3 text-slate-800">{lote.cantidad}</td>
              <td className="px-4 py-3 text-slate-700">
                {lote.proceso ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {lote.taller ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
