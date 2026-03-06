import { Summary } from '@/lib/calcTotals';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  baseline: Summary;
  dinamico: Summary;
  modo: 'BASELINE' | 'DINAMICO';
  onModoChange: (m: 'BASELINE' | 'DINAMICO') => void;
  hasDynamicOverrides: boolean;
}

export default function KPICards({ baseline, dinamico, modo, onModoChange, hasDynamicOverrides }: Props) {
  const active = modo === 'DINAMICO' ? dinamico : baseline;

  const cards = [
    { label: 'Total Final', value: fmt(active.totalFinal) },
    { label: 'Materiais', value: fmt(active.totalMateriais) },
    { label: 'Mão de Obra', value: fmt(active.totalMaoObra) },
    { label: 'R$/m²', value: fmt(active.valorM2) },
  ];

  const diff = dinamico.totalFinal - baseline.totalFinal;
  const diffPct = baseline.totalFinal > 0 ? (diff / baseline.totalFinal) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-xs opacity-80">{c.label}</p>
            <p className="text-lg font-bold font-mono mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Mode toggle + comparison */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
        <div className="flex items-center gap-1 rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onModoChange('BASELINE')}
            className={`px-2.5 py-1 transition-colors ${modo === 'BASELINE' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Referência (Serviços)
          </button>
          <button
            onClick={() => onModoChange('DINAMICO')}
            className={`px-2.5 py-1 transition-colors ${modo === 'DINAMICO' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Dinâmico (Mat+Equipe)
          </button>
        </div>

        {hasDynamicOverrides && modo === 'DINAMICO' && (
          <span className="text-accent-foreground bg-accent px-2 py-0.5 rounded text-[10px] font-medium">
            Total dinâmico ativo
          </span>
        )}

        <div className="ml-auto flex gap-3 text-muted-foreground">
          <span>Ref: <strong className="text-foreground font-mono">{fmt(baseline.totalFinal)}</strong></span>
          <span>Din: <strong className="text-foreground font-mono">{fmt(dinamico.totalFinal)}</strong></span>
          <span className={diff > 0 ? 'text-destructive' : diff < 0 ? 'text-green-600' : ''}>
            Δ {fmt(diff)} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {dinamico.avisos.length > 0 && modo === 'DINAMICO' && (
        <div className="text-[10px] text-muted-foreground px-1">
          {dinamico.avisos.map((a, i) => <span key={i} className="mr-2">⚠ {a}</span>)}
        </div>
      )}
    </div>
  );
}
