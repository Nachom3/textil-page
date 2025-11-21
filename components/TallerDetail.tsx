type TallerDetailProps = {
  nombre: string;
  tipo?: string;
  lotes: Array<{
    codigo: string;
    cantidad: number;
    proceso?: string | null;
  }>;
};

export function TallerDetail({ nombre, tipo, lotes }: TallerDetailProps) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Taller
        </p>
        <h2 className="text-xl font-semibold text-slate-900">{nombre}</h2>
        {tipo && <p className="text-sm text-slate-600">{tipo}</p>}
      </div>
      <div className="space-y-2">
        {lotes.length === 0 ? (
          <p className="text-sm text-slate-500">Sin lotes asignados.</p>
        ) : (
          <ul className="space-y-1">
            {lotes.map((lote) => (
              <li
                key={lote.codigo}
                className="flex items-center justify-between rounded border border-slate-100 px-3 py-2"
              >
                <span className="font-mono text-sm text-slate-800">
                  {lote.codigo}
                </span>
                <div className="text-sm text-slate-600">
                  <span className="mr-3">{lote.cantidad} u</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {lote.proceso ?? 'En curso'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
