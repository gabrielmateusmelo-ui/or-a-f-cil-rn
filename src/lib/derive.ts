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

export interface ComodoEntry {
  qtd: number;
  areaTotal_m2: number;
}

export interface Comodos {
  quartos: ComodoEntry;
  banheiros: ComodoEntry;
  lavabos: ComodoEntry;
  cozinha: ComodoEntry;
  sala: ComodoEntry;
  jantar: ComodoEntry;
  servico: ComodoEntry;
  circulacao: ComodoEntry;
  varanda: ComodoEntry;
  garagem: ComodoEntry;
  gourmet: ComodoEntry;
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
    impermeab_pct: number;
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
  tipoCasa: 'TERREA' | 'TERREA_SUBSOLO' | 'TERREA_SUBSOLO_1PAV';
  areaSubsolo_m2: number;
  areaPavSuperior_m2: number;
  alturaSubsolo_m: number;
  subsoloAcabado: boolean;
  comodos: Comodos;
  peDireitoDuploLocal: 'NENHUM' | 'SALA' | 'COZINHA' | 'SALA_E_COZINHA';
  alturaPeDireitoDuplo_m: number;
  areaPeDireitoDuplo_m2: number;
  qtdEscadas: number;
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
  areaRevestParedeMolhada_m2: number;
  peDireito: number;
  numBanheiros: number;
  numQuartos: number;
  isFibro: number;
  isCeram: number;
  isLaje: number;
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
  areaPiscina: number;
  perimetroPiscina: number;
  volumePiscina: number;
  areaRevestPiscina: number;
  temPiscina: number;
  casaMaquinas: number;
  areaExtraParedesPDduplo: number;
  isPinturaAcrilica: number;
  isPinturaTextura: number;
  perimetro: number;
  areaParede: number;
  areaParedeInterna: number;
  areaRevestimentoCeramico: number;
  fatorFaceReboco: number;
  fatorFacePintura: number;
  // Pavimentos
  areaTerreo_m2: number;
  areaSubsolo_m2_eff: number;
  areaPavSuperior_m2_eff: number;
  areaImplantacao_m2: number;
  areaCoberturaBase_m2: number;
  temSubsolo: number;
  temPavSuperior: number;
  subsoloAcabado: number;
  alturaSubsolo_m: number;
  // Escadas
  qtdEscadasEfetiva: number;
  // Instalações por pontos
  pontosEletricos: number;
  pontosHidraulicos: number;
  // Soma cômodos
  somaAreasComodos: number;
  [key: string]: number;
}

const defaultComodoEntry = (): ComodoEntry => ({ qtd: 0, areaTotal_m2: 0 });

