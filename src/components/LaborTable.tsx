import { LaborResult } from '@/lib/calcLabor';
import { useState } from 'react';
import LabelWithHelp from '@/components/LabelWithHelp';
import sinapiBaseline from '@/model/sinapiBaseline_RN_202412.json';

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
}

export default function LaborTable({ labor, overrides, onOverrideChange, onClearAll, usarHH, onToggleUsarHH }: Props) {
  const [filterManual, setFilterManual] = useState(false);
  let activeLab = labor.filter(l => l.hhTotal > 0);
  if (filterManual) {
    activeLab = activeLab.filter(l => overrides[l.funcao] !== undefined);
  }
  const totalHH = activeLab.reduce((s, l) => s + l.hhTotal, 0);
  const totalCusto = activeLab.reduce((s, l) => s + l.custoTotal, 0);
  const totalHD = activeLab.reduce((s, l) => s + l.homemDia, 0);
  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 px-2 py-2 border-b border-border">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={usarHH} onChange={(e) => onToggleUsarHH(e.target.checked)} className="rounded border-input" />
          Usar custos HH no orçamento (mão de obra)
        </label>
        {hasAnyOverride && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={filterManual} onChange={(e) => setFilterManual(e.target.checked)} className="rounded border-input" />
              Somente manuais
            </label>
            <button onClick={onClearAll} className="text-xs text-destructive hover:underline ml-auto">
              Limpar manuais
            </button>
          </>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Função</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">HH</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
              <LabelWithHelp label="Base SINAPI (R$/h)" help="Custo horário de referência SINAPI RN (somente leitura)." />
            </th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">
              <LabelWithHelp label="Manual (R$/h)" help="Substitui o custo horário base. Afeta o Total Dinâmico quando 'Usar custos HH' estiver ligado." />
            </th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Efetivo</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Homem-dia</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo Total</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Δ%</th>
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

            return (
              <tr key={l.funcao} className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${hasManual ? 'bg-accent/20' : ''}`}>
                <td className="py-1.5 px-2 font-medium">
                  {l.descricao}
                  {hasManual && <span className="ml-1 text-[9px] bg-primary/20 text-primary px-1 rounded">Manual</span>}
                </td>
                <td className="py-1.5 px-2 text-right font-mono">{fmt(l.hhTotal)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{fmt(base)}</td>
                <td className="py-1.5 px-1">
                  <ManualInput value={manualVal} onChange={(v) => onOverrideChange(l.funcao, v)} />
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-medium">{fmt(efetivo)}</td>
                <td className="py-1.5 px-2 text-right font-mono">{fmt(l.homemDia)}</td>
                <td className="py-1.5 px-2 text-right font-mono font-semibold">{fmtCur(l.custoTotal)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-xs">
                  {delta !== null && delta !== 0 ? (
                    <span className={delta > 0 ? 'text-destructive' : 'text-green-600'}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-semibold">
            <td className="py-2 px-2">Total</td>
            <td className="py-2 px-2 text-right font-mono">{fmt(totalHH)}</td>
            <td className="py-2 px-2"></td>
            <td className="py-2 px-2"></td>
            <td className="py-2 px-2"></td>
            <td className="py-2 px-2 text-right font-mono">{fmt(totalHD)}</td>
            <td className="py-2 px-2 text-right font-mono">{fmtCur(totalCusto)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
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
