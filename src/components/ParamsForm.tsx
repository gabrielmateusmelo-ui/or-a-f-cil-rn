import { ProjectInputs } from '@/lib/derive';

interface Props {
  inputs: ProjectInputs;
  onChange: (inputs: ProjectInputs) => void;
}

const InputField = ({ label, value, onChange, type = 'number', min, step, suffix }: {
  label: string; value: number | string; onChange: (v: any) => void;
  type?: string; min?: number; step?: number; suffix?: string;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        min={min}
        step={step}
        className="w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
    </div>
  </div>
);

const SelectField = ({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
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

export default function ParamsForm({ inputs, onChange }: Props) {
  const set = <K extends keyof ProjectInputs>(key: K, val: ProjectInputs[K]) =>
    onChange({ ...inputs, [key]: val });

  const setPerdas = (key: string, val: number) =>
    onChange({ ...inputs, perdas: { ...inputs.perdas, [key]: val } });

  return (
    <div className="space-y-5">
      <Section title="📐 Dimensões">
        <InputField label="Área construída" value={inputs.areaConstruida_m2} onChange={(v) => set('areaConstruida_m2', v)} suffix="m²" min={1} step={1} />
        <InputField label="Largura" value={inputs.largura_m} onChange={(v) => set('largura_m', v)} suffix="m" step={0.5} />
        <InputField label="Comprimento (0 = auto)" value={inputs.comprimento_m} onChange={(v) => set('comprimento_m', v)} suffix="m" step={0.5} />
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

      <Section title="💰 BDI">
        <SelectField label="Modo" value={inputs.bdiModo} onChange={(v) => set('bdiModo', v as any)}
          options={[
            { value: 'automatico', label: 'Automático (por padrão)' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        {inputs.bdiModo === 'manual' && (
          <InputField label="BDI Manual" value={inputs.bdiManual_pct} onChange={(v) => set('bdiManual_pct', v)} suffix="%" step={1} />
        )}
      </Section>

      <Section title="📉 Perdas">
        <InputField label="Cerâmica" value={inputs.perdas.ceramica_pct} onChange={(v) => setPerdas('ceramica_pct', v)} suffix="%" />
        <InputField label="Argamassa" value={inputs.perdas.argamassa_pct} onChange={(v) => setPerdas('argamassa_pct', v)} suffix="%" />
        <InputField label="Tinta" value={inputs.perdas.tinta_pct} onChange={(v) => setPerdas('tinta_pct', v)} suffix="%" />
        <InputField label="Concreto" value={inputs.perdas.concreto_pct} onChange={(v) => setPerdas('concreto_pct', v)} suffix="%" />
        <InputField label="Aço" value={inputs.perdas.aco_pct} onChange={(v) => setPerdas('aco_pct', v)} suffix="%" />
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
