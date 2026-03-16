import { LaborResult } from '@/lib/calcLabor';
import { useState } from 'react';
import LabelWithHelp from '@/components/LabelWithHelp';
import sinapiBaseline from '@/model/sinapiBaseline_RN_202412.json';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

const moBaseline = sinapiBaseline.maoObraHH as Record<string, { label: string; unit: string; value: number }>;

interface Props {
  labor: LaborResult[];
  overrides: Record<string, number>;
  onOverrideChange: (roleKey: string, value: number | null) => void;
  onClearAll: () => void;
  usarHH: boolean;
  onToggleUsarHH: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

export default function LaborTable({ labor, overrides, onOverrideChange, onClearAll, usarHH, onToggleUsarHH, search, onSearchChange }: Props) {
  const [filterManual, setFilterManual] = useState(false);
  const [hideZero, setHideZero] = useState(true);

  let activeLab = labor;
  if (hideZero) {
    activeLab = activeLab.filter(l => l.hhTotal > 0);
  }
  if (search) {
    const q = search.toLowerCase();
    activeLab = activeLab.filter(l => l.descricao.toLowerCase().includes(q) || l.funcao.toLowerCase().includes(q));
  }
  if (filterManual) {
    activeLab = activeLab.filter(l => overrides[l.funcao] !== undefined);
  }

  const totalHH = activeLab.reduce((s, l) => s + l.hhTotal, 0);
  const totalHD = activeLab.reduce((s, l) => s + l.hhTotal / 8, 0);
  const totalCusto = activeLab.reduce((s, l) => {
    const baseEntry = moBaseline[l.funcao];
    const base = baseEntry?.value ?? l.custoHH;
    const manual = overrides[l.funcao];
    const efetivo = manual !== undefined ? manual : base;
    return s + l.hhTotal * efetivo;
  }, 0);
  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-2 py-2 border-b border-border">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={usarHH} onChange={(e) => onToggleUsarHH(e.target.checked)} className="rounded border-input" />
          Usar custos HH
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="rounded border-input" />
          Ocultar zerados
        </label>
        {hasAnyOverride && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={filterManual} onChange={(e) => setFilterManual(e.target.checked)} className="rounded border-input" />
            Somente manuais
          </label>
        )}
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
          Mostrando {activeLab.length} de {labor.length}
        </span>
        {hasAnyOverride && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-destructive hover:underline ml-auto">Limpar manuais</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todos os custos manuais?</AlertDialogTitle>
                <AlertDialogDescription>Todos os custos manuais de mão de obra serão removidos. Os valores voltarão à base SINAPI.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <input
          type="text" placeholder="Buscar função..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="ml-auto rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
        />
      </div>

      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto relative">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-20">
            <tr className="border-b border-border text-left">
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground sticky left-0 bg-card z-20">Função</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">HH</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Base SINAPI (R$/h)" help="Custo horário de referência SINAPI RN (somente leitura)." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Manual (R$/h)" help="Substitui o custo horário base. Afeta o Total Dinâmico quando 'Usar custos HH' estiver ligado." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Efetivo" help="Custo efetivo = Manual (se preenchido) ou Base SINAPI." />
              </th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Homem-dia</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo Total</th>
              <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
                <LabelWithHelp label="Δ%" help="Variação percentual do custo efetivo em relação à base SINAPI." />
              </th>
            </tr>
          </thead>
          <tbody>
            {activeLab.map((l) => {
              const baseEntry = moBaseline[l.funcao];
              const base = baseEntry?.value ?? l.custoHH;
              const hasManual = overrides[l.funcao] !== undefined;
              const manualVal = hasManual ? overrides[l.funcao] : null;
              const efetivo = manualVal ?? base;
              const delta = base > 0 ? ((efetivo / base) - 1) * 100 : null;
              const custoEfetivo = l.hhTotal * efetivo;
              const homemDiaVal = l.hhTotal / 8;

              return (
                <tr key={l.funcao} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${hasManual ? 'bg-warning/5' : ''}`}>
                  <td className="py-1.5 px-2 font-medium sticky left-0 bg-card z-10">
                    {l.descricao}
                    {hasManual && <span className="ml-1 text-[9px] bg-warning/20 text-warning px-1 rounded font-semibold">Manual</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(l.hhTotal)}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums text-muted-foreground">{fmt(base)}</td>
                  <td className="py-1.5 px-1">
                    <ManualInput value={manualVal} onChange={(v) => onOverrideChange(l.funcao, v)} />
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums font-medium">{fmt(efetivo)}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums">{fmt(homemDiaVal)}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums font-semibold">{fmtCur(custoEfetivo)}</td>
                  <td className="py-1.5 px-2 text-right font-mono tabular-nums text-xs">
                    {delta !== null && delta !== 0 ? (
                      <span className={delta > 0 ? 'text-destructive' : 'text-success'}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="py-2 px-2">Total</td>
              <td className="py-2 px-2 text-right font-mono tabular-nums">{fmt(totalHH)}</td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2 text-right font-mono tabular-nums">{fmt(totalHD)}</td>
              <td className="py-2 px-2 text-right font-mono tabular-nums">{fmtCur(totalCusto)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
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
