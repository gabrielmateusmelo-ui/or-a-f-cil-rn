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
    blocos_pct: number;
    telha_pct: number;
  };
  bdiModo: 'automatico' | 'manual';
  bdiManual_pct: number;
  // New inputs
  fatorParedesInternas: number;
  percVaosExternos_pct: number;
  percPortasInternas_pct: number;
  alturaRevestParede_m: number;
  areaRevestParedeOverride_m2: number;
  areaTetoExcluiVaranda: boolean;
}

export interface DerivedVars {
  comprimento: number;
  largura: number;
  perimetroExterno: number;
  perimetroInterno: number;
  perimetroTotal: number;
  areaParedeExternaBruta: number;
  areaParedeExternaLiquida: number;
  areaParedeInterna1Face: number;
  areaParedeInterna2Faces: number;
  areaTelhado: number;
  areaTeto: number;
  areaConstruida: number;
  areaInterna: number;
  areaSeca: number;
  areaVaranda: number;
  areaCalcada: number;
  areaMolhadas: number;
  areaRevestimentoCeramicoParede: number;
  peDireito: number;
  numBanheiros: number;
  numQuartos: number;
  isFibro: number;
  isCeram: number;
  isLaje: number;
  // Legacy aliases for backward compat with expressions
  perimetro: number;
  areaParede: number;
  areaParedeInterna: number;
  areaRevestimentoCeramico: number;
  [key: string]: number;
}

export function derive(inputs: ProjectInputs): DerivedVars {
  const comprimento = inputs.comprimento_m > 0
    ? inputs.comprimento_m
    : inputs.largura_m > 0
      ? inputs.areaConstruida_m2 / inputs.largura_m
      : Math.sqrt(inputs.areaConstruida_m2);

  const largura = inputs.largura_m > 0 ? inputs.largura_m : comprimento;
  const perimetroExterno = 2 * (largura + comprimento);
  const perimetroInterno = perimetroExterno * inputs.fatorParedesInternas;
  const perimetroTotal = perimetroExterno + perimetroInterno;

  const areaParedeExternaBruta = perimetroExterno * inputs.peDireito_m;
  const areaParedeExternaLiquida = areaParedeExternaBruta * (1 - inputs.percVaosExternos_pct / 100);
  const areaParedeInterna1Face = perimetroInterno * inputs.peDireito_m;
  const areaParedeInterna2Faces = areaParedeInterna1Face * 2 * (1 - inputs.percPortasInternas_pct / 100);

  const areaConstruida = inputs.areaConstruida_m2;
  const areaVaranda = inputs.areaVaranda_m2;
  const areaMolhadas = inputs.areaMolhadas_m2;
  const areaInterna = Math.max(0, areaConstruida - areaVaranda);
  const areaSeca = Math.max(0, areaInterna - areaMolhadas);
  const areaTeto = Math.max(0, areaConstruida - (inputs.areaTetoExcluiVaranda ? areaVaranda : 0));

  // Ceramic wall coverage
  let areaRevestimentoCeramicoParede: number;
  if (inputs.areaRevestParedeOverride_m2 > 0) {
    areaRevestimentoCeramicoParede = inputs.areaRevestParedeOverride_m2;
  } else {
    const areaRevest = (inputs.numBanheiros * 12) + (Math.max(0, areaMolhadas - inputs.numBanheiros * 4) * 0.9);
    areaRevestimentoCeramicoParede = areaRevest * (inputs.alturaRevestParede_m / 1.5);
  }

  // Roof area with 15% overhang for pitched roofs
  const fatorTelhado = inputs.tipoCobertura === 'laje impermeabilizada' ? 1.0 : 1.15;
  const areaTelhado = areaConstruida * fatorTelhado;

  // Coverage type flags
  const isFibro = inputs.tipoCobertura === 'fibrocimento' ? 1 : 0;
  const isCeram = inputs.tipoCobertura === 'cerâmica' ? 1 : 0;
  const isLaje = inputs.tipoCobertura === 'laje impermeabilizada' ? 1 : 0;

  return {
    comprimento,
    largura,
    perimetroExterno,
    perimetroInterno,
    perimetroTotal,
    areaParedeExternaBruta,
    areaParedeExternaLiquida,
    areaParedeInterna1Face,
    areaParedeInterna2Faces,
    areaTelhado,
    areaTeto,
    areaConstruida,
    areaInterna,
    areaSeca,
    areaVaranda,
    areaCalcada: inputs.areaCalcada_m2,
    areaMolhadas,
    areaRevestimentoCeramicoParede,
    peDireito: inputs.peDireito_m,
    numBanheiros: inputs.numBanheiros,
    numQuartos: inputs.numQuartos,
    isFibro,
    isCeram,
    isLaje,
    // Legacy aliases
    perimetro: perimetroExterno,
    areaParede: areaParedeExternaLiquida,
    areaParedeInterna: areaParedeInterna2Faces,
    areaRevestimentoCeramico: areaRevestimentoCeramicoParede,
  };
}
