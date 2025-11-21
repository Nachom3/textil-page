type LoteNode = {
  codigo: string;
  cantidad: number;
  estado: string;
  children?: LoteNode[];
};

type PedidoTreeProps = {
  numero: number;
  lotes: LoteNode[];
};

export function PedidoTree({ numero, lotes }: PedidoTreeProps) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Pedido #{numero}
      </h2>
      <div className="text-sm text-slate-600">Árbol de lotes</div>
      <div className="space-y-2">
        {lotes.map((lote) => (
          <LoteRow key={lote.codigo} lote={lote} depth={0} />
        ))}
      </div>
    </div>
  );
}

function LoteRow({ lote, depth }: { lote: LoteNode; depth: number }) {
  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-3 text-sm text-slate-800"
        style={{ paddingLeft: depth * 16 }}
      >
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
          {lote.codigo}
        </span>
        <span>{lote.cantidad} u</span>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {lote.estado}
        </span>
      </div>
      {lote.children && (
        <div className="space-y-1">
          {lote.children.map((child) => (
            <LoteRow key={child.codigo} lote={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
