import { Summary } from '@/lib/calcTotals';
import { Badge } from '@/components/ui/badge';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface KpiRowProps {
  titlePrefix: string;
  summary: { totalFinal: number; totalMateriais: number; totalMaoObra: number; valorM2: number };
  variant: 'ref' | 'dyn';
  badge?: string;
}

function KpiRow({ titlePrefix, summary, variant, badge }: KpiRowProps) {
  const cards = [
    { label: 'Total Final', value: fmt(summary.totalFinal) },
    { label: 'Materiais', value: fmt(summary.totalMateriais) },
    { label: 'Mão de Obra', value: fmt(summary.totalMaoObra) },
    { label: 'R$/m²', value: fmt(summary.valorM2) },
  ];

  const isRef = variant === 'ref';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isRef ? 'text-primary' : 'text-info'}`}>
          {titlePrefix}
        </span>
        {badge && (
          <Badge variant={badge === 'Ajustado' ? 'default' : 'secondary'} className="text-[10px] py-0 h-4">
            {badge}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg px-4 py-3 ${
              isRef
                ? 'bg-primary text-primary-foreground'
                : 'bg-info/15 text-foreground border border-info/30'
            }`}
          >
            <p className={`text-xs ${isRef ? 'opacity-80' : 'text-muted-foreground'}`}>{c.label}</p>
            <p className="text-lg font-bold font-mono mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  baseline: Summary;
  dinamico: Summary;
  modo: 'BASELINE' | 'DINAMICO';
  onModoChange: (m: 'BASELINE' | 'DINAMICO') => void;
  hasDynamicOverrides: boolean;
}

export default function KPICards({ baseline, dinamico, modo, onModoChange, hasDynamicOverrides }: Props) {
  const diff = dinamico.totalFinal - baseline.totalFinal;
  const diffPct = baseline.totalFinal > 0 ? (diff / baseline.totalFinal) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Row 1: Reference */}
      <KpiRow titlePrefix="SINAPI (Referência)" summary={baseline} variant="ref" />

      {/* Delta bar */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <span className="font-medium">Δ Editado vs SINAPI:</span>
        <span
          className={`font-mono font-semibold ${
            diff > 0 ? 'text-destructive' : diff < 0 ? 'text-success' : 'text-muted-foreground'
          }`}
        >
          {fmt(diff)} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
        </span>
      </div>

      {/* Row 2: Dynamic */}
      <KpiRow
        titlePrefix="Editado (Dinâmico)"
        summary={dinamico}
        variant="dyn"
        badge={hasDynamicOverrides ? 'Ajustado' : 'Sem ajustes'}
      />

      {/* Mode toggle for tables */}
      <div className="flex items-center gap-1 rounded-md border border-border overflow-hidden w-fit text-xs">
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

      {dinamico.avisos.length > 0 && (
        <div className="text-[10px] text-muted-foreground px-1">
          {dinamico.avisos.map((a, i) => <span key={i} className="mr-2">⚠ {a}</span>)}
        </div>
      )}
    </div>
  );
}
