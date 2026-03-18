import { DerivedVars, ProjectInputs } from '@/lib/derive';
import { BudgetResult } from '@/lib/calcBudget';
import { useState } from 'react';

interface Props {
  inputs: ProjectInputs;
  derived: DerivedVars;
  result: BudgetResult;
}

export default function DebugPanel({ inputs, derived, result }: Props) {
  const [open, setOpen] = useState(false);

  const zeroCount = result.items.filter((i) => i.totalComMaterial === 0).length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 text-sm font-medium hover:bg-muted transition-colors"
      >
        <span>🐛 Painel Debug</span>
        <span className="flex items-center gap-2">
          {result.errors.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full">
              {result.errors.length} erro(s)
            </span>
          )}
          <span className="text-muted-foreground">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && (
        <div className="p-4 space-y-4 text-xs font-mono bg-card">
          <div>
            <h4 className="font-semibold text-foreground mb-1">Inputs</h4>
            <pre className="bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(inputs, null, 2)}</pre>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Variáveis Derivadas</h4>
            <pre className="bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(derived, null, 2)}</pre>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Resumo</h4>
            <p>Total de itens: {result.items.length}</p>
            <p>Itens zerados: {zeroCount}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Áreas derivadas (cômodos)</h4>
            <p>areaMolhadas: <strong>{derived.areaMolhadas.toFixed(2)}</strong> m²</p>
            <p>areaSeca: <strong>{derived.areaSeca.toFixed(2)}</strong> m²</p>
            <p>areaRevestParedeMolhada: <strong>{(derived.areaRevestParedeMolhada_m2 as number).toFixed(2)}</strong> m²</p>
            <p>areaVaranda: <strong>{derived.areaVaranda.toFixed(2)}</strong> m²</p>
            <p>areaInterna: <strong>{derived.areaInterna.toFixed(2)}</strong> m²</p>
          </div>
          {result.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-destructive mb-1">⚠ Erros de Fórmula</h4>
              {result.errors.map((e, i) => (
                <p key={i} className="text-destructive">{e.itemId}: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
