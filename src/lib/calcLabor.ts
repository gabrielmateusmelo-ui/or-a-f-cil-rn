import { ServiceItem } from './calcBudget';
import laborRolesData from '@/model/laborRoles_RN.json';
import laborSplitsData from '@/model/laborSplits.json';

export interface LaborRole {
  descricao: string;
  custoHH: number;
}

export interface LaborResult {
  funcao: string;
  descricao: string;
  custoHH: number;
  hhTotal: number;
  homemDia: number;
  custoTotal: number;
}

const defaultRoles = laborRolesData as Record<string, LaborRole>;
const splits = laborSplitsData as Record<string, Record<string, number>>;

export function calcLabor(
  items: ServiceItem[],
  rolesOverride?: Record<string, LaborRole>
): LaborResult[] {
  const roles = rolesOverride ?? defaultRoles;
  const accHH: Record<string, number> = {};

  for (const key of Object.keys(roles)) {
    accHH[key] = 0;
  }

  for (const item of items) {
    if (item.custoMO <= 0) continue;
    const split = splits[item.grupo] ?? splits['_default'];

    for (const [funcao, pct] of Object.entries(split)) {
      const role = roles[funcao];
      if (!role || role.custoHH <= 0) continue;
      const custoFuncao = item.custoMO * pct;
      const hh = custoFuncao / role.custoHH;
      accHH[funcao] = (accHH[funcao] ?? 0) + hh;
    }
  }

  return Object.entries(roles).map(([funcao, role]) => {
    const hhTotal = accHH[funcao] ?? 0;
    return {
      funcao,
      descricao: role.descricao,
      custoHH: role.custoHH,
      hhTotal,
      homemDia: hhTotal / 8,
      custoTotal: hhTotal * role.custoHH,
    };
  });
}
