import { BudgetResult } from '@/lib/calcBudget';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function KPICards({ result }: { result: BudgetResult }) {
  const cards = [
    { label: 'Total c/ Material', value: fmt(result.totalComMaterial) },
    { label: 'Total s/ Material', value: fmt(result.totalSemMaterial) },
    { label: 'BDI', value: `${(result.bdiPct * 100).toFixed(1)}%` },
    { label: 'R$/m² (c/ mat)', value: fmt(result.custoM2ComMat) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-xs opacity-80">{c.label}</p>
          <p className="text-lg font-bold font-mono mt-0.5">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
