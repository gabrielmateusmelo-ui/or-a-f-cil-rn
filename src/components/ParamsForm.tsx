import { ProjectInputs, MuroInputs, MuroAcabamentos, PiscinaInputs, Comodos, ComodoEntry, defaultMuroAcabamentos, safeComodos } from '@/lib/derive';
import { useMemo } from 'react';
import { derive } from '@/lib/derive';
import React from 'react';
import LabelWithHelp from '@/components/LabelWithHelp';

interface Props {
  inputs: ProjectInputs;
  onChange: (inputs: ProjectInputs) => void;
}

const InputField = ({ label, value, onChange, type = 'number', min, step, suffix, fullSpan, readOnly, help }: {
  label: string; value: number | string; onChange: (v: any) => void;
  type?: string; min?: number; step?: number; suffix?: string; fullSpan?: boolean; readOnly?: boolean; help?: string;
}) => (
  <div className={`space-y-1 ${fullSpan ? 'col-span-2' : ''}`}>
    <label className="text-xs font-medium text-muted-foreground">
      {help ? <LabelWithHelp label={label} help={help} /> : label}
    </label>
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        min={min}
        step={step}
        readOnly={readOnly}
        className={`w-full rounded-md border border-input px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring ${readOnly ? 'bg-muted text-muted-foreground' : 'bg-card'}`}
      />
      {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
    </div>
  </div>
);

const SelectField = ({ label, value, options, onChange, fullSpan, help }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; fullSpan?: boolean; help?: string;
}) => (
  <div className={`space-y-1 ${fullSpan ? 'col-span-2' : ''}`}>
    <label className="text-xs font-medium text-muted-foreground">
      {help ? <LabelWithHelp label={label} help={help} /> : label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ label, checked, onChange, help }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; help?: string;
}) => (
  <label className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer py-1">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-input" />
    {help ? <LabelWithHelp label={label} help={help} /> : label}
  </label>
);

