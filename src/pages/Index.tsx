import { useState, useMemo } from 'react';
import { ProjectInputs, derive } from '@/lib/derive';
import { calcBudget } from '@/lib/calcBudget';
import { calcMaterials } from '@/lib/calcMaterials';
import { calcLabor } from '@/lib/calcLabor';
import defaultInputs from '@/model/defaultInputs.json';
import ParamsForm from '@/components/ParamsForm';
import KPICards from '@/components/KPICards';
import ServicesTable from '@/components/ServicesTable';
import MaterialsTable from '@/components/MaterialsTable';
import LaborTable from '@/components/LaborTable';
import DebugPanel from '@/components/DebugPanel';

type Tab = 'com' | 'sem' | 'materiais' | 'equipe';

const Index = () => {
  const [inputs, setInputs] = useState<ProjectInputs>(defaultInputs as ProjectInputs);
  const [activeTab, setActiveTab] = useState<Tab>('com');
  const [hideZero, setHideZero] = useState(true);
  const [search, setSearch] = useState('');

  const derived = useMemo(() => derive(inputs), [inputs]);
  const result = useMemo(() => calcBudget(inputs, derived), [inputs, derived]);
  const materials = useMemo(() => calcMaterials(result.items, inputs), [result.items, inputs]);
  const labor = useMemo(() => calcLabor(result.items), [result.items]);

  const exportJSON = () => {
    const data = { inputs, derived, result, materials, labor, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento_RN_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <p className="text-xs opacity-75">Casa térrea · Região: Rio Grande do Norte</p>
          </div>
          <button
            onClick={exportJSON}
            className="rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            📥 Exportar JSON
          </button>
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
            <KPICards result={result} />

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
                    <input
                      type="checkbox"
                      checked={hideZero}
                      onChange={(e) => setHideZero(e.target.checked)}
                      className="rounded border-input"
                    />
                    Ocultar zerados
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
