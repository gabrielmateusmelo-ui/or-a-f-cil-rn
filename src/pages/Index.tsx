import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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

function hasManualOverrides(inputs: ProjectInputs): boolean {
  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
  const hasInsumoOverrides = Object.values(precos.insumos).some(v => v !== undefined && v !== null);
  const hasHHOverrides = Object.values(precos.maoObraHH).some(v => v !== undefined && v !== null);
  return hasInsumoOverrides || hasHHOverrides;
}

const Index = () => {
  const [inputs, setInputs] = useState<ProjectInputs>(() => {
    return deepMerge(defaultInputsRaw, {}) as ProjectInputs;
  });
  const [activeTab, setActiveTab] = useState<Tab>('com');
  const [hideZero, setHideZero] = useState(true);
  const [search, setSearch] = useState('');
  const [modoTotal, setModoTotal] = useState<'BASELINE' | 'DINAMICO'>('BASELINE');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Track scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const precos: PrecosInputs = inputs.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };

  const setPrecos = useCallback((p: Partial<PrecosInputs>) => {
    setInputs(prev => ({ ...prev, precos: { ...(prev.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} }), ...p } }));
  }, []);

  const handleMaterialOverride = useCallback((materialId: string, value: number | null) => {
    setInputs(prev => {
      const cur = prev.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
      const newInsumos = { ...cur.insumos };
      if (value === null) {
        delete newInsumos[materialId];
      } else {
        newInsumos[materialId] = value;
      }
      return { ...prev, precos: { ...cur, insumos: newInsumos, usarPrecosInsumos: true } };
    });
  }, []);

  const clearMaterialOverrides = useCallback(() => {
    setPrecos({ insumos: {} });
  }, [setPrecos]);

  const handleLaborOverride = useCallback((roleKey: string, value: number | null) => {
    setInputs(prev => {
      const cur = prev.precos ?? { usarPrecosInsumos: false, usarPrecosMaoObraHH: false, insumos: {}, maoObraHH: {} };
      const newMO = { ...cur.maoObraHH };
      if (value === null) {
        delete newMO[roleKey];
      } else {
        newMO[roleKey] = value;
      }
      return { ...prev, precos: { ...cur, maoObraHH: newMO, usarPrecosMaoObraHH: true } };
    });
  }, []);

  const clearLaborOverrides = useCallback(() => {
    setPrecos({ maoObraHH: {} });
  }, [setPrecos]);

  const derived = useMemo(() => derive(inputs), [inputs]);
  const result = useMemo(() => calcBudget(inputs, derived), [inputs, derived]);
  const materials = useMemo(() => calcMaterials(result.items, inputs), [result.items, inputs]);
  const labor = useMemo(() => calcLabor(result.items), [result.items]);

  const bdiRate = result.bdiPct;
  const area = derived.areaConstruida;

  const summaryBaseline = useMemo(
    () => calcTotals(result, materials, labor, bdiRate, area, 'BASELINE'),
    [result, materials, labor, bdiRate, area]
  );

  const hasDynOverrides = hasManualOverrides(inputs);

  const summaryDinamico = useMemo(() => {
    if (!hasDynOverrides) return summaryBaseline;

    const matOverrides = precos.insumos;
    let materialDelta = 0;
    for (const m of materials) {
      if (matOverrides[m.materialId] !== undefined) {
        const manual = matOverrides[m.materialId];
        materialDelta += m.quantidade * (manual - m.precoBase);
      }
    }

    const moOverrides = precos.maoObraHH;
    const moBaselineData = sinapiBaseline.maoObraHH as Record<string, { value: number }>;
    let laborDelta = 0;
    for (const l of labor) {
      if (moOverrides[l.funcao] !== undefined) {
        const base = moBaselineData[l.funcao]?.value ?? l.custoHH;
        const manual = moOverrides[l.funcao];
        laborDelta += l.hhTotal * (manual - base);
      }
    }

    const refSubtotal = summaryBaseline.subtotalDireto;
    const dynSubtotal = refSubtotal + materialDelta + laborDelta;
    const bdiValorDyn = dynSubtotal * bdiRate;
    const totalFinalDyn = dynSubtotal + bdiValorDyn;

    return {
      subtotalDireto: dynSubtotal,
      totalMateriais: summaryBaseline.totalMateriais + materialDelta,
      totalMaoObra: summaryBaseline.totalMaoObra + laborDelta,
      bdiRate,
      bdiValor: bdiValorDyn,
      totalFinal: totalFinalDyn,
      valorM2: area > 0 ? totalFinalDyn / area : 0,
      fonte: 'DINAMICO' as const,
      avisos: [] as string[],
    };
  }, [summaryBaseline, materials, labor, precos, bdiRate, area, hasDynOverrides]);

  const effectiveModo = hasDynOverrides ? modoTotal : 'BASELINE';

  const tipoCasaLabel = inputs.tipoCasa === 'TERREA_SUBSOLO_1PAV' ? 'Térrea + Subsolo + 1 Pav.'
    : inputs.tipoCasa === 'TERREA_SUBSOLO' ? 'Térrea + Subsolo' : 'Casa térrea';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'com', label: 'Serviços c/ Material' },
    { key: 'sem', label: 'Serviços s/ Material' },
    { key: 'materiais', label: 'Materiais' },
    { key: 'equipe', label: 'Equipe (HH)' },
  ];

  const formContent = (
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-foreground mb-3">Parâmetros do Projeto</h2>
      <ParamsForm inputs={inputs} onChange={setInputs} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Simulador de Orçamentos – RN</h1>
            <p className="text-xs opacity-75">{tipoCasaLabel} · Região: Rio Grande do Norte</p>
          </div>
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="px-3 py-1.5 text-sm bg-primary-foreground/20 rounded-md hover:bg-primary-foreground/30 transition-colors">
                  ⚙ Parâmetros
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] overflow-y-auto">
                {formContent}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      <div className="container mx-auto py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {!isMobile && (
            <aside className="lg:w-80 shrink-0">
              <div className="bg-card rounded-lg border border-border p-4 sticky top-4 max-h-[90vh] overflow-y-auto">
                {formContent}
              </div>
            </aside>
          )}

          <main ref={mainRef} className="flex-1 space-y-4 min-w-0">
            <KPICards
              baseline={summaryBaseline}
              dinamico={summaryDinamico}
              modo={effectiveModo}
              onModoChange={setModoTotal}
              hasDynamicOverrides={hasDynOverrides}
            />

            {/* Tab selector */}
            {isMobile ? (
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as Tab)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {tabs.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex rounded-lg border border-border overflow-hidden w-fit">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setActiveTab(t.key); setSearch(''); }}
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
            )}

            <div className="bg-card rounded-lg border border-border p-1">
              {activeTab === 'com' && (
                <ServicesTable items={result.items} byGroup={result.byGroup} hideZero={hideZero} search={search} mode="com" bdiRate={bdiRate}
                  onHideZeroChange={setHideZero} onSearchChange={setSearch} />
              )}
              {activeTab === 'sem' && (
                <ServicesTable items={result.items} byGroup={result.byGroup} hideZero={hideZero} search={search} mode="sem" bdiRate={bdiRate}
                  onHideZeroChange={setHideZero} onSearchChange={setSearch} />
              )}
              {activeTab === 'materiais' && (
                <MaterialsTable
                  materials={materials}
                  search={search}
                  overrides={precos.insumos}
                  onOverrideChange={handleMaterialOverride}
                  onClearAll={clearMaterialOverrides}
                  usarPrecos={precos.usarPrecosInsumos}
                  onToggleUsarPrecos={(v) => setPrecos({ usarPrecosInsumos: v })}
                  onSearchChange={setSearch}
                />
              )}
              {activeTab === 'equipe' && (
                <LaborTable
                  labor={labor}
                  overrides={precos.maoObraHH}
                  onOverrideChange={handleLaborOverride}
                  onClearAll={clearLaborOverrides}
                  usarHH={precos.usarPrecosMaoObraHH}
                  onToggleUsarHH={(v) => setPrecos({ usarPrecosMaoObraHH: v })}
                  search={search}
                  onSearchChange={setSearch}
                />
              )}
            </div>

            <DebugPanel inputs={inputs} derived={derived} result={result} />
          </main>
        </div>
      </div>

      {/* Back to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Voltar ao topo"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default Index;
