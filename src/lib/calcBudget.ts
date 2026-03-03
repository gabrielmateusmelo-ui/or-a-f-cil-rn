import { safeEval } from './eval';
import { DerivedVars, ProjectInputs } from './derive';
import itemsData from '@/model/items.json';
import pricesData from '@/model/prices_RN.json';

export interface ServiceItem {
  id: string;
  grupo: string;
  codigo: string;
  descricao: string;
  unidade: string;
  qtd: number;
  custoMaterial: number;
  custoMO: number;
  totalComMaterial: number;
  totalSemMaterial: number;
  abcClass?: 'A' | 'B' | 'C';
  abcClassSemMat?: 'A' | 'B' | 'C';
  abcPct?: number;
  abcPctSemMat?: number;
  error?: string;
}

export interface BudgetResult {
  items: ServiceItem[];
  subtotalComMaterial: number;
  subtotalSemMaterial: number;
  bdiPct: number;
  bdiValorComMat: number;
  bdiValorSemMat: number;
  totalComMaterial: number;
  totalSemMaterial: number;
  custoM2ComMat: number;
  custoM2SemMat: number;
  errors: { itemId: string; error: string }[];
}

const prices = pricesData as Record<string, { material_unit: number; mo_unit: number }>;

function calcBdiPct(inputs: ProjectInputs): number {
  if (inputs.bdiModo === 'manual') {
    return inputs.bdiManual_pct / 100;
  }
  const fator: Record<string, number> = { Baixo: 0.75, Médio: 0.90, Alto: 1.00 };
  return 0.20 * (fator[inputs.padrao] ?? 0.90);
}

function classifyABC(items: { id: string; total: number }[]): Map<string, { cls: 'A' | 'B' | 'C'; pct: number }> {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((s, i) => s + i.total, 0);
  const result = new Map<string, { cls: 'A' | 'B' | 'C'; pct: number }>();
  if (grandTotal === 0) return result;

  let acc = 0;
  for (const item of sorted) {
    acc += item.total;
    const pct = (item.total / grandTotal) * 100;
    const accPct = (acc / grandTotal) * 100;
    let cls: 'A' | 'B' | 'C' = 'C';
    if (accPct <= 80) cls = 'A';
    else if (accPct <= 95) cls = 'B';
    result.set(item.id, { cls, pct });
  }
  return result;
}

export function calcBudget(inputs: ProjectInputs, derived: DerivedVars): BudgetResult {
  const bdiPct = calcBdiPct(inputs);
  const errors: { itemId: string; error: string }[] = [];

  const items: ServiceItem[] = itemsData.map((item) => {
    const evalResult = safeEval(item.qtd_expr, derived as unknown as Record<string, number>);
    const qtd = evalResult.value;
    if (evalResult.error) {
      errors.push({ itemId: item.id, error: evalResult.error });
    }

    const price = prices[item.id] || { material_unit: 0, mo_unit: 0 };
    const matUnit = item.inclui_material ? price.material_unit : 0;
    const moUnit = item.inclui_mo ? price.mo_unit : 0;

    return {
      id: item.id,
      grupo: item.grupo,
      codigo: item.codigo,
      descricao: item.descricao,
      unidade: item.unidade,
      qtd,
      custoMaterial: qtd * matUnit,
      custoMO: qtd * moUnit,
      totalComMaterial: qtd * (matUnit + moUnit),
      totalSemMaterial: qtd * moUnit,
      error: evalResult.error,
    };
  });

  // ABC classification
  const abcComMat = classifyABC(items.map((i) => ({ id: i.id, total: i.totalComMaterial })));
  const abcSemMat = classifyABC(items.map((i) => ({ id: i.id, total: i.totalSemMaterial })));

  for (const item of items) {
    const cm = abcComMat.get(item.id);
    const sm = abcSemMat.get(item.id);
    if (cm) { item.abcClass = cm.cls; item.abcPct = cm.pct; }
    if (sm) { item.abcClassSemMat = sm.cls; item.abcPctSemMat = sm.pct; }
  }

  const subtotalComMaterial = items.reduce((s, i) => s + i.totalComMaterial, 0);
  const subtotalSemMaterial = items.reduce((s, i) => s + i.totalSemMaterial, 0);

  const bdiValorComMat = subtotalComMaterial * bdiPct;
  const bdiValorSemMat = subtotalSemMaterial * bdiPct;

  return {
    items,
    subtotalComMaterial,
    subtotalSemMaterial,
    bdiPct,
    bdiValorComMat,
    bdiValorSemMat,
    totalComMaterial: subtotalComMaterial + bdiValorComMat,
    totalSemMaterial: subtotalSemMaterial + bdiValorSemMat,
    custoM2ComMat: inputs.areaConstruida_m2 > 0 ? (subtotalComMaterial + bdiValorComMat) / inputs.areaConstruida_m2 : 0,
    custoM2SemMat: inputs.areaConstruida_m2 > 0 ? (subtotalSemMaterial + bdiValorSemMat) / inputs.areaConstruida_m2 : 0,
    errors,
  };
}
