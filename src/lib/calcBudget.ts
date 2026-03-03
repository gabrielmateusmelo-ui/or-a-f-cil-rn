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
  abcCumPct?: number;
  abcCumPctSemMat?: number;
  error?: string;
}

export interface GroupSummary {
  group: string;
  subtotalComMat: number;
  subtotalSemMat: number;
  bdiComMat: number;
  bdiSemMat: number;
  totalComMat: number;
  totalSemMat: number;
  shareComMatPct: number;
}

export interface BudgetResult {
  items: ServiceItem[];
  byGroup: GroupSummary[];
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

const padraoMultipliers: Record<string, Record<string, number>> = {
  'Baixo': {
    'Revestimento': 0.75, 'Pisos': 0.70, 'Pintura': 0.80,
    'Esquadrias': 0.65, 'Louças e Metais': 0.60,
    'Instalações Hidráulicas': 0.85, 'Instalações Elétricas': 0.85,
    'Cobertura': 0.85, 'Muro': 0.85, 'Piscina': 0.80,
  },
  'Médio': {},
  'Alto': {
    'Revestimento': 1.30, 'Pisos': 1.35, 'Pintura': 1.20,
    'Esquadrias': 1.50, 'Louças e Metais': 1.80,
    'Instalações Hidráulicas': 1.20, 'Instalações Elétricas': 1.20,
    'Cobertura': 1.15, 'Muro': 1.10, 'Piscina': 1.25,
  },
};

function getPadraoMultiplier(padrao: string, grupo: string): number {
  return padraoMultipliers[padrao]?.[grupo] ?? 1.0;
}

function calcBdiPct(inputs: ProjectInputs): number {
  if (inputs.bdiModo === 'manual') {
    return inputs.bdiManual_pct / 100;
  }
  const fator: Record<string, number> = { Baixo: 0.75, Médio: 0.90, Alto: 1.00 };
  return 0.20 * (fator[inputs.padrao] ?? 0.90);
}

function classifyABC(items: { id: string; total: number }[]): Map<string, { cls: 'A' | 'B' | 'C'; pct: number; cumPct: number }> {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((s, i) => s + i.total, 0);
  const result = new Map<string, { cls: 'A' | 'B' | 'C'; pct: number; cumPct: number }>();
  if (grandTotal === 0) return result;

  let acc = 0;
  for (const item of sorted) {
    acc += item.total;
    const pct = (item.total / grandTotal) * 100;
    const cumPct = (acc / grandTotal) * 100;
    let cls: 'A' | 'B' | 'C' = 'C';
    if (cumPct <= 80) cls = 'A';
    else if (cumPct <= 95) cls = 'B';
    result.set(item.id, { cls, pct, cumPct });
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
    if (!prices[item.id]) {
      errors.push({ itemId: item.id, error: `Preço não encontrado em prices_RN.json para "${item.id}"` });
    }
    const mult = getPadraoMultiplier(inputs.padrao, item.grupo);
    const matUnit = item.inclui_material ? price.material_unit * mult : 0;
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
    if (cm) { item.abcClass = cm.cls; item.abcPct = cm.pct; item.abcCumPct = cm.cumPct; }
    if (sm) { item.abcClassSemMat = sm.cls; item.abcPctSemMat = sm.pct; item.abcCumPctSemMat = sm.cumPct; }
  }

  const subtotalComMaterial = items.reduce((s, i) => s + i.totalComMaterial, 0);
  const subtotalSemMaterial = items.reduce((s, i) => s + i.totalSemMaterial, 0);

  const bdiValorComMat = subtotalComMaterial * bdiPct;
  const bdiValorSemMat = subtotalSemMaterial * bdiPct;

  const totalComMaterial = subtotalComMaterial + bdiValorComMat;
  const totalSemMaterial = subtotalSemMaterial + bdiValorSemMat;

  // Group summary
  const groupMap = new Map<string, { subCM: number; subSM: number }>();
  for (const item of items) {
    const g = groupMap.get(item.grupo) || { subCM: 0, subSM: 0 };
    g.subCM += item.totalComMaterial;
    g.subSM += item.totalSemMaterial;
    groupMap.set(item.grupo, g);
  }

  // Preserve group order from items
  const groupOrder: string[] = [];
  for (const item of items) {
    if (!groupOrder.includes(item.grupo)) groupOrder.push(item.grupo);
  }

  const byGroup: GroupSummary[] = groupOrder.map((group) => {
    const g = groupMap.get(group)!;
    const bdiCM = subtotalComMaterial > 0 ? bdiValorComMat * (g.subCM / subtotalComMaterial) : 0;
    const bdiSM = subtotalSemMaterial > 0 ? bdiValorSemMat * (g.subSM / subtotalSemMaterial) : 0;
    const totCM = g.subCM + bdiCM;
    return {
      group,
      subtotalComMat: g.subCM,
      subtotalSemMat: g.subSM,
      bdiComMat: bdiCM,
      bdiSemMat: bdiSM,
      totalComMat: totCM,
      totalSemMat: g.subSM + bdiSM,
      shareComMatPct: totalComMaterial > 0 ? (totCM / totalComMaterial) * 100 : 0,
    };
  }).filter((g) => g.subtotalComMat > 0 || g.subtotalSemMat > 0);

  const area = derived.areaConstruida;

  return {
    items,
    byGroup,
    subtotalComMaterial,
    subtotalSemMaterial,
    bdiPct,
    bdiValorComMat,
    bdiValorSemMat,
    totalComMaterial,
    totalSemMaterial,
    custoM2ComMat: area > 0 ? totalComMaterial / area : 0,
    custoM2SemMat: area > 0 ? totalSemMaterial / area : 0,
    errors,
  };
}
