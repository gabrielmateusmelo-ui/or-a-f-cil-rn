import { MaterialLine } from '@/lib/calcMaterials';
import { useMemo, useState } from 'react';
import LabelWithHelp from '@/components/LabelWithHelp';

interface Props {
  materials: MaterialLine[];
  search: string;
  overrides: Record<string, number>;
  onOverrideChange: (sinapiKey: string, value: number | null) => void;
  onClearAll: () => void;
  usarPrecos: boolean;
  onToggleUsarPrecos: (v: boolean) => void;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCur(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseNum(s: string): number | null {
  const v = parseFloat(s.replace(',', '.'));
  return isNaN(v) ? null : v;
}

export default function MaterialsTable({ materials, search, overrides, onOverrideChange, onClearAll, usarPrecos, onToggleUsarPrecos }: Props) {
  const filtered = useMemo(() => {
    if (!search) return materials;
    const q = search.toLowerCase();
    return materials.filter((m) => m.descricao.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q));
  }, [materials, search]);

  const totalCusto = useMemo(() => filtered.reduce((s, m) => s + m.custoTotal, 0), [filtered]);
  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 px-2 py-2 border-b border-border">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={usarPrecos} onChange={(e) => onToggleUsarPrecos(e.target.checked)} className="rounded border-input" />
          Usar preços de insumos no orçamento
        </label>
        {hasAnyOverride && (
          <button onClick={onClearAll} className="text-xs text-destructive hover:underline ml-auto">
            Limpar manuais
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Material</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Un</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Qtde</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
              <LabelWithHelp label="Base SINAPI" help="Preço unitário de referência SINAPI RN (somente leitura)." />
            </th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
              <LabelWithHelp label="Manual" help="Substitui o preço base. Afeta o Total Dinâmico quando 'Usar preços de insumos' estiver ligado." />
            </th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Efetivo</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Δ%</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => {
            const hasManual = m.sinapiKey && overrides[m.sinapiKey] !== undefined;
            const manualVal = hasManual ? overrides[m.sinapiKey] : null;
            const efetivo = manualVal ?? m.precoBase;
            const delta = m.precoBase > 0 ? ((efetivo / m.precoBase) - 1) * 100 : null;

            return (
              <tr key={`${m.materialId}-${m.unidade}-${i}`} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${hasManual ? 'bg-accent/20' : ''}`}>
                <td className="py-1.5 px-2">
                  {m.descricao}
                  {hasManual && <span className="ml-1 text-[9px] bg-primary/20 text-primary px-1 rounded">Manual</span>}
                </td>
                <td className="py-1.5 px-2 text-muted-foreground text-xs">{m.unidade}</td>
                <td className="py-1.5 px-2 text-right font-mono">{fmt(m.quantidade)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{m.precoBase > 0 ? fmt(m.precoBase) : '—'}</td>
                <td className="py-1.5 px-1">
                  {m.sinapiKey ? (
                    <ManualInput
                      value={manualVal}
                      onChange={(v) => onOverrideChange(m.sinapiKey, v)}
                    />
                  ) : <span className="text-muted-foreground text-xs text-center block">—</span>}
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-medium">{efetivo > 0 ? fmt(efetivo) : '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono font-medium">{m.custoTotal > 0 ? fmtCur(m.custoTotal) : '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono text-xs">
                  {delta !== null && delta !== 0 ? (
                    <span className={delta > 0 ? 'text-destructive' : 'text-green-600'}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        {totalCusto > 0 && (
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={6} className="py-2 px-2 text-sm font-semibold text-right">Total Materiais</td>
              <td className="py-2 px-2 text-right font-mono font-bold">{fmtCur(totalCusto)}</td>
              <td></td>
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

function ManualInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [local, setLocal] = useState(value !== null ? String(value) : '');

  const handleBlur = () => {
    const parsed = parseNum(local);
    if (parsed !== null && parsed > 0) {
      onChange(parsed);
      setLocal(String(parsed));
    } else if (local.trim() === '') {
      onChange(null);
    }
  };

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      placeholder="—"
      className="w-full min-w-[60px] rounded border border-input bg-card px-1.5 py-1 text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
