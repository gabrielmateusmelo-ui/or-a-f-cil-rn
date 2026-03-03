export interface ProjectInputs {
  areaConstruida_m2: number;
  largura_m: number;
  comprimento_m: number;
  peDireito_m: number;
  areaMolhadas_m2: number;
  areaVaranda_m2: number;
  areaCalcada_m2: number;
  numBanheiros: number;
  numQuartos: number;
  tipoCobertura: 'fibrocimento' | 'cerâmica' | 'laje impermeabilizada';
  padrao: 'Baixo' | 'Médio' | 'Alto';
  perdas: {
    ceramica_pct: number;
    argamassa_pct: number;
    tinta_pct: number;
    concreto_pct: number;
    aco_pct: number;
  };
  bdiModo: 'automatico' | 'manual';
  bdiManual_pct: number;
}

export interface DerivedVars {
  comprimento: number;
  perimetro: number;
  perimetroTotal: number;
  areaParede: number;
  areaParedeInterna: number;
  areaRevestimentoCeramico: number;
  areaTelhado: number;
  areaConstruida: number;
  areaVaranda: number;
  areaCalcada: number;
  areaMolhadas: number;
  peDireito: number;
  numBanheiros: number;
  numQuartos: number;
  [key: string]: number;
}

export function derive(inputs: ProjectInputs): DerivedVars {
  const comprimento = inputs.comprimento_m > 0
    ? inputs.comprimento_m
    : inputs.largura_m > 0
      ? inputs.areaConstruida_m2 / inputs.largura_m
      : Math.sqrt(inputs.areaConstruida_m2);

  const largura = inputs.largura_m > 0 ? inputs.largura_m : comprimento;
  const perimetro = 2 * (largura + comprimento);

  // Internal walls: estimate ~60% additional wall length
  const perimetroInterno = perimetro * 0.6;
  const perimetroTotal = perimetro + perimetroInterno;

  const areaParede = perimetro * inputs.peDireito_m;
  const areaParedeInterna = perimetroInterno * inputs.peDireito_m;

  // Ceramic wall coverage in wet areas: approx height 1.5m average
  const areaRevestimentoCeramico = inputs.areaMolhadas_m2 > 0
    ? Math.sqrt(inputs.areaMolhadas_m2) * 4 * 1.5 * inputs.numBanheiros * 0.5 + inputs.areaMolhadas_m2 * 0.3
    : 0;

  // Roof area with 15% overhang for pitched roofs
  const fatorTelhado = inputs.tipoCobertura === 'laje impermeabilizada' ? 1.0 : 1.15;
  const areaTelhado = inputs.areaConstruida_m2 * fatorTelhado;

  return {
    comprimento,
    largura,
    perimetro,
    perimetroTotal,
    perimetroInterno,
    areaParede,
    areaParedeInterna,
    areaRevestimentoCeramico,
    areaTelhado,
    areaConstruida: inputs.areaConstruida_m2,
    areaVaranda: inputs.areaVaranda_m2,
    areaCalcada: inputs.areaCalcada_m2,
    areaMolhadas: inputs.areaMolhadas_m2,
    peDireito: inputs.peDireito_m,
    numBanheiros: inputs.numBanheiros,
    numQuartos: inputs.numQuartos,
  };
}
