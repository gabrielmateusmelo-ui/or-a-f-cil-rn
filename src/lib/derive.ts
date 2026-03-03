export interface MuroFaceConfig {
  interna: boolean;
  externa: boolean;
}

export interface MuroAcabamentoTrechos {
  frente: MuroFaceConfig;
  laterais: MuroFaceConfig;
  fundo: MuroFaceConfig;
}

export interface MuroAcabamentos {
  chapisco: MuroAcabamentoTrechos;
  reboco: MuroAcabamentoTrechos;
  pintura: MuroAcabamentoTrechos;
}

const defaultMuroFace = (): MuroFaceConfig => ({ interna: false, externa: false });
const defaultMuroTrechos = (): MuroAcabamentoTrechos => ({
  frente: defaultMuroFace(),
  laterais: defaultMuroFace(),
  fundo: defaultMuroFace(),
});

export const defaultMuroAcabamentos = (): MuroAcabamentos => ({
  chapisco: defaultMuroTrechos(),
  reboco: defaultMuroTrechos(),
  pintura: defaultMuroTrechos(),
});

export interface MuroInputs {
  frente: number;
  fundos: number;
  ladoDir: number;
  ladoEsq: number;
  altura: number;
  acabamentos: MuroAcabamentos;
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
  dimensoesModo: 'AREA' | 'LxC';
  proporcaoLC: number;
  muro: MuroInputs;
  piscina: PiscinaInputs;
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
  areaMuroFrente1Face: number;
  areaMuroLaterais1Face: number;
  areaMuroFundo1Face: number;
  areaMuroChapisco_m2: number;
  areaMuroReboco_m2: number;
  areaMuroPintura_m2: number;
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
  // Legacy muro aliases (keep for backward compat)
  fatorFaceReboco: number;
  fatorFacePintura: number;
  [key: string]: number;
}

function safeMuroAcabamentos(m: any): MuroAcabamentos {
  const defaults = defaultMuroAcabamentos();
  if (!m || typeof m !== 'object') return defaults;
  const result: any = {};
  for (const tipo of ['chapisco', 'reboco', 'pintura'] as const) {
    result[tipo] = {};
    for (const trecho of ['frente', 'laterais', 'fundo'] as const) {
      result[tipo][trecho] = {
        interna: m[tipo]?.[trecho]?.interna ?? defaults[tipo][trecho].interna,
        externa: m[tipo]?.[trecho]?.externa ?? defaults[tipo][trecho].externa,
      };
    }
  }
  return result as MuroAcabamentos;
}

function calcMuroAcabArea(
  acabTrechos: MuroAcabamentoTrechos,
  areaFrente: number,
  areaLaterais: number,
  areaFundo: number,
): number {
  const faceCount = (fc: MuroFaceConfig) => (fc.interna ? 1 : 0) + (fc.externa ? 1 : 0);
  return (
    areaFrente * faceCount(acabTrechos.frente) +
    areaLaterais * faceCount(acabTrechos.laterais) +
    areaFundo * faceCount(acabTrechos.fundo)
  );
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

  const isFibro = inputs.tipoCobertura === 'fibrocimento' ? 1 : 0;
  const isCeram = inputs.tipoCobertura === 'cerâmica' ? 1 : 0;
  const isLaje = inputs.tipoCobertura === 'laje impermeabilizada' ? 1 : 0;

  // Muro - with safe deep merge
  const m = inputs.muro || {} as any;
  const frente = m.frente || 0;
  const fundos = m.fundos || 0;
  const ladoDir = m.ladoDir || 0;
  const ladoEsq = m.ladoEsq || 0;
  const altMuro = m.altura || 0;

  const areaMuroFrente1Face = frente * altMuro;
  const areaMuroLaterais1Face = (ladoDir + ladoEsq) * altMuro;
  const areaMuroFundo1Face = fundos * altMuro;
  const perimetroMuro = frente + fundos + ladoDir + ladoEsq;
  const areaMuro = perimetroMuro * altMuro;

  const acabamentos = safeMuroAcabamentos(m.acabamentos);

  const areaMuroChapisco_m2 = calcMuroAcabArea(acabamentos.chapisco, areaMuroFrente1Face, areaMuroLaterais1Face, areaMuroFundo1Face);
  const areaMuroReboco_m2 = calcMuroAcabArea(acabamentos.reboco, areaMuroFrente1Face, areaMuroLaterais1Face, areaMuroFundo1Face);
  const areaMuroPintura_m2 = calcMuroAcabArea(acabamentos.pintura, areaMuroFrente1Face, areaMuroLaterais1Face, areaMuroFundo1Face);

  const portaoGaragem = m.portaoGaragem ? 1 : 0;
  const portaoPedestre = m.portaoPedestre ? 1 : 0;

  // Piscina
  const p = inputs.piscina || {} as any;
  const areaPiscina = (p.largura || 0) * (p.comprimento || 0);
  const perimetroPiscina = 2 * ((p.largura || 0) + (p.comprimento || 0));
  const volumePiscina = areaPiscina * (p.profundidade || 0);
  const areaRevestPiscina = areaPiscina + (perimetroPiscina * (p.profundidade || 0) * 2);
  const temPiscina = (areaPiscina > 0 && (p.profundidade || 0) > 0) ? 1 : 0;
  const casaMaquinas = p.casaMaquinas ? 1 : 0;

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
    areaMuroFrente1Face,
    areaMuroLaterais1Face,
    areaMuroFundo1Face,
    areaMuroChapisco_m2,
    areaMuroReboco_m2,
    areaMuroPintura_m2,
    portaoGaragem,
    portaoPedestre,
    // Legacy muro (backward compat)
    fatorFaceReboco: 0,
    fatorFacePintura: 0,
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
