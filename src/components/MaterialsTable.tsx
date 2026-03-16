import { MaterialLine } from '@/lib/calcMaterials';
import { useMemo, useState } from 'react';
import LabelWithHelp from '@/components/LabelWithHelp';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Props {
  materials: MaterialLine[];
  search: string;
  overrides: Record<string, number>;
  onOverrideChange: (materialId: string, value: number | null) => void;
  onClearAll: () => void;
  usarPrecos: boolean;
  onToggleUsarPrecos: (v: boolean) => void;
  onSearchChange: (v: string) => void;
}

type FilterMode = 'all' | 'manual' | 'nonzero';

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

export default function MaterialsTable({ materials, search, overrides, onOverrideChange, onClearAll, usarPrecos, onToggleUsarPrecos, onSearchChange }: Props) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const filtered = useMemo(() => {
    let list = materials;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.descricao.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q) || m.materialId.toLowerCase().includes(q));
    }
    if (filterMode === 'manual') {
      list = list.filter((m) => overrides[m.materialId] !== undefined);
    } else if (filterMode === 'nonzero') {
      list = list.filter((m) => m.custoTotal > 0);
    }
    return list;
  }, [materials, search, filterMode, overrides]);

  const totalCusto = useMemo(() => filtered.reduce((s, m) => s + m.custoTotal, 0), [filtered]);
  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-2 py-2 border-b border-border">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={usarPrecos} onChange={(e) => onToggleUsarPrecos(e.target.checked)} className="rounded border-input" />
          Usar preços de insumos
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={filterMode === 'nonzero'} onChange={(e) => setFilterMode(e.target.checked ? 'nonzero' : 'all')} className="rounded border-input" />
          Ocultar zerados
        </label>
        {hasAnyOverride && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={filterMode === 'manual'} onChange={(e) => setFilterMode(e.target.checked ? 'manual' : 'all')} className="rounded border-input" />
            Somente manuais
          </label>
        )}
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
          Mostrando {filtered.length} de {materials.length}
        </span>
        {hasAnyOverride && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-destructive hover:underline ml-auto">Limpar manuais</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todos os preços manuais?</AlertDialogTitle>
                <AlertDialogDescription>Todos os preços manuais de materiais serão removidos. Os valores voltarão à base SINAPI.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <input
          type="text" placeholder="Buscar material, código..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="ml-auto rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
        />
      </div>

      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto relative">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-20">
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-card z-20">Material</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Un</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Qtde</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Base SINAPI" help="Preço unitário de referência SINAPI RN (somente leitura)." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Manual" help="Substitui o preço base. Afeta o Total Dinâmico quando 'Usar preços de insumos' estiver ligado." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Efetivo" help="Preço efetivo = Manual (se preenchido) ou Base SINAPI." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Δ%" help="Variação percentual do preço efetivo em relação à base SINAPI." />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const hasManual = overrides[m.materialId] !== undefined;
              const manualVal = hasManual ? overrides[m.materialId] : null;
              const efetivo = manualVal ?? m.precoBase;
              const delta = m.precoBase > 0 ? ((efetivo / m.precoBase) - 1) * 100 : null;

              return (
                <tr key={m.materialId} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${hasManual ? 'bg-warning/5' : ''}`}>
                  <td className="py-1.5 px-2 sticky left-0 bg-card z-10">
                    {m.descricao}
                    {hasManual && <span className="ml-1 text-[9px] bg-warning/20 text-warning px-1 rounded font-semibold">Manual</span>}
                  </td>
                  <td className="py-1.5 px-2 text-muted-foreground text-xs">{m.unidade}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(m.quantidade)}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{m.precoBase > 0 ? fmt(m.precoBase) : '—'}</td>
                  <td className="py-1.5 px-1">
                    <ManualInput
                      value={manualVal}
                      onChange={(v) => onOverrideChange(m.materialId, v)}
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums font-medium">{efetivo > 0 ? fmt(efetivo) : '—'}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums font-medium">{m.custoTotal > 0 ? fmtCur(m.custoTotal) : '—'}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums text-xs">
                    {delta !== null && delta !== 0 ? (
                      <span className={delta > 0 ? 'text-destructive' : delta < -10 ? 'text-success' : 'text-success'}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
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
                <td className="py-2 px-2 text-right font-mono tabular-nums font-bold">{fmtCur(totalCusto)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
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
      className="w-full min-w-[60px] rounded border border-input bg-card px-1.5 py-1 text-xs font-mono tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
