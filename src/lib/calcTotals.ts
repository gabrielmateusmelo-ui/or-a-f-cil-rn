import { BudgetResult, GroupSummary } from './calcBudget';
import { MaterialLine } from './calcMaterials';
import { LaborResult } from './calcLabor';

export interface Summary {
  subtotalDireto: number;
  totalMateriais: number;
  totalMaoObra: number;
  bdiRate: number;
  bdiValor: number;
  totalFinal: number;
  valorM2: number;
  fonte: 'BASELINE' | 'DINAMICO';
  avisos: string[];
}

export interface DynamicGroupSummary {
  group: string;
  totalComMat: number;
  sharePct: number;
  proporcional: boolean;
}

export function calcTotals(
  budget: BudgetResult,
  materials: MaterialLine[],
  labor: LaborResult[],
  bdiRate: number,
  areaConstruida: number,
  modo: 'BASELINE' | 'DINAMICO'
): Summary {
  if (modo === 'BASELINE') {
    return {
      subtotalDireto: budget.subtotalComMaterial,
      totalMateriais: budget.items.reduce((s, i) => s + i.custoMaterial, 0),
      totalMaoObra: budget.items.reduce((s, i) => s + i.custoMO, 0),
      bdiRate,
      bdiValor: budget.bdiValorComMat,
      totalFinal: budget.totalComMaterial,
      valorM2: areaConstruida > 0 ? budget.totalComMaterial / areaConstruida : 0,
      fonte: 'BASELINE',
      avisos: [],
    };
  }

  // DINAMICO
  const avisos: string[] = [];
  const totalMateriais = materials.reduce((s, m) => s + m.custoTotal, 0);

  const laborTotalCost = labor.reduce((s, l) => s + l.custoTotal, 0);
  let totalMaoObra: number;
  if (laborTotalCost > 0) {
    totalMaoObra = laborTotalCost;
  } else {
    totalMaoObra = budget.items.reduce((s, i) => s + i.custoMO, 0);
    avisos.push('Equipe sem HH — usando MO baseline');
  }

  const subtotalDireto = totalMateriais + totalMaoObra;
  const bdiValor = subtotalDireto * bdiRate;
  const totalFinal = subtotalDireto + bdiValor;

  return {
    subtotalDireto,
    totalMateriais,
    totalMaoObra,
    bdiRate,
    bdiValor,
    totalFinal,
    valorM2: areaConstruida > 0 ? totalFinal / areaConstruida : 0,
    fonte: 'DINAMICO',
    avisos,
  };
}

export function calcDynamicGroups(
  budget: BudgetResult,
  summaryDinamico: Summary
): DynamicGroupSummary[] {
  const baselineTotal = budget.totalComMaterial;
  if (baselineTotal <= 0) return [];

  return budget.byGroup.map((g) => {
    const share = g.totalComMat / baselineTotal;
    return {
      group: g.group,
      totalComMat: summaryDinamico.totalFinal * share,
      sharePct: share * 100,
      proporcional: true,
    };
  });
}