function MuroAcabamentoGrid({ acabamentos, onChange }: {
  acabamentos: MuroAcabamentos;
  onChange: (a: MuroAcabamentos) => void;
}) {
  const trechos = ['frente', 'laterais', 'fundo'] as const;
  const tipos = ['chapisco', 'reboco', 'pintura'] as const;

  const toggle = (tipo: typeof tipos[number], trecho: typeof trechos[number], face: 'interna' | 'externa') => {
    const updated = JSON.parse(JSON.stringify(acabamentos)) as MuroAcabamentos;
    updated[tipo][trecho][face] = !updated[tipo][trecho][face];
    onChange(updated);
  };

  return (
    <div className="col-span-2 mt-1">
      <p className="text-xs font-medium text-muted-foreground mb-1">Acabamentos por trecho/face</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 pr-1 text-muted-foreground font-medium"></th>
              {trechos.map(t => (
                <th key={t} colSpan={2} className="text-center py-1 px-0.5 text-muted-foreground font-medium capitalize">{t}</th>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th className="text-left py-0.5 pr-1 text-muted-foreground"></th>
              {trechos.map(t => (
                <React.Fragment key={t}>
                  <th className="text-center py-0.5 px-0.5 text-muted-foreground font-normal">Int</th>
                  <th className="text-center py-0.5 px-0.5 text-muted-foreground font-normal">Ext</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {tipos.map(tipo => (
              <tr key={tipo} className="border-b border-border/50">
                <td className="py-1 pr-1 text-muted-foreground capitalize font-medium">{tipo}</td>
                {trechos.map(trecho => (
                  <React.Fragment key={trecho}>
                    <td className="text-center py-1 px-0.5">
                      <input type="checkbox" checked={acabamentos[tipo][trecho].interna} onChange={() => toggle(tipo, trecho, 'interna')} className="rounded border-input h-3 w-3" />
                    </td>
                    <td className="text-center py-1 px-0.5">
                      <input type="checkbox" checked={acabamentos[tipo][trecho].externa} onChange={() => toggle(tipo, trecho, 'externa')} className="rounded border-input h-3 w-3" />
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const COMODO_LABELS: Record<keyof Comodos, string> = {
  quartos: 'Quartos',
  banheiros: 'Banheiros',
  lavabos: 'Lavabos',
  cozinha: 'Cozinha',
  sala: 'Sala',
  jantar: 'Jantar',
  servico: 'Serviço',
  circulacao: 'Circulação',
  varanda: 'Varanda',
  garagem: 'Garagem',
  gourmet: 'Gourmet',
};

const COMODO_KEYS = Object.keys(COMODO_LABELS) as (keyof Comodos)[];

// SINAPI insumo entries for UI
const SINAPI_INSUMOS = Object.entries(sinapiBaseline.insumos) as [string, { label: string; unit: string; value: number }][];
const SINAPI_MO = Object.entries(sinapiBaseline.maoObraHH) as [string, { label: string; unit: string; value: number }][];

export default function ParamsForm({ inputs, onChange }: Props) {
  const set = <K extends keyof ProjectInputs>(key: K, val: ProjectInputs[K]) =>
    onChange({ ...inputs, [key]: val });

  const setPerdas = (key: string, val: number) =>
    onChange({ ...inputs, perdas: { ...inputs.perdas, [key]: val } });

  const setMuro = <K extends keyof MuroInputs>(key: K, val: MuroInputs[K]) =>
    onChange({ ...inputs, muro: { ...inputs.muro, [key]: val } });

  const setPiscina = <K extends keyof PiscinaInputs>(key: K, val: PiscinaInputs[K]) =>
    onChange({ ...inputs, piscina: { ...inputs.piscina, [key]: val } });

  const comodos = safeComodos(inputs.comodos);

  const setComodo = (key: keyof Comodos, field: keyof ComodoEntry, val: number) => {
    const updated = { ...comodos, [key]: { ...comodos[key], [field]: val } };
    onChange({ ...inputs, comodos: updated });
  };

  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };

  const setPrecos = (p: Partial<PrecosInputs>) =>
    onChange({ ...inputs, precos: { ...precos, ...p } });

  const setInsumo = (key: string, val: number) =>
    setPrecos({ insumos: { ...precos.insumos, [key]: val } });

  const setMaoObraHH = (key: string, val: number) =>
    setPrecos({ maoObraHH: { ...precos.maoObraHH, [key]: val } });

  const getInsumoVal = (key: string, baseline: number) => precos.insumos[key] ?? baseline;
  const getMoVal = (key: string, baseline: number) => precos.maoObraHH[key] ?? baseline;

  const resetSinapi = () => {
    setPrecos({ insumos: {}, maoObraHH: {} });
  };

  const acabamentos: MuroAcabamentos = inputs.muro?.acabamentos ?? defaultMuroAcabamentos();

  const derived = useMemo(() => derive(inputs), [inputs]);

  const isAreaMode = inputs.dimensoesModo === 'AREA';
  const tipoCasa = inputs.tipoCasa || 'TERREA';
  const temSubsolo = tipoCasa === 'TERREA_SUBSOLO' || tipoCasa === 'TERREA_SUBSOLO_1PAV';
  const temPavSup = tipoCasa === 'TERREA_SUBSOLO_1PAV';

  const somaComodos = derived.somaAreasComodos;
  const diffPct = derived.areaConstruida > 0 ? Math.abs(somaComodos - derived.areaConstruida) / derived.areaConstruida * 100 : 0;

  let escadasAuto = 0;
  if (tipoCasa === 'TERREA_SUBSOLO') escadasAuto = 1;
  if (tipoCasa === 'TERREA_SUBSOLO_1PAV') escadasAuto = 2;

  const pdLocal = inputs.peDireitoDuploLocal || 'NENHUM';

  const [precosOpen, setPrecosOpen] = React.useState(false);

  return (
    <div className="space-y-5">
      <Section title="📐 Dimensões">
        <SelectField label="Modo" value={inputs.dimensoesModo} onChange={(v) => set('dimensoesModo', v as any)} fullSpan
          help="Define se a área é informada diretamente ou calculada por Largura × Comprimento."
          options={[
            { value: 'AREA', label: 'Por Área' },
            { value: 'LxC', label: 'Por L × C' },
          ]}
        />
        {isAreaMode ? (
          <>
            <InputField label="Área construída" value={inputs.areaConstruida_m2} onChange={(v) => set('areaConstruida_m2', v)} suffix="m²" min={1} step={1}
              help="Área construída total do projeto (m²). Afeta quase todos os itens do orçamento." />
            <InputField label="Proporção L/C" value={inputs.proporcaoLC} onChange={(v) => set('proporcaoLC', v)} step={0.1} min={0.1}
              help="Proporção Largura/Comprimento para calcular perímetro e paredes." />
            <InputField label="Largura (calc.)" value={derived.largura.toFixed(2)} onChange={() => {}} suffix="m" readOnly />
            <InputField label="Comprimento (calc.)" value={derived.comprimento.toFixed(2)} onChange={() => {}} suffix="m" readOnly />
          </>
        ) : (
          <>
            <InputField label="Largura" value={inputs.largura_m} onChange={(v) => set('largura_m', v)} suffix="m" step={0.5}
              help="Largura da construção (m). Junto com comprimento, define área e perímetro." />
            <InputField label="Comprimento" value={inputs.comprimento_m} onChange={(v) => set('comprimento_m', v)} suffix="m" step={0.5}
              help="Comprimento da construção (m)." />
            <InputField label="Área (calc.)" value={derived.areaConstruida.toFixed(2)} onChange={() => {}} suffix="m²" readOnly fullSpan />
          </>
        )}
        <InputField label="Pé-direito" value={inputs.peDireito_m} onChange={(v) => set('peDireito_m', v)} suffix="m" step={0.1}
          help="Altura livre entre piso e teto (m). Afeta áreas de parede e volume de pintura/revestimento." />
      </Section>

      <Section title="🏠 Tipo de Casa">
        <SelectField label="Tipologia" value={tipoCasa} onChange={(v) => set('tipoCasa', v as any)} fullSpan
          help="Define a quantidade de pavimentos. Afeta implantação, cobertura, escadas e itens de subsolo."
          options={[
            { value: 'TERREA', label: 'Térrea' },
            { value: 'TERREA_SUBSOLO', label: 'Térrea + Subsolo' },
            { value: 'TERREA_SUBSOLO_1PAV', label: 'Térrea + Subsolo + 1 Pav.' },
          ]}
        />
        {temSubsolo && (
          <>
            <InputField label="Área subsolo (0=auto)" value={inputs.areaSubsolo_m2 || 0} onChange={(v) => set('areaSubsolo_m2', v)} suffix="m²"
              help="Área do subsolo. Se 0, é calculada automaticamente a partir da área construída." />
            <InputField label="Altura subsolo" value={inputs.alturaSubsolo_m || 2.6} onChange={(v) => set('alturaSubsolo_m', v)} suffix="m" step={0.1}
              help="Pé-direito do subsolo (m). Afeta volume de escavação e impermeabilização." />
            <CheckboxField label="Subsolo acabado (pisos/pintura)" checked={inputs.subsoloAcabado !== false} onChange={(v) => set('subsoloAcabado', v)}
              help="Se marcado, subsolo recebe pisos e pintura. Se não, entra apenas como estrutura." />
          </>
        )}
        {temPavSup && (
          <InputField label="Área pav. superior (0=auto)" value={inputs.areaPavSuperior_m2 || 0} onChange={(v) => set('areaPavSuperior_m2', v)} suffix="m²"
            help="Área do pavimento superior. Se 0, é dividida proporcionalmente." />
        )}
        {tipoCasa !== 'TERREA' && (
          <>
            <InputField label="Terreo (calc.)" value={derived.areaTerreo_m2.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />
            {temSubsolo && <InputField label="Subsolo (eff)" value={derived.areaSubsolo_m2_eff.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />}
            {temPavSup && <InputField label="Pav.Sup (eff)" value={derived.areaPavSuperior_m2_eff.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />}
          </>
        )}
        <InputField label={`Escadas (0=auto=${escadasAuto})`} value={inputs.qtdEscadas || 0} onChange={(v) => set('qtdEscadas', v)} min={0} step={1}
          help="Quantidade de escadas. Se 0, calcula automaticamente pelo tipo de casa." />
      </Section>

      <Section title="🛏️ Cômodos e Áreas">
        <div className="col-span-2">
          <div className="grid grid-cols-[1fr_50px_70px] gap-1 text-[10px] text-muted-foreground font-medium mb-1">
            <span>Cômodo</span><span className="text-center">Qtd</span><span className="text-center">Área (m²)</span>
          </div>
          {COMODO_KEYS.map(key => (
            <div key={key} className="grid grid-cols-[1fr_50px_70px] gap-1 items-center mb-0.5">
              <span className="text-xs text-foreground">{COMODO_LABELS[key]}</span>
              <input type="number" min={0} step={1} value={comodos[key].qtd}
                onChange={(e) => setComodo(key, 'qtd', parseInt(e.target.value) || 0)}
                className="w-full rounded border border-input bg-card px-1.5 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input type="number" min={0} step={1} value={comodos[key].areaTotal_m2}
                onChange={(e) => setComodo(key, 'areaTotal_m2', parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-input bg-card px-1.5 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2 text-[10px]">
            <span className="text-muted-foreground">Soma: <strong className="text-foreground">{somaComodos.toFixed(1)} m²</strong></span>
            <span className="text-muted-foreground">vs Área: <strong className="text-foreground">{derived.areaConstruida.toFixed(1)} m²</strong></span>
            {diffPct > 15 && <span className="text-destructive font-medium">⚠ Diferença {diffPct.toFixed(0)}%</span>}
          </div>
        </div>
      </Section>

      <Section title="🏗️ Especificações">
        <SelectField label="Tipo de cobertura" value={inputs.tipoCobertura} onChange={(v) => set('tipoCobertura', v as any)}
          help="Tipo de cobertura. Afeta custo de telhado, estrutura e se inclui impermeabilização de laje."
          options={[
            { value: 'fibrocimento', label: 'Fibrocimento' },
            { value: 'cerâmica', label: 'Cerâmica' },
            { value: 'laje impermeabilizada', label: 'Laje impermeabilizada' },
          ]}
        />
        <SelectField label="Padrão" value={inputs.padrao} onChange={(v) => set('padrao', v as any)}
          help="Padrão de acabamento. Aplica multiplicadores nos custos de material por grupo (acabamento, esquadrias, etc.) e no BDI automático."
          options={[
            { value: 'Baixo', label: 'Baixo' },
            { value: 'Médio', label: 'Médio' },
            { value: 'Alto', label: 'Alto' },
          ]}
        />
      </Section>

      <Section title="🧱 Paredes e Revestimento">
        <InputField label="Fator paredes internas" value={inputs.fatorParedesInternas} onChange={(v) => set('fatorParedesInternas', v)} step={0.05}
          help="Proporção do perímetro interno em relação ao externo. Maior valor = mais paredes internas." />
        <InputField label="Vãos externos" value={inputs.percVaosExternos_pct} onChange={(v) => set('percVaosExternos_pct', v)} suffix="%"
          help="Percentual de vãos (portas/janelas) nas paredes externas." />
        <InputField label="Portas internas" value={inputs.percPortasInternas_pct} onChange={(v) => set('percPortasInternas_pct', v)} suffix="%"
          help="Percentual de vãos nas paredes internas (portas)." />
        <InputField label="Altura revest. parede" value={inputs.alturaRevestParede_m} onChange={(v) => set('alturaRevestParede_m', v)} suffix="m" step={0.1}
          help="Altura do revestimento cerâmico em áreas molhadas (m)." />
        <InputField label="Override revest. (0=auto)" value={inputs.areaRevestParedeOverride_m2} onChange={(v) => set('areaRevestParedeOverride_m2', v)} suffix="m²"
          help="Se > 0, substitui o cálculo automático de área de revestimento cerâmico." />
        <InputField label="Revest. parede (calc.)" value={derived.areaRevestParedeMolhada_m2.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />
        <CheckboxField label="Teto exclui varanda" checked={inputs.areaTetoExcluiVaranda} onChange={(v) => set('areaTetoExcluiVaranda', v)}
          help="Se marcado, a área de teto (forro/pintura) não inclui a varanda." />
      </Section>

      <Section title="🔧 Avançado">
        <SelectField label="PD duplo – local" value={pdLocal} onChange={(v) => set('peDireitoDuploLocal', v as any)} fullSpan
          help="Onde há pé-direito duplo. Adiciona área extra de parede para pintura/revestimento."
          options={[
            { value: 'NENHUM', label: 'Nenhum' },
            { value: 'SALA', label: 'Sala' },
            { value: 'COZINHA', label: 'Cozinha' },
            { value: 'SALA_E_COZINHA', label: 'Sala e Cozinha' },
          ]}
        />
        {pdLocal !== 'NENHUM' && (
          <>
            <InputField label="Altura PD duplo" value={inputs.alturaPeDireitoDuplo_m || 0} onChange={(v) => set('alturaPeDireitoDuplo_m', v)} suffix="m" step={0.1}
              help="Altura total do pé-direito duplo (m). A diferença em relação ao PD padrão gera área extra." />
            <InputField label="Área PD (0=auto)" value={inputs.areaPeDireitoDuplo_m2 || 0} onChange={(v) => set('areaPeDireitoDuplo_m2', v)} suffix="m²"
              help="Área em planta do PD duplo. Se 0, usa a área dos cômodos selecionados." />
            <InputField label="Área PD (calc.)" value={derived.areaExtraParedesPDduplo.toFixed(1)} onChange={() => {}} suffix="m² extra" readOnly fullSpan />
          </>
        )}
        <SelectField label="Pintura externa" value={inputs.tipoPinturaExterna} onChange={(v) => set('tipoPinturaExterna', v as any)} fullSpan
          help="Tipo de pintura externa. Acrílica é mais comum; textura tem custo maior."
          options={[
            { value: 'ACRILICA', label: 'Acrílica' },
            { value: 'TEXTURA', label: 'Textura' },
          ]}
        />
      </Section>

      <Section title="📊 Áreas Calculadas">
        <InputField label="Calçada" value={inputs.areaCalcada_m2} onChange={(v) => set('areaCalcada_m2', v)} suffix="m²"
          help="Área de calçada em concreto ao redor da casa (m²)." />
        <InputField label="Á. molhadas (calc.)" value={derived.areaMolhadas.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />
        <InputField label="Á. seca (calc.)" value={derived.areaSeca.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />
        <InputField label="Á. varanda (calc.)" value={derived.areaVaranda.toFixed(1)} onChange={() => {}} suffix="m²" readOnly />
        <InputField label="Pontos elétricos" value={derived.pontosEletricos} onChange={() => {}} readOnly
          help="Calculado automaticamente com base na área e quantidade de cômodos." />
        <InputField label="Pontos hidráulicos" value={derived.pontosHidraulicos} onChange={() => {}} readOnly
          help="Calculado pela quantidade de banheiros, lavabos, cozinha e área de serviço." />
      </Section>

      <Section title="💰 BDI">
        <SelectField label="Modo" value={inputs.bdiModo} onChange={(v) => set('bdiModo', v as any)}
          help="Automático calcula o BDI pelo padrão da obra. Manual permite definir o percentual."
          options={[
            { value: 'automatico', label: 'Automático (por padrão)' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        {inputs.bdiModo === 'manual' && (
          <InputField label="BDI Manual" value={inputs.bdiManual_pct} onChange={(v) => set('bdiManual_pct', v)} suffix="%" step={1} fullSpan
            help="Percentual de BDI aplicado sobre o custo direto total." />
        )}
      </Section>

      <Section title="📉 Perdas">
        <InputField label="Cerâmica" value={inputs.perdas.ceramica_pct} onChange={(v) => setPerdas('ceramica_pct', v)} suffix="%"
          help="Perda de cerâmica (%). Aplicada na lista de materiais." />
        <InputField label="Argamassa" value={inputs.perdas.argamassa_pct} onChange={(v) => setPerdas('argamassa_pct', v)} suffix="%"
          help="Perda de argamassa (%)." />
        <InputField label="Tinta" value={inputs.perdas.tinta_pct} onChange={(v) => setPerdas('tinta_pct', v)} suffix="%"
          help="Perda de tinta (%)." />
        <InputField label="Concreto" value={inputs.perdas.concreto_pct} onChange={(v) => setPerdas('concreto_pct', v)} suffix="%"
          help="Perda de concreto (%)." />
        <InputField label="Aço" value={inputs.perdas.aco_pct} onChange={(v) => setPerdas('aco_pct', v)} suffix="%"
          help="Perda de aço (%)." />
        <InputField label="Blocos" value={inputs.perdas.blocos_pct} onChange={(v) => setPerdas('blocos_pct', v)} suffix="%"
          help="Perda de blocos/tijolos (%)." />
        <InputField label="Telha" value={inputs.perdas.telha_pct} onChange={(v) => setPerdas('telha_pct', v)} suffix="%"
          help="Perda de telhas (%)." />
        <InputField label="Impermeab." value={inputs.perdas.impermeab_pct} onChange={(v) => setPerdas('impermeab_pct', v)} suffix="%"
          help="Perda de materiais de impermeabilização (%)." />
      </Section>

      <Section title="🧱 Muro">
        <InputField label="Frente" value={inputs.muro.frente} onChange={(v) => setMuro('frente', v)} suffix="m"
          help="Comprimento do muro de frente (m)." />
        <InputField label="Fundos" value={inputs.muro.fundos} onChange={(v) => setMuro('fundos', v)} suffix="m"
          help="Comprimento do muro de fundos (m)." />
        <InputField label="Lado Dir." value={inputs.muro.ladoDir} onChange={(v) => setMuro('ladoDir', v)} suffix="m" />
        <InputField label="Lado Esq." value={inputs.muro.ladoEsq} onChange={(v) => setMuro('ladoEsq', v)} suffix="m" />
        <InputField label="Altura" value={inputs.muro.altura} onChange={(v) => setMuro('altura', v)} suffix="m" step={0.1}
          help="Altura do muro (m). Afeta área de alvenaria e acabamentos." />
        <MuroAcabamentoGrid acabamentos={acabamentos} onChange={(a) => setMuro('acabamentos', a)} />
        <CheckboxField label="Portão garagem" checked={inputs.muro.portaoGaragem} onChange={(v) => setMuro('portaoGaragem', v)} />
        <CheckboxField label="Portão pedestre" checked={inputs.muro.portaoPedestre} onChange={(v) => setMuro('portaoPedestre', v)} />
      </Section>

      <Section title="🏊 Piscina">
        <InputField label="Largura" value={inputs.piscina.largura} onChange={(v) => setPiscina('largura', v)} suffix="m" step={0.5}
          help="Largura da piscina (m). Se 0, piscina não é incluída." />
        <InputField label="Comprimento" value={inputs.piscina.comprimento} onChange={(v) => setPiscina('comprimento', v)} suffix="m" step={0.5} />
        <InputField label="Profundidade" value={inputs.piscina.profundidade} onChange={(v) => setPiscina('profundidade', v)} suffix="m" step={0.1}
          help="Profundidade da piscina (m). Afeta volume de escavação e concreto." />
        <SelectField label="Revestimento" value={inputs.piscina.revest} onChange={(v) => setPiscina('revest', v as any)}
          options={[
            { value: 'CERAMICA', label: 'Cerâmica' },
            { value: 'VINIL', label: 'Vinil' },
          ]}
        />
        <CheckboxField label="Casa de máquinas" checked={inputs.piscina.casaMaquinas} onChange={(v) => setPiscina('casaMaquinas', v)} />
      </Section>

      {/* SINAPI Prices Section */}
      <div>
        <button
          onClick={() => setPrecosOpen(!precosOpen)}
          className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors"
        >
          <span>💲 Preços (SINAPI RN – editável)</span>
          <span className="text-xs text-muted-foreground">{precosOpen ? '▲' : '▼'}</span>
        </button>
        {precosOpen && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <CheckboxField label="Usar preços de insumos" checked={precos.usarPrecosInsumos} onChange={(v) => setPrecos({ usarPrecosInsumos: v })}
                help="Se marcado, o custo de material dos serviços é recalculado pelos coeficientes × preço unitário informado abaixo." />
              <CheckboxField label="Usar custos HH (MO)" checked={precos.usarPrecosMaoObraHH} onChange={(v) => setPrecos({ usarPrecosMaoObraHH: v })}
                help="Se marcado, o custo de mão de obra é recalculado via HH estimadas × custo horário informado." />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Insumos (R$/unidade)</p>
              <div className="space-y-1">
                {SINAPI_INSUMOS.map(([key, entry]) => (
                  <div key={key} className="grid grid-cols-[1fr_80px] gap-1 items-center">
                    <span className="text-[11px] text-foreground truncate">{entry.label}</span>
                    <input type="number" min={0} step={0.01} value={getInsumoVal(key, entry.value)}
                      onChange={(e) => setInsumo(key, parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-input bg-card px-1.5 py-1 text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Mão de obra (R$/h)</p>
              <div className="space-y-1">
                {SINAPI_MO.map(([key, entry]) => (
                  <div key={key} className="grid grid-cols-[1fr_80px] gap-1 items-center">
                    <span className="text-[11px] text-foreground truncate">{entry.label}</span>
                    <input type="number" min={0} step={0.5} value={getMoVal(key, entry.value)}
                      onChange={(e) => setMaoObraHH(key, parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-input bg-card px-1.5 py-1 text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={resetSinapi}
              className="w-full text-xs text-center py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">
              Restaurar SINAPI (baseline)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}
