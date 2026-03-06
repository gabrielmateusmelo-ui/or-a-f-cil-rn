import { ServiceItem } from './calcBudget';
import { ProjectInputs, PrecosInputs } from './derive';
import materialCoeffsData from '@/model/materialCoeffs.json';
import sinapiBaseline from '@/model/sinapiBaseline_RN_202412.json';

interface MaterialCoeff {
  materialId: string;
  descricao: string;
  unidade: string;
  coef_por_unidade_servico: number;
  categoria: string;
}

export interface MaterialLine {
  materialId: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  categoria: string;
  sinapiKey: string;
  precoBase: number;
  precoUnitario: number;
  custoTotal: number;
}

const coeffs = materialCoeffsData as Record<string, MaterialCoeff[]>;

const categoriaPerda: Record<string, string> = {
  ceramica: 'ceramica_pct',
  argamassa: 'argamassa_pct',
  tinta: 'tinta_pct',
  concreto: 'concreto_pct',
  aco: 'aco_pct',
  alvenaria: 'blocos_pct',
  cobertura: 'telha_pct',
  impermeabilizacao: 'impermeab_pct',
};

// Same mapping as calcBudget for consistency
const materialIdToSinapiKey: Record<string, string> = {
  'cimento': 'CIMENTO_KG', 'cimento_pisc': 'CIMENTO_KG',
  'bloco_14cm': 'BLOCO_UN', 'bloco_9cm': 'BLOCO_UN',
  'argamassa_colante': 'ARG_COLANTE_KG', 'arg_colante_pisc': 'ARG_COLANTE_KG', 'arg_colante_ext': 'ARG_COLANTE_KG',
  'arg_reboco_muro': 'ARG_REBOCO_KG', 'arg_reboco_platib': 'ARG_REBOCO_KG', 'arg_chapisco_muro': 'ARG_REBOCO_KG', 'arg_assent_muro': 'ARG_REBOCO_KG',
  'cal_hidratada': 'CAL_KG',
  'tinta_pva': 'TINTA_L', 'tinta_acrilica': 'TINTA_L', 'tinta_muro': 'TINTA_L', 'textura_acrilica': 'TINTA_L',
  'selador_pva': 'SELADOR_L', 'selador_acrilico': 'SELADOR_L', 'selador_muro': 'SELADOR_L',
  'aco_ca50': 'ACO_KG', 'aco_escada': 'ACO_KG', 'arame_recozido': 'ACO_KG',
  'areia_media': 'AREIA_M3', 'areia_fina': 'AREIA_M3', 'areia_grossa': 'AREIA_M3', 'areia_pisc': 'AREIA_M3',
  'brita_1': 'BRITA_M3', 'brita_pisc': 'BRITA_M3',
  'ceramica_parede': 'REVEST_M2', 'ceramica_piso': 'REVEST_M2', 'ceramica_piso_antiderrap': 'REVEST_M2',
  'ceramica_piso_ext': 'CER_EXT_M2', 'rev_pisc': 'REVEST_M2', 'piso_ext_m2': 'CER_EXT_M2',
  'manta_asfaltica': 'MANTA_M2', 'manta_asfaltica_cobertura': 'MANTA_M2', 'manta_asfaltica_subsolo': 'MANTA_M2', 'manta_imperm_laje': 'MANTA_M2',
  'madeiramento': 'MADEIRA_M2', 'telha': 'TELHA_M2',
  'forro_pvc_material': 'PVC_FORRO_M2',
  'cabo_eletrico': 'CABO_M', 'tubo_pvc': 'TUBO_PVC_M',
};

function getBasePrice(materialId: string): number {
  const sinapiKey = materialIdToSinapiKey[materialId];
  if (!sinapiKey) return 0;
  const baseline = (sinapiBaseline.insumos as any)[sinapiKey];
  return baseline?.value ?? 0;
}

function getInsumoPrice(materialId: string, precos: PrecosInputs): number {
  const sinapiKey = materialIdToSinapiKey[materialId];
  if (!sinapiKey) return 0;
  if (precos.insumos[sinapiKey] !== undefined) return precos.insumos[sinapiKey];
  return getBasePrice(materialId);
}

export function calcMaterials(items: ServiceItem[], inputs: ProjectInputs): MaterialLine[] {
  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
  const agg = new Map<string, MaterialLine>();

  for (const item of items) {
    const itemCoeffs = coeffs[item.id];
    if (!itemCoeffs || item.qtd <= 0) continue;

    for (const coeff of itemCoeffs) {
      const consumo = item.qtd * coeff.coef_por_unidade_servico;
      const perdaKey = categoriaPerda[coeff.categoria];
      const perdaPct = perdaKey ? (inputs.perdas as any)[perdaKey] ?? 0 : 0;
      const consumoComPerda = consumo * (1 + perdaPct / 100);

      const unitPrice = getInsumoPrice(coeff.materialId, precos);
      const basePrice = getBasePrice(coeff.materialId);
      const sKey = materialIdToSinapiKey[coeff.materialId] ?? '';

      const key = `${coeff.materialId}__${coeff.unidade}`;
      const existing = agg.get(key);
      if (existing) {
        existing.quantidade += consumoComPerda;
        existing.custoTotal += consumoComPerda * unitPrice;
      } else {
        agg.set(key, {
          materialId: coeff.materialId,
          descricao: coeff.descricao,
          unidade: coeff.unidade,
          quantidade: consumoComPerda,
          categoria: coeff.categoria,
          sinapiKey: sKey,
          precoBase: basePrice,
          precoUnitario: unitPrice,
          custoTotal: consumoComPerda * unitPrice,
        });
      }
    }
  }

  return Array.from(agg.values()).sort((a, b) => a.descricao.localeCompare(b.descricao));
}
