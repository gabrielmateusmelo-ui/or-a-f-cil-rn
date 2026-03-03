import { ServiceItem } from './calcBudget';
import { ProjectInputs } from './derive';
import materialCoeffsData from '@/model/materialCoeffs.json';

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
};

export function calcMaterials(items: ServiceItem[], inputs: ProjectInputs): MaterialLine[] {
  const agg = new Map<string, MaterialLine>();

  for (const item of items) {
    const itemCoeffs = coeffs[item.id];
    if (!itemCoeffs || item.qtd <= 0) continue;

    for (const coeff of itemCoeffs) {
      const consumo = item.qtd * coeff.coef_por_unidade_servico;
      const perdaKey = categoriaPerda[coeff.categoria];
      const perdaPct = perdaKey ? (inputs.perdas as any)[perdaKey] ?? 0 : 0;
      const consumoComPerda = consumo * (1 + perdaPct / 100);

      const key = `${coeff.materialId}__${coeff.unidade}`;
      const existing = agg.get(key);
      if (existing) {
        existing.quantidade += consumoComPerda;
      } else {
        agg.set(key, {
          materialId: coeff.materialId,
          descricao: coeff.descricao,
          unidade: coeff.unidade,
          quantidade: consumoComPerda,
          categoria: coeff.categoria,
        });
      }
    }
  }

  return Array.from(agg.values()).sort((a, b) => a.descricao.localeCompare(b.descricao));
}
