export interface MuroInputs {
  frente: number;
  fundos: number;
  ladoDir: number;
  ladoEsq: number;
  altura: number;
  rebocar: 'NAO' | 'SIM' | 'FORA';
  pintar: 'NAO' | 'SIM' | 'FORA';
  portaoGaragem: boolean;
  portaoPedestre: boolean;
}

export interface PiscinaInputs {
  largura: number;
  comprimento: number;
  profundidade: number;
  revest: 'CERAMICA' | 'VINIL';
  casaMaquinas: boolean;
}

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
  fatorParedesInternas: number;
  percVaosExternos_pct: number;
  percPortasInternas_pct: number;
  alturaRevestParede_m: number;
  areaRevestParedeOverride_m2: number;
  areaTetoExcluiVaranda: boolean;
  // Dimensions mode
  dimensoesModo: 'AREA' | 'LxC';
  proporcaoLC: number;
  // Muro
  muro: MuroInputs;
  // Piscina
  piscina: PiscinaInputs;
  // Advanced
  pedireitoDuplo_area_m2: number;
  pedireitoDuplo_altura_m: number;
  tipoPinturaExterna: 'ACRILICA' | 'TEXTURA';
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
  // Muro
  perimetroMuro: number;
  areaMuro: number;
  fatorFaceReboco: number;
  fatorFacePintura: number;
  portaoGaragem: number;
  portaoPedestre: number;
  // Piscina
  areaPiscina: number;
  perimetroPiscina: number;
  volumePiscina: number;
  areaRevestPiscina: number;
  temPiscina: number;
  casaMaquinas: number;
  // Advanced
  areaExtraParedesPDduplo: number;
  isPinturaAcrilica: number;
  isPinturaTextura: number;
  // Legacy aliases
  perimetro: number;
  areaParede: number;
  areaParedeInterna: number;
  areaRevestimentoCeramico: number;
  [key: string]: number;
}

export function derive(inputs: ProjectInputs): DerivedVars {
  // Dimensions mode
  let areaConstruida: number;
  let largura: number;
  let comprimento: number;

  if (inputs.dimensoesModo === 'LxC') {
    largura = inputs.largura_m;
    comprimento = inputs.comprimento_m;
    areaConstruida = largura * comprimento;
  } else {
    // AREA mode
    areaConstruida = inputs.areaConstruida_m2;
    const ratio = inputs.proporcaoLC > 0 ? inputs.proporcaoLC : 1;
    largura = Math.sqrt(areaConstruida * ratio);
    comprimento = largura > 0 ? areaConstruida / largura : 0;
  }

  const perimetroExterno = 2 * (largura + comprimento);
  const perimetroInterno = perimetroExterno * inputs.fatorParedesInternas;
  const perimetroTotal = perimetroExterno + perimetroInterno;

  const areaParedeExternaBruta = perimetroExterno * inputs.peDireito_m;
  const areaParedeExternaLiquida = areaParedeExternaBruta * (1 - inputs.percVaosExternos_pct / 100);
  const areaParedeInterna1Face = perimetroInterno * inputs.peDireito_m;
  const areaParedeInterna2Faces = areaParedeInterna1Face * 2 * (1 - inputs.percPortasInternas_pct / 100);

  const areaVaranda = inputs.areaVaranda_m2;
  const areaMolhadas = inputs.areaMolhadas_m2;
  const areaInterna = Math.max(0, areaConstruida - areaVaranda);
  const areaSeca = Math.max(0, areaInterna - areaMolhadas);
  const areaTeto = Math.max(0, areaConstruida - (inputs.areaTetoExcluiVaranda ? areaVaranda : 0));

  // Pé-direito duplo extra wall area
  const areaExtraParedesPDduplo = inputs.pedireitoDuplo_area_m2 * Math.max(0, inputs.pedireitoDuplo_altura_m - inputs.peDireito_m);

  // Ceramic wall coverage
  let areaRevestimentoCeramicoParede: number;
  if (inputs.areaRevestParedeOverride_m2 > 0) {
    areaRevestimentoCeramicoParede = inputs.areaRevestParedeOverride_m2;
  } else {
    const areaRevest = (inputs.numBanheiros * 12) + (Math.max(0, areaMolhadas - inputs.numBanheiros * 4) * 0.9);
    areaRevestimentoCeramicoParede = areaRevest * (inputs.alturaRevestParede_m / 1.5);
  }

  // Roof
  const fatorTelhado = inputs.tipoCobertura === 'laje impermeabilizada' ? 1.0 : 1.15;
  const areaTelhado = areaConstruida * fatorTelhado;

  // Coverage type flags
  const isFibro = inputs.tipoCobertura === 'fibrocimento' ? 1 : 0;
  const isCeram = inputs.tipoCobertura === 'cerâmica' ? 1 : 0;
  const isLaje = inputs.tipoCobertura === 'laje impermeabilizada' ? 1 : 0;

  // Muro
  const m = inputs.muro;
  const perimetroMuro = m.frente + m.fundos + m.ladoDir + m.ladoEsq;
  const areaMuro = perimetroMuro * m.altura;
  const fatorFaceReboco = m.rebocar === 'SIM' ? 1 : m.rebocar === 'FORA' ? 0.5 : 0;
  const fatorFacePintura = m.pintar === 'SIM' ? 1 : m.pintar === 'FORA' ? 0.5 : 0;
  const portaoGaragem = m.portaoGaragem ? 1 : 0;
  const portaoPedestre = m.portaoPedestre ? 1 : 0;

  // Piscina
  const p = inputs.piscina;
  const areaPiscina = p.largura * p.comprimento;
  const perimetroPiscina = 2 * (p.largura + p.comprimento);
  const volumePiscina = areaPiscina * p.profundidade;
  const areaRevestPiscina = areaPiscina + (perimetroPiscina * p.profundidade * 2);
  const temPiscina = (areaPiscina > 0 && p.profundidade > 0) ? 1 : 0;
  const casaMaquinas = p.casaMaquinas ? 1 : 0;

  // Pintura externa flags
  const isPinturaAcrilica = inputs.tipoPinturaExterna === 'ACRILICA' ? 1 : 0;
  const isPinturaTextura = inputs.tipoPinturaExterna === 'TEXTURA' ? 1 : 0;

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
    // Muro
    perimetroMuro,
    areaMuro,
    fatorFaceReboco,
    fatorFacePintura,
    portaoGaragem,
    portaoPedestre,
    // Piscina
    areaPiscina,
    perimetroPiscina,
    volumePiscina,
    areaRevestPiscina,
    temPiscina,
    casaMaquinas,
    // Advanced
    areaExtraParedesPDduplo,
    isPinturaAcrilica,
    isPinturaTextura,
    // Legacy aliases
    perimetro: perimetroExterno,
    areaParede: areaParedeExternaLiquida,
    areaParedeInterna: areaParedeInterna2Faces,
    areaRevestimentoCeramico: areaRevestimentoCeramicoParede,
  };
}
