import { ServiceItem } from '@/lib/calcBudget';
import { useMemo } from 'react';

interface Props {
  items: ServiceItem[];
  hideZero: boolean;
  search: string;
  mode: 'com' | 'sem';
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const abcColors: Record<string, string> = {
  A: 'bg-abc-a text-destructive-foreground',
  B: 'bg-abc-b text-warning-foreground',
  C: 'bg-abc-c text-success-foreground',
};

export default function ServicesTable({ items, hideZero, search, mode }: Props) {
  const filtered = useMemo(() => {
    let list = items;
    if (hideZero) {
      list = list.filter((i) => (mode === 'com' ? i.totalComMaterial : i.totalSemMaterial) > 0);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.descricao.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q) || i.grupo.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) =>
      mode === 'com' ? b.totalComMaterial - a.totalComMaterial : b.totalSemMaterial - a.totalSemMaterial
    );
  }, [items, hideZero, search, mode]);

  const total = filtered.reduce((s, i) => s + (mode === 'com' ? i.totalComMaterial : i.totalSemMaterial), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">ABC</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Cód.</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Descrição</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Qtd</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Un</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">R$/un</th>
            {mode === 'com' && <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Material</th>}
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">M.O.</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Total</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">%</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Acum.%</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => {
            const abc = mode === 'com' ? item.abcClass : item.abcClassSemMat;
            const pct = mode === 'com' ? item.abcPct : item.abcPctSemMat;
            const cumPct = mode === 'com' ? item.abcCumPct : item.abcCumPctSemMat;
            const itemTotal = mode === 'com' ? item.totalComMaterial : item.totalSemMaterial;
            const rpu = item.qtd > 0 ? itemTotal / item.qtd : 0;
            return (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-1.5 px-2">
                  {abc && (
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${abcColors[abc]}`}>
                      {abc}
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-2 font-mono text-xs text-muted-foreground">{item.codigo}</td>
                <td className="py-1.5 px-2">
                  <div>{item.descricao}</div>
                  <div className="text-[10px] text-muted-foreground">{item.grupo}</div>
                  {item.error && <div className="text-[10px] text-destructive">⚠ {item.error}</div>}
                </td>
                <td className="py-1.5 px-2 text-right font-mono">{fmt(item.qtd)}</td>
                <td className="py-1.5 px-2 text-muted-foreground">{item.unidade}</td>
                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{item.qtd > 0 ? fmt(rpu) : '—'}</td>
                {mode === 'com' && <td className="py-1.5 px-2 text-right font-mono">{fmt(item.custoMaterial)}</td>}
                <td className="py-1.5 px-2 text-right font-mono">{fmt(item.custoMO)}</td>
                <td className="py-1.5 px-2 text-right font-mono font-semibold">{fmt(itemTotal)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{pct ? pct.toFixed(1) + '%' : '-'}</td>
                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{cumPct ? cumPct.toFixed(1) + '%' : '-'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-semibold">
            <td colSpan={mode === 'com' ? 8 : 7} className="py-2 px-2 text-right">Subtotal</td>
            <td className="py-2 px-2 text-right font-mono">{fmt(total)}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
