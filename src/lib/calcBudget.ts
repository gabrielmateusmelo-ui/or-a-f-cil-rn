import { safeEval } from './eval';
import { DerivedVars, ProjectInputs, PrecosInputs } from './derive';
import itemsData from '@/model/items.json';
import pricesData from '@/model/prices_RN.json';
import materialCoeffsData from '@/model/materialCoeffs.json';
import sinapiBaseline from '@/model/sinapiBaseline_RN_202412.json';
import laborSplitsData from '@/model/laborSplits.json';

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
  materialUnitUsed: number;
  moUnitUsed: number;
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
const materialCoeffs = materialCoeffsData as Record<string, { materialId: string; coef_por_unidade_servico: number; categoria: string }[]>;
const laborSplits = laborSplitsData as Record<string, Record<string, number>>;

// Map materialId -> SINAPI insumo key (for price override lookups)
const materialIdToSinapiKey: Record<string, string> = {
  // Cimento
  'cimento': 'CIMENTO_KG',
  'cimento_pisc': 'CIMENTO_KG',
  // Blocos
  'bloco_14cm': 'BLOCO_UN',
  'bloco_9cm': 'BLOCO_UN',
  // Argamassa colante
  'argamassa_colante': 'ARG_COLANTE_KG',
  'arg_colante_pisc': 'ARG_COLANTE_KG',
  'arg_colante_ext': 'ARG_COLANTE_KG',
  // Argamassa reboco
  'arg_reboco_muro': 'ARG_REBOCO_KG',
  'arg_reboco_platib': 'ARG_REBOCO_KG',
  'arg_chapisco_muro': 'ARG_REBOCO_KG',
  'arg_assent_muro': 'ARG_REBOCO_KG',
  'cal_hidratada': 'CAL_KG',
  // Tintas
  'tinta_pva': 'TINTA_L',
  'tinta_acrilica': 'TINTA_L',
  'tinta_muro': 'TINTA_L',
  'textura_acrilica': 'TINTA_L',
  'selador_pva': 'SELADOR_L',
  'selador_acrilico': 'SELADOR_L',
  'selador_muro': 'SELADOR_L',
  // Aço
  'aco_ca50': 'ACO_KG',
  'aco_escada': 'ACO_KG',
  'arame_recozido': 'ACO_KG',
  // Areia
  'areia_media': 'AREIA_M3',
  'areia_fina': 'AREIA_M3',
  'areia_grossa': 'AREIA_M3',
  'areia_pisc': 'AREIA_M3',
  // Brita
  'brita_1': 'BRITA_M3',
  'brita_pisc': 'BRITA_M3',
  // Cerâmica/revestimento
  'ceramica_parede': 'REVEST_M2',
  'ceramica_piso': 'REVEST_M2',
  'ceramica_piso_antiderrap': 'REVEST_M2',
  'ceramica_piso_ext': 'CER_EXT_M2',
  'rev_pisc': 'REVEST_M2',
  'piso_ext_m2': 'CER_EXT_M2',
  // Manta
  'manta_asfaltica': 'MANTA_M2',
  'manta_asfaltica_cobertura': 'MANTA_M2',
  'manta_asfaltica_subsolo': 'MANTA_M2',
  'manta_imperm_laje': 'MANTA_M2',
  // Madeira/cobertura
  'madeiramento': 'MADEIRA_M2',
  'telha': 'TELHA_M2',
  // Forro
  'forro_pvc_material': 'PVC_FORRO_M2',
  // Instalações
  'cabo_eletrico': 'CABO_M',
  'tubo_pvc': 'TUBO_PVC_M',
};

function getInsumoPrice(materialId: string, precos: PrecosInputs): number | null {
  const sinapiKey = materialIdToSinapiKey[materialId];
  if (!sinapiKey) return null;
  // User override first, then baseline
  if (precos.insumos[sinapiKey] !== undefined) return precos.insumos[sinapiKey];
  const baseline = (sinapiBaseline.insumos as any)[sinapiKey];
  return baseline?.value ?? null;
}

function calcMaterialUnitFromCoeffs(itemId: string, precos: PrecosInputs): number | null {
  const coeffs = materialCoeffs[itemId];
  if (!coeffs || coeffs.length === 0) return null;
  
  let total = 0;
  let allResolved = true;
  for (const c of coeffs) {
    const price = getInsumoPrice(c.materialId, precos);
    if (price === null) {
      allResolved = false;
      continue;
    }
    total += c.coef_por_unidade_servico * price;
  }
  // Return partial sum even if not all resolved (better than nothing)
  return total;
}

function getHHCost(funcao: string, precos: PrecosInputs): number {
  if (precos.maoObraHH[funcao] !== undefined) return precos.maoObraHH[funcao];
  const baseline = (sinapiBaseline.maoObraHH as any)[funcao];
  return baseline?.value ?? 0;
}

function calcMoUnitFromHH(itemId: string, grupo: string, baseMoUnit: number, precos: PrecosInputs): number {
  // Get the labor split for this group
  const split = laborSplits[grupo] ?? laborSplits['_default'] ?? { pedreiro: 0.5, servente: 0.5 };
  
  // Base HH cost per unit (from laborRoles baseline)
  let baseHHCostPerUnit = 0;
  let newHHCostPerUnit = 0;
  
  for (const [funcao, pct] of Object.entries(split)) {
    const baselineEntry = (sinapiBaseline.maoObraHH as any)[funcao];
    const baseRate = baselineEntry?.value ?? 0;
    const newRate = getHHCost(funcao, precos);
    
    if (baseRate > 0) {
      // Fraction of cost for this function
      const costFraction = baseMoUnit * pct;
      const hh = costFraction / baseRate;
      baseHHCostPerUnit += costFraction;
      newHHCostPerUnit += hh * newRate;
    }
  }
  
  // If we could decompose, return recalculated. Otherwise return base.
  return baseHHCostPerUnit > 0 ? newHHCostPerUnit : baseMoUnit;
}

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
  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };

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

    // Material unit: override from insumo coefficients if toggle on
    let matUnit: number;
    if (item.inclui_material && precos.usarPrecosInsumos) {
      const fromCoeffs = calcMaterialUnitFromCoeffs(item.id, precos);
      matUnit = (fromCoeffs !== null && fromCoeffs > 0) ? fromCoeffs * mult : price.material_unit * mult;
    } else {
      matUnit = item.inclui_material ? price.material_unit * mult : 0;
    }

    // MO unit: override from HH if toggle on
    let moUnit: number;
    if (item.inclui_mo && precos.usarPrecosMaoObraHH) {
      moUnit = calcMoUnitFromHH(item.id, item.grupo, price.mo_unit, precos);
    } else {
      moUnit = item.inclui_mo ? price.mo_unit : 0;
    }

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
      materialUnitUsed: matUnit,
      moUnitUsed: moUnit,
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
