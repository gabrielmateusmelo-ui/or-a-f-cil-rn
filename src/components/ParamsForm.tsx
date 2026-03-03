import { ProjectInputs, MuroInputs, PiscinaInputs } from '@/lib/derive';
import { derive } from '@/lib/derive';
import { useMemo } from 'react';

interface Props {
  inputs: ProjectInputs;
  onChange: (inputs: ProjectInputs) => void;
}

const InputField = ({ label, value, onChange, type = 'number', min, step, suffix, fullSpan, readOnly }: {
  label: string; value: number | string; onChange: (v: any) => void;
  type?: string; min?: number; step?: number; suffix?: string; fullSpan?: boolean; readOnly?: boolean;
}) => (
  <div className={`space-y-1 ${fullSpan ? 'col-span-2' : ''}`}>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
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

const SelectField = ({ label, value, options, onChange, fullSpan }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; fullSpan?: boolean;
}) => (
  <div className={`space-y-1 ${fullSpan ? 'col-span-2' : ''}`}>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <label className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer py-1">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-input" />
    {label}
  </label>
);

export default function ParamsForm({ inputs, onChange }: Props) {
  const set = <K extends keyof ProjectInputs>(key: K, val: ProjectInputs[K]) =>
    onChange({ ...inputs, [key]: val });

  const setPerdas = (key: string, val: number) =>
    onChange({ ...inputs, perdas: { ...inputs.perdas, [key]: val } });

  const setMuro = <K extends keyof MuroInputs>(key: K, val: MuroInputs[K]) =>
    onChange({ ...inputs, muro: { ...inputs.muro, [key]: val } });

  const setPiscina = <K extends keyof PiscinaInputs>(key: K, val: PiscinaInputs[K]) =>
    onChange({ ...inputs, piscina: { ...inputs.piscina, [key]: val } });

  // Compute derived for read-only display
  const derived = useMemo(() => derive(inputs), [inputs]);

  const isAreaMode = inputs.dimensoesModo === 'AREA';

  return (
    <div className="space-y-5">
      <Section title="📐 Dimensões">
        <SelectField label="Modo" value={inputs.dimensoesModo} onChange={(v) => set('dimensoesModo', v as any)} fullSpan
          options={[
            { value: 'AREA', label: 'Por Área' },
            { value: 'LxC', label: 'Por L × C' },
          ]}
        />
        {isAreaMode ? (
          <>
            <InputField label="Área construída" value={inputs.areaConstruida_m2} onChange={(v) => set('areaConstruida_m2', v)} suffix="m²" min={1} step={1} />
            <InputField label="Proporção L/C" value={inputs.proporcaoLC} onChange={(v) => set('proporcaoLC', v)} step={0.1} min={0.1} />
            <InputField label="Largura (calc.)" value={derived.largura.toFixed(2)} onChange={() => {}} suffix="m" readOnly />
            <InputField label="Comprimento (calc.)" value={derived.comprimento.toFixed(2)} onChange={() => {}} suffix="m" readOnly />
          </>
        ) : (
          <>
            <InputField label="Largura" value={inputs.largura_m} onChange={(v) => set('largura_m', v)} suffix="m" step={0.5} />
            <InputField label="Comprimento" value={inputs.comprimento_m} onChange={(v) => set('comprimento_m', v)} suffix="m" step={0.5} />
            <InputField label="Área (calc.)" value={derived.areaConstruida.toFixed(2)} onChange={() => {}} suffix="m²" readOnly fullSpan />
          </>
        )}
        <InputField label="Pé-direito" value={inputs.peDireito_m} onChange={(v) => set('peDireito_m', v)} suffix="m" step={0.1} />
      </Section>

      <Section title="🏠 Áreas e Cômodos">
        <InputField label="Áreas molhadas" value={inputs.areaMolhadas_m2} onChange={(v) => set('areaMolhadas_m2', v)} suffix="m²" />
        <InputField label="Varanda" value={inputs.areaVaranda_m2} onChange={(v) => set('areaVaranda_m2', v)} suffix="m²" />
        <InputField label="Calçada" value={inputs.areaCalcada_m2} onChange={(v) => set('areaCalcada_m2', v)} suffix="m²" />
        <InputField label="Banheiros" value={inputs.numBanheiros} onChange={(v) => set('numBanheiros', v)} min={1} step={1} />
        <InputField label="Quartos" value={inputs.numQuartos} onChange={(v) => set('numQuartos', v)} min={1} step={1} />
      </Section>

      <Section title="🏗️ Especificações">
        <SelectField label="Tipo de cobertura" value={inputs.tipoCobertura} onChange={(v) => set('tipoCobertura', v as any)}
          options={[
            { value: 'fibrocimento', label: 'Fibrocimento' },
            { value: 'cerâmica', label: 'Cerâmica' },
            { value: 'laje impermeabilizada', label: 'Laje impermeabilizada' },
          ]}
        />
        <SelectField label="Padrão" value={inputs.padrao} onChange={(v) => set('padrao', v as any)}
          options={[
            { value: 'Baixo', label: 'Baixo' },
            { value: 'Médio', label: 'Médio' },
            { value: 'Alto', label: 'Alto' },
          ]}
        />
      </Section>

      <Section title="🧱 Paredes e Revestimento">
        <InputField label="Fator paredes internas" value={inputs.fatorParedesInternas} onChange={(v) => set('fatorParedesInternas', v)} step={0.05} />
        <InputField label="Vãos externos" value={inputs.percVaosExternos_pct} onChange={(v) => set('percVaosExternos_pct', v)} suffix="%" step={1} />
        <InputField label="Portas internas" value={inputs.percPortasInternas_pct} onChange={(v) => set('percPortasInternas_pct', v)} suffix="%" step={1} />
        <InputField label="Altura revest. parede" value={inputs.alturaRevestParede_m} onChange={(v) => set('alturaRevestParede_m', v)} suffix="m" step={0.1} />
        <InputField label="Override revest. (0=auto)" value={inputs.areaRevestParedeOverride_m2} onChange={(v) => set('areaRevestParedeOverride_m2', v)} suffix="m²" />
        <CheckboxField label="Teto exclui varanda" checked={inputs.areaTetoExcluiVaranda} onChange={(v) => set('areaTetoExcluiVaranda', v)} />
      </Section>

      <Section title="🔧 Avançado">
        <InputField label="PD duplo – área" value={inputs.pedireitoDuplo_area_m2} onChange={(v) => set('pedireitoDuplo_area_m2', v)} suffix="m²" />
        <InputField label="PD duplo – altura" value={inputs.pedireitoDuplo_altura_m} onChange={(v) => set('pedireitoDuplo_altura_m', v)} suffix="m" step={0.1} />
        <SelectField label="Pintura externa" value={inputs.tipoPinturaExterna} onChange={(v) => set('tipoPinturaExterna', v as any)} fullSpan
          options={[
            { value: 'ACRILICA', label: 'Acrílica' },
            { value: 'TEXTURA', label: 'Textura' },
          ]}
        />
      </Section>

      <Section title="💰 BDI">
        <SelectField label="Modo" value={inputs.bdiModo} onChange={(v) => set('bdiModo', v as any)}
          options={[
            { value: 'automatico', label: 'Automático (por padrão)' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        {inputs.bdiModo === 'manual' && (
          <InputField label="BDI Manual" value={inputs.bdiManual_pct} onChange={(v) => set('bdiManual_pct', v)} suffix="%" step={1} fullSpan />
        )}
      </Section>

      <Section title="📉 Perdas">
        <InputField label="Cerâmica" value={inputs.perdas.ceramica_pct} onChange={(v) => setPerdas('ceramica_pct', v)} suffix="%" />
        <InputField label="Argamassa" value={inputs.perdas.argamassa_pct} onChange={(v) => setPerdas('argamassa_pct', v)} suffix="%" />
        <InputField label="Tinta" value={inputs.perdas.tinta_pct} onChange={(v) => setPerdas('tinta_pct', v)} suffix="%" />
        <InputField label="Concreto" value={inputs.perdas.concreto_pct} onChange={(v) => setPerdas('concreto_pct', v)} suffix="%" />
        <InputField label="Aço" value={inputs.perdas.aco_pct} onChange={(v) => setPerdas('aco_pct', v)} suffix="%" />
        <InputField label="Blocos" value={inputs.perdas.blocos_pct} onChange={(v) => setPerdas('blocos_pct', v)} suffix="%" />
        <InputField label="Telha" value={inputs.perdas.telha_pct} onChange={(v) => setPerdas('telha_pct', v)} suffix="%" />
      </Section>

      <Section title="🧱 Muro">
        <InputField label="Frente" value={inputs.muro.frente} onChange={(v) => setMuro('frente', v)} suffix="m" />
        <InputField label="Fundos" value={inputs.muro.fundos} onChange={(v) => setMuro('fundos', v)} suffix="m" />
        <InputField label="Lado Dir." value={inputs.muro.ladoDir} onChange={(v) => setMuro('ladoDir', v)} suffix="m" />
        <InputField label="Lado Esq." value={inputs.muro.ladoEsq} onChange={(v) => setMuro('ladoEsq', v)} suffix="m" />
        <InputField label="Altura" value={inputs.muro.altura} onChange={(v) => setMuro('altura', v)} suffix="m" step={0.1} />
        <SelectField label="Rebocar" value={inputs.muro.rebocar} onChange={(v) => setMuro('rebocar', v as any)}
          options={[
            { value: 'NAO', label: 'Não' },
            { value: 'SIM', label: 'Sim (2 faces)' },
            { value: 'FORA', label: 'Só fora (1 face)' },
          ]}
        />
        <SelectField label="Pintar" value={inputs.muro.pintar} onChange={(v) => setMuro('pintar', v as any)}
          options={[
            { value: 'NAO', label: 'Não' },
            { value: 'SIM', label: 'Sim (2 faces)' },
            { value: 'FORA', label: 'Só fora (1 face)' },
          ]}
        />
        <CheckboxField label="Portão garagem" checked={inputs.muro.portaoGaragem} onChange={(v) => setMuro('portaoGaragem', v)} />
        <CheckboxField label="Portão pedestre" checked={inputs.muro.portaoPedestre} onChange={(v) => setMuro('portaoPedestre', v)} />
      </Section>

      <Section title="🏊 Piscina">
        <InputField label="Largura" value={inputs.piscina.largura} onChange={(v) => setPiscina('largura', v)} suffix="m" step={0.5} />
        <InputField label="Comprimento" value={inputs.piscina.comprimento} onChange={(v) => setPiscina('comprimento', v)} suffix="m" step={0.5} />
        <InputField label="Profundidade" value={inputs.piscina.profundidade} onChange={(v) => setPiscina('profundidade', v)} suffix="m" step={0.1} />
        <SelectField label="Revestimento" value={inputs.piscina.revest} onChange={(v) => setPiscina('revest', v as any)}
          options={[
            { value: 'CERAMICA', label: 'Cerâmica' },
            { value: 'VINIL', label: 'Vinil' },
          ]}
        />
        <CheckboxField label="Casa de máquinas" checked={inputs.piscina.casaMaquinas} onChange={(v) => setPiscina('casaMaquinas', v)} />
      </Section>
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
