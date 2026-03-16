import { ServiceItem, GroupSummary } from '@/lib/calcBudget';
import { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

interface Props {
  items: ServiceItem[];
  byGroup: GroupSummary[];
  hideZero: boolean;
  search: string;
  mode: 'com' | 'sem';
  bdiRate?: number;
  onHideZeroChange: (v: boolean) => void;
  onSearchChange: (v: string) => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const abcColors: Record<string, string> = {
  A: 'bg-abc-a text-destructive-foreground',
  B: 'bg-abc-b text-warning-foreground',
  C: 'bg-abc-c text-success-foreground',
};

function ItemRow({ item, mode }: { item: ServiceItem; mode: 'com' | 'sem' }) {
  const abc = mode === 'com' ? item.abcClass : item.abcClassSemMat;
  const pct = mode === 'com' ? item.abcPct : item.abcPctSemMat;
  const cumPct = mode === 'com' ? item.abcCumPct : item.abcCumPctSemMat;
  const itemTotal = mode === 'com' ? item.totalComMaterial : item.totalSemMaterial;
  const rpu = item.qtd > 0 ? itemTotal / item.qtd : 0;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/50 transition-colors">
      <td className="py-1.5 px-2">
        {abc && (
          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${abcColors[abc]}`}>
            {abc}
          </span>
        )}
      </td>
      <td className="py-1.5 px-2 font-mono text-xs text-muted-foreground tabular-nums">{item.codigo}</td>
      <td className="py-1.5 px-2 sticky left-0 bg-card z-10">
        <div>{item.descricao}</div>
        {item.error && <div className="text-[10px] text-destructive">⚠ {item.error}</div>}
      </td>
      <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(item.qtd)}</td>
      <td className="py-1.5 px-2 text-muted-foreground">{item.unidade}</td>
      <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{item.qtd > 0 ? fmt(rpu) : '—'}</td>
      {mode === 'com' && <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(item.custoMaterial)}</td>}
      <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(item.custoMO)}</td>
      <td className="py-1.5 px-2 text-right font-mono tabular-nums font-semibold">{fmt(itemTotal)}</td>
      <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{pct ? pct.toFixed(1) + '%' : '-'}</td>
      <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{cumPct ? cumPct.toFixed(1) + '%' : '-'}</td>
    </tr>
  );
}

function TableHead({ mode }: { mode: 'com' | 'sem' }) {
  return (
    <thead className="sticky top-0 bg-card z-20">
      <tr className="border-b border-border text-left">
        <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">ABC</th>
        <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Cód.</th>
        <th className="py-2 px-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-card z-20">Descrição</th>
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
  );
}

export default function ServicesTable({ items, byGroup, hideZero, search, mode, bdiRate = 0, onHideZeroChange, onSearchChange }: Props) {
  const hideBdi = bdiRate === 0;
  const [viewMode, setViewMode] = useState<'flat' | 'group'>('group');

  const filtered = useMemo(() => {
    let list = items;
    if (hideZero) {
      list = list.filter((i) => (mode === 'com' ? i.totalComMaterial : i.totalSemMaterial) > 0);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.descricao.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q) || i.grupo.toLowerCase().includes(q));
    }
    return list;
  }, [items, hideZero, search, mode]);

  const sortedFlat = useMemo(() =>
    [...filtered].sort((a, b) =>
      mode === 'com' ? b.totalComMaterial - a.totalComMaterial : b.totalSemMaterial - a.totalSemMaterial
    ), [filtered, mode]);

  const groupedItems = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const item of filtered) {
      const list = map.get(item.grupo) || [];
      list.push(item);
      map.set(item.grupo, list);
    }
    return map;
  }, [filtered]);

  const total = filtered.reduce((s, i) => s + (mode === 'com' ? i.totalComMaterial : i.totalSemMaterial), 0);

  const activeGroups = byGroup.filter((g) => {
    const val = mode === 'com' ? g.subtotalComMat : g.subtotalSemMat;
    return val > 0;
  });

  const grandTotal = mode === 'com'
    ? byGroup.reduce((s, x) => s + x.totalComMat, 0)
    : byGroup.reduce((s, x) => s + x.totalSemMat, 0);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-2 py-2 border-b border-border">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hideZero} onChange={(e) => onHideZeroChange(e.target.checked)} className="rounded border-input" />
          Ocultar zerados
        </label>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
          Mostrando {filtered.length} de {items.length}
        </span>
        <input
          type="text" placeholder="Buscar código, descrição, grupo..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="ml-auto rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
        />
      </div>

      {/* Group Summary */}
      {activeGroups.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 px-2 py-2">
            <h3 className="text-sm font-bold text-foreground">Resumo por Etapas</h3>
            {hideBdi && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">BDI: 0%</span>}
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-20">
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Grupo</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground w-24">% do total</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Subtotal</th>
                {!hideBdi && <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">BDI</th>}
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Total</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {activeGroups.map((g) => {
                const sub = mode === 'com' ? g.subtotalComMat : g.subtotalSemMat;
                const bdi = mode === 'com' ? g.bdiComMat : g.bdiSemMat;
                const tot = mode === 'com' ? g.totalComMat : g.totalSemMat;
                const share = grandTotal > 0 ? (tot / grandTotal) * 100 : 0;
                return (
                  <tr key={g.group} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-1.5 px-2 font-medium">{g.group}</td>
                    <td className="py-1.5 px-2">
                      <Progress value={share} className="h-2" />
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(sub)}</td>
                    {!hideBdi && <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{fmt(bdi)}</td>}
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums font-semibold">{fmt(tot)}</td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{share.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2 px-2">Total Geral</td>
                <td></td>
                <td className="py-2 px-2 text-right font-mono tabular-nums">
                  {fmt(activeGroups.reduce((s, g) => s + (mode === 'com' ? g.subtotalComMat : g.subtotalSemMat), 0))}
                </td>
                {!hideBdi && (
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-muted-foreground">
                    {fmt(activeGroups.reduce((s, g) => s + (mode === 'com' ? g.bdiComMat : g.bdiSemMat), 0))}
                  </td>
                )}
                <td className="py-2 px-2 text-right font-mono tabular-nums">
                  {fmt(activeGroups.reduce((s, g) => s + (mode === 'com' ? g.totalComMat : g.totalSemMat), 0))}
                </td>
                <td className="py-2 px-2 text-right font-mono tabular-nums">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={() => setViewMode(viewMode === 'flat' ? 'group' : 'flat')}
          className="text-xs font-medium text-primary hover:underline"
        >
          {viewMode === 'flat' ? '📂 Ver por grupo' : '📋 Ver lista completa'}
        </button>
      </div>

      {/* Detail */}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto relative">
        {viewMode === 'flat' ? (
          <table className="w-full text-sm">
            <TableHead mode={mode} />
            <tbody>
              {sortedFlat.map((item) => (
                <ItemRow key={item.id} item={item} mode={mode} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td colSpan={mode === 'com' ? 8 : 7} className="py-2 px-2 text-right">Subtotal</td>
                <td className="py-2 px-2 text-right font-mono tabular-nums">{fmt(total)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <Accordion type="multiple" defaultValue={activeGroups.map((g) => g.group)} className="w-full">
            {activeGroups.map((g) => {
              const groupItems = groupedItems.get(g.group) || [];
              if (groupItems.length === 0) return null;
              const groupTotal = groupItems.reduce((s, i) => s + (mode === 'com' ? i.totalComMaterial : i.totalSemMaterial), 0);
              const share = grandTotal > 0 ? (groupTotal / grandTotal) * 100 : 0;
              return (
                <AccordionItem key={g.group} value={g.group}>
                  <AccordionTrigger className="text-sm font-semibold px-2 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2 gap-3">
                      <span className="truncate">{g.group}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Progress value={share} className="h-1.5 w-16" />
                        <span className="font-mono text-muted-foreground text-xs tabular-nums">{share.toFixed(1)}%</span>
                        <span className="font-mono text-muted-foreground text-xs tabular-nums">R$ {fmt(groupTotal)}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <TableHead mode={mode} />
                      <tbody>
                        {groupItems.map((item) => (
                          <ItemRow key={item.id} item={item} mode={mode} />
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
