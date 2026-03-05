import { MaterialLine } from '@/lib/calcMaterials';
import { useMemo } from 'react';

interface Props {
  materials: MaterialLine[];
  search: string;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCur(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MaterialsTable({ materials, search }: Props) {
  const filtered = useMemo(() => {
    if (!search) return materials;
    const q = search.toLowerCase();
    return materials.filter((m) => m.descricao.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q));
  }, [materials, search]);

  const totalCusto = useMemo(() => filtered.reduce((s, m) => s + m.custoTotal, 0), [filtered]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Material</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Categoria</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Quantidade</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Unidade</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">R$/un</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => (
            <tr key={`${m.materialId}-${m.unidade}-${i}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-1.5 px-2">{m.descricao}</td>
              <td className="py-1.5 px-2">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{m.categoria}</span>
              </td>
              <td className="py-1.5 px-2 text-right font-mono">{fmt(m.quantidade)}</td>
              <td className="py-1.5 px-2 text-muted-foreground">{m.unidade}</td>
              <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{m.precoUnitario > 0 ? fmt(m.precoUnitario) : '—'}</td>
              <td className="py-1.5 px-2 text-right font-mono font-medium">{m.custoTotal > 0 ? fmtCur(m.custoTotal) : '—'}</td>
            </tr>
          ))}
        </tbody>
        {totalCusto > 0 && (
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={5} className="py-2 px-2 text-sm font-semibold text-right">Total Materiais</td>
              <td className="py-2 px-2 text-right font-mono font-bold">{fmtCur(totalCusto)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhum material encontrado.</p>
      )}
    </div>
  );
}
