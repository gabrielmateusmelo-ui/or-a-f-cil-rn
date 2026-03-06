import { useState, useMemo } from 'react';
import { ProjectInputs, derive, safeComodos, PrecosInputs } from '@/lib/derive';
import { calcBudget } from '@/lib/calcBudget';
import { calcMaterials } from '@/lib/calcMaterials';
import { calcLabor, LaborRole } from '@/lib/calcLabor';
import { calcTotals, Summary } from '@/lib/calcTotals';
import defaultInputsRaw from '@/model/defaultInputs.json';
import sinapiBaseline from '@/model/sinapiBaseline_RN_202412.json';
import ParamsForm from '@/components/ParamsForm';
import KPICards from '@/components/KPICards';
import ServicesTable from '@/components/ServicesTable';
import MaterialsTable from '@/components/MaterialsTable';
import LaborTable from '@/components/LaborTable';
import DebugPanel from '@/components/DebugPanel';

type Tab = 'com' | 'sem' | 'materiais' | 'equipe';

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;
  const result = { ...target };
  for (const key of Object.keys(target)) {
    if (key in source) {
      if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      result[key] = source[key];
    }
  }
  return result;
}

function hasOverrides(inputs: ProjectInputs): boolean {
  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
  if (precos.usarPrecosInsumos && Object.keys(precos.insumos).length > 0) return true;
  if (precos.usarPrecosMaoObraHH && Object.keys(precos.maoObraHH).length > 0) return true;
  return false;
}

function buildLaborRolesFromOverrides(inputs: ProjectInputs): Record<string, LaborRole> | undefined {
  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
  if (!precos.usarPrecosMaoObraHH) return undefined;

  const moEntries = sinapiBaseline.maoObraHH as Record<string, { label: string; unit: string; value: number }>;
  const roles: Record<string, LaborRole> = {};
  // Map SINAPI keys to laborRoles keys
  const keyMap: Record<string, string> = {
    PEDREIRO: 'pedreiro', SERVENTE: 'servente', ARMADOR: 'armador',
    CARPINTEIRO: 'carpinteiro', PINTOR: 'pintor', AZULEJISTA: 'azulejista',
    ELETRICISTA: 'eletricista', ENCANADOR: 'encanador',
  };
  for (const [sinapiKey, entry] of Object.entries(moEntries)) {
    const roleKey = keyMap[sinapiKey] ?? sinapiKey.toLowerCase();
    const overrideVal = precos.maoObraHH[sinapiKey];
    roles[roleKey] = {
      descricao: entry.label.replace(/ \(R\$\/h\)/, ''),
      custoHH: overrideVal !== undefined ? overrideVal : entry.value,
    };
  }
  return roles;
}

const Index = () => {
  const [inputs, setInputs] = useState<ProjectInputs>(() => {
    return deepMerge(defaultInputsRaw, {}) as ProjectInputs;
  });
  const [activeTab, setActiveTab] = useState<Tab>('com');
  const [hideZero, setHideZero] = useState(true);
  const [search, setSearch] = useState('');
  const [modoTotal, setModoTotal] = useState<'BASELINE' | 'DINAMICO'>('BASELINE');

  const derived = useMemo(() => derive(inputs), [inputs]);
  const result = useMemo(() => calcBudget(inputs, derived), [inputs, derived]);
  const materials = useMemo(() => calcMaterials(result.items, inputs), [result.items, inputs]);

  const laborRolesOverride = useMemo(() => buildLaborRolesFromOverrides(inputs), [inputs]);
  const labor = useMemo(() => calcLabor(result.items, laborRolesOverride), [result.items, laborRolesOverride]);

  const bdiRate = result.bdiPct;
  const area = derived.areaConstruida;

  const summaryBaseline = useMemo(
    () => calcTotals(result, materials, labor, bdiRate, area, 'BASELINE'),
    [result, materials, labor, bdiRate, area]
  );
  const summaryDinamico = useMemo(
    () => calcTotals(result, materials, labor, bdiRate, area, 'DINAMICO'),
    [result, materials, labor, bdiRate, area]
  );

  const hasDynOverrides = hasOverrides(inputs);

  // Auto-switch to DINAMICO when overrides exist
  const effectiveModo = hasDynOverrides ? modoTotal : 'BASELINE';

  const tipoCasaLabel = inputs.tipoCasa === 'TERREA_SUBSOLO_1PAV' ? 'Térrea + Subsolo + 1 Pav.'
    : inputs.tipoCasa === 'TERREA_SUBSOLO' ? 'Térrea + Subsolo' : 'Casa térrea';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'com', label: 'Serviços c/ Material' },
    { key: 'sem', label: 'Serviços s/ Material' },
    { key: 'materiais', label: 'Materiais' },
    { key: 'equipe', label: 'Equipe (HH)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Simulador de Orçamentos – RN</h1>
            <p className="text-xs opacity-75">{tipoCasaLabel} · Região: Rio Grande do Norte</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <aside className="lg:w-80 shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-sm font-bold text-foreground mb-3">Parâmetros do Projeto</h2>
              <ParamsForm inputs={inputs} onChange={setInputs} />
            </div>
          </aside>

          <main className="flex-1 space-y-4 min-w-0">
            <KPICards
              baseline={summaryBaseline}
              dinamico={summaryDinamico}
              modo={effectiveModo}
              onModoChange={setModoTotal}
              hasDynamicOverrides={hasDynOverrides}
            />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-border overflow-hidden">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === t.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {(activeTab === 'com' || activeTab === 'sem') && (
                <>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="rounded border-input" />
                    Ocultar zerados
                  </label>
                  <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="ml-auto rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
                  />
                </>
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-1">
              {activeTab === 'com' && <ServicesTable items={result.items} byGroup={result.byGroup} hideZero={hideZero} search={search} mode="com" />}
              {activeTab === 'sem' && <ServicesTable items={result.items} byGroup={result.byGroup} hideZero={hideZero} search={search} mode="sem" />}
              {activeTab === 'materiais' && <MaterialsTable materials={materials} search={search} />}
              {activeTab === 'equipe' && <LaborTable labor={labor} />}
            </div>

            <DebugPanel inputs={inputs} derived={derived} result={result} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