export function safeComodos(c: any): Comodos {
  const keys = ['quartos','banheiros','lavabos','cozinha','sala','jantar','servico','circulacao','varanda','garagem','gourmet'] as const;
  const result: any = {};
  for (const k of keys) {
    result[k] = {
      qtd: c?.[k]?.qtd ?? 0,
      areaTotal_m2: c?.[k]?.areaTotal_m2 ?? 0,
    };
  }
  return result as Comodos;
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
  // === Dimensões base ===
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

  // === Tipo de casa / pavimentos ===
  const tipoCasa = inputs.tipoCasa || 'TERREA';
  const temSubsoloFlag = tipoCasa === 'TERREA_SUBSOLO' || tipoCasa === 'TERREA_SUBSOLO_1PAV';
  const temPavSupFlag = tipoCasa === 'TERREA_SUBSOLO_1PAV';

  let areaSubsolo_m2_eff = 0;
  let areaPavSuperior_m2_eff = 0;
  let areaTerreo_m2 = areaConstruida;

  if (temSubsoloFlag) {
    areaSubsolo_m2_eff = (inputs.areaSubsolo_m2 || 0) > 0
      ? inputs.areaSubsolo_m2
      : (temPavSupFlag ? areaConstruida / 3 : areaConstruida / 2);
  }
  if (temPavSupFlag) {
    areaPavSuperior_m2_eff = (inputs.areaPavSuperior_m2 || 0) > 0
      ? inputs.areaPavSuperior_m2
      : areaConstruida / 3;
  }

  areaTerreo_m2 = areaConstruida - areaSubsolo_m2_eff - areaPavSuperior_m2_eff;
  // Clamp: normalize proportionally if negative
  if (areaTerreo_m2 < 0) {
    const totalParts = areaSubsolo_m2_eff + areaPavSuperior_m2_eff;
    if (totalParts > 0) {
      areaSubsolo_m2_eff = areaConstruida * (areaSubsolo_m2_eff / totalParts);
      areaPavSuperior_m2_eff = areaConstruida * (areaPavSuperior_m2_eff / totalParts);
    }
    areaTerreo_m2 = 0;
  }

  const areaImplantacao_m2 = Math.max(areaTerreo_m2, areaSubsolo_m2_eff);
  const areaCoberturaBase_m2 = temPavSupFlag ? areaPavSuperior_m2_eff : areaTerreo_m2;
  const alturaSubsolo_m = inputs.alturaSubsolo_m || 2.6;
  const subsoloAcabadoFlag = inputs.subsoloAcabado !== false;

  // === Escadas ===
  let qtdEscadasAuto = 0;
  if (tipoCasa === 'TERREA_SUBSOLO') qtdEscadasAuto = 1;
  if (tipoCasa === 'TERREA_SUBSOLO_1PAV') qtdEscadasAuto = 2;
  const qtdEscadasEfetiva = (inputs.qtdEscadas || 0) > 0 ? inputs.qtdEscadas : qtdEscadasAuto;

  // === Cômodos ===
  const comodos = safeComodos(inputs.comodos);
  const somaAreasComodos = Object.values(comodos).reduce((s, c) => s + (c.areaTotal_m2 || 0), 0);

  // Áreas derivadas de cômodos
  const areaVaranda = comodos.varanda.areaTotal_m2 > 0 ? comodos.varanda.areaTotal_m2 : (inputs.areaVaranda_m2 || 0);
  const areaMolhadas = comodos.banheiros.areaTotal_m2 + comodos.lavabos.areaTotal_m2
    + comodos.cozinha.areaTotal_m2 + comodos.servico.areaTotal_m2
    + (comodos.gourmet.areaTotal_m2 * 0.3);

  // Use comodos-derived if sum > 0, else fallback to legacy inputs
  const areaMolhadasEff = areaMolhadas > 0 ? areaMolhadas : (inputs.areaMolhadas_m2 || 0);
  const areaVarandaEff = areaVaranda;

  const perimetroExterno = 2 * (largura + comprimento);
  const perimetroInterno = perimetroExterno * inputs.fatorParedesInternas;
  const perimetroTotal = perimetroExterno + perimetroInterno;

  const areaParedeExternaBruta = perimetroExterno * inputs.peDireito_m;
  const areaParedeExternaLiquida = areaParedeExternaBruta * (1 - inputs.percVaosExternos_pct / 100);
  const areaParedeInterna1Face = perimetroInterno * inputs.peDireito_m;
  const areaParedeInterna2Faces = areaParedeInterna1Face * 2 * (1 - inputs.percPortasInternas_pct / 100);

  const areaInterna = Math.max(0, areaConstruida - areaVarandaEff);
  const areaSeca = Math.max(0, areaInterna - areaMolhadasEff);
  const areaTeto = Math.max(0, areaConstruida - (inputs.areaTetoExcluiVaranda ? areaVarandaEff : 0));

  // === Revestimento de parede molhada (rastreável) ===
  const altRevParede = inputs.alturaRevestParede_m || 1.5;
  let areaRevestParedeMolhada_m2 = 0;
  const tiposMolhados = [comodos.banheiros, comodos.lavabos, comodos.cozinha, comodos.servico] as const;
  for (const cm of tiposMolhados) {
    if (cm.qtd > 0 && cm.areaTotal_m2 > 0) {
      const areaMed = cm.areaTotal_m2 / cm.qtd;
      const perimAprox = 4 * Math.sqrt(areaMed);
      areaRevestParedeMolhada_m2 += perimAprox * altRevParede * cm.qtd;
    }
  }
  areaRevestParedeMolhada_m2 *= 0.9; // fator portas/vãos

  // Legacy override
  let areaRevestimentoCeramicoParede: number;
  if (inputs.areaRevestParedeOverride_m2 > 0) {
    areaRevestimentoCeramicoParede = inputs.areaRevestParedeOverride_m2;
  } else if (areaRevestParedeMolhada_m2 > 0) {
    areaRevestimentoCeramicoParede = areaRevestParedeMolhada_m2;
  } else {
    // Legacy fallback
    const numBanh = inputs.numBanheiros || 0;
    const areaRevest = (numBanh * 12) + (Math.max(0, areaMolhadasEff - numBanh * 4) * 0.9);
    areaRevestimentoCeramicoParede = areaRevest * (altRevParede / 1.5);
  }

  // === Pé-direito duplo ===
  const pdLocal = inputs.peDireitoDuploLocal || 'NENHUM';
  let areaPDduplo = inputs.areaPeDireitoDuplo_m2 || 0;
  if (areaPDduplo === 0 && pdLocal !== 'NENHUM') {
    if (pdLocal === 'SALA') areaPDduplo = comodos.sala.areaTotal_m2 + comodos.jantar.areaTotal_m2;
    else if (pdLocal === 'COZINHA') areaPDduplo = comodos.cozinha.areaTotal_m2;
    else if (pdLocal === 'SALA_E_COZINHA') areaPDduplo = comodos.sala.areaTotal_m2 + comodos.jantar.areaTotal_m2 + comodos.cozinha.areaTotal_m2;
  }
  const alturaPD = inputs.alturaPeDireitoDuplo_m || 0;
  const deltaH = Math.max(0, alturaPD - inputs.peDireito_m);
  const perimPD = areaPDduplo > 0 ? 4 * Math.sqrt(areaPDduplo) : 0;
  const areaExtraParedesPDduplo = perimPD * deltaH;

  // === Cobertura ===
  const fatorTelhado = inputs.tipoCobertura === 'laje impermeabilizada' ? 1.0 : 1.15;
  const areaTelhado = areaCoberturaBase_m2 * fatorTelhado;

  const isFibro = inputs.tipoCobertura === 'fibrocimento' ? 1 : 0;
  const isCeram = inputs.tipoCobertura === 'cerâmica' ? 1 : 0;
  const isLaje = inputs.tipoCobertura === 'laje impermeabilizada' ? 1 : 0;

  // === Instalações por pontos ===
  const pontosEletricos = Math.round(
    areaConstruida * 0.25 + comodos.quartos.qtd * 6 + comodos.banheiros.qtd * 4
    + comodos.cozinha.qtd * 8 + comodos.gourmet.qtd * 4
  );
  const pontosHidraulicos = Math.round(
    comodos.banheiros.qtd * 8 + comodos.lavabos.qtd * 4
    + comodos.cozinha.qtd * 6 + comodos.servico.qtd * 4 + 4
  );

  // === Muro ===
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

  // === Piscina ===
  const p = inputs.piscina || {} as any;
  const areaPiscina = (p.largura || 0) * (p.comprimento || 0);
  const perimetroPiscina = 2 * ((p.largura || 0) + (p.comprimento || 0));
  const volumePiscina = areaPiscina * (p.profundidade || 0);
  const areaRevestPiscina = areaPiscina + (perimetroPiscina * (p.profundidade || 0) * 2);
  const temPiscina = (areaPiscina > 0 && (p.profundidade || 0) > 0) ? 1 : 0;
  const casaMaquinas = p.casaMaquinas ? 1 : 0;

  const isPinturaAcrilica = inputs.tipoPinturaExterna === 'ACRILICA' ? 1 : 0;
  const isPinturaTextura = inputs.tipoPinturaExterna === 'TEXTURA' ? 1 : 0;

  const numBanheiros = comodos.banheiros.qtd > 0 ? comodos.banheiros.qtd + comodos.lavabos.qtd : inputs.numBanheiros;
  const numQuartos = comodos.quartos.qtd > 0 ? comodos.quartos.qtd : inputs.numQuartos;

  return {
    comprimento, largura,
    perimetroExterno, perimetroInterno, perimetroTotal,
    areaParedeExternaBruta, areaParedeExternaLiquida,
    areaParedeInterna1Face, areaParedeInterna2Faces,
    areaTelhado, areaTeto, areaConstruida,
    areaInterna, areaSeca, areaVaranda: areaVarandaEff,
    areaCalcada: inputs.areaCalcada_m2,
    areaMolhadas: areaMolhadasEff,
    areaRevestimentoCeramicoParede,
    areaRevestParedeMolhada_m2,
    peDireito: inputs.peDireito_m,
    numBanheiros, numQuartos,
    isFibro, isCeram, isLaje,
    perimetroMuro, areaMuro,
    areaMuroFrente1Face, areaMuroLaterais1Face, areaMuroFundo1Face,
    areaMuroChapisco_m2, areaMuroReboco_m2, areaMuroPintura_m2,
    portaoGaragem, portaoPedestre,
    fatorFaceReboco: 0, fatorFacePintura: 0,
    areaPiscina, perimetroPiscina, volumePiscina, areaRevestPiscina,
    temPiscina, casaMaquinas,
    areaExtraParedesPDduplo, isPinturaAcrilica, isPinturaTextura,
    perimetro: perimetroExterno,
    areaParede: areaParedeExternaLiquida,
    areaParedeInterna: areaParedeInterna2Faces,
    areaRevestimentoCeramico: areaRevestimentoCeramicoParede,
    // Pavimentos
    areaTerreo_m2,
    areaSubsolo_m2_eff,
    areaPavSuperior_m2_eff,
    areaImplantacao_m2,
    areaCoberturaBase_m2,
    temSubsolo: temSubsoloFlag ? 1 : 0,
    temPavSuperior: temPavSupFlag ? 1 : 0,
    subsoloAcabado: subsoloAcabadoFlag ? 1 : 0,
    alturaSubsolo_m,
    qtdEscadasEfetiva,
    pontosEletricos, pontosHidraulicos,
    somaAreasComodos,
  };
}
