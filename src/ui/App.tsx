import { useMemo, useRef, useState } from 'react';
import { computeScenario, type AreaId } from '../engine';
import { AreaPicker } from './AreaPicker';
import { GuideTab } from './GuideTab';
import { LinkTab } from './LinkTab';
import { PhyTab } from './PhyTab';
import { SitesTab } from './SitesTab';
import { useScenario } from './useScenario';

type TabId = 'guide' | 'phy' | 'link' | 'sites';

const TABS: { id: TabId; label: string }[] = [
  { id: 'guide', label: 'Guía' },
  { id: 'phy', label: 'Capa física y throughput' },
  { id: 'link', label: 'Balance de enlace' },
  { id: 'sites', label: 'Emplazamientos' },
];

export function App() {
  const api = useScenario();
  const result = useMemo(() => computeScenario(api.scenario), [api.scenario]);
  const [tab, setTab] = useState<TabId>('guide');
  const [areaId, setAreaId] = useState<AreaId>('denseUrban');
  const fileInput = useRef<HTMLInputElement>(null);
  const areaResult = result.areas.find((a) => a.area.id === areaId) ?? result.areas[0];

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(api.scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'escenario-5g.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      api.replace(JSON.parse(await file.text()));
    } catch {
      alert('El fichero no contiene un escenario válido.');
    }
  };

  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1>Planificación 5G</h1>
          <p className="subtitle">Dimensionado de la red de acceso radio 5G NR</p>
        </div>
        <div className="actions">
          <button onClick={exportJson}>Exportar</button>
          <button onClick={() => fileInput.current?.click()}>Importar</button>
          <button
            onClick={() => {
              if (confirm('¿Restaurar el escenario del artículo? Se perderán los cambios.')) api.reset();
            }}
          >
            Restaurar
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {(tab === 'phy' || tab === 'link') && (
        <AreaPicker areas={api.scenario.areas} value={areaId} onChange={setAreaId} />
      )}

      <main>
        {tab === 'guide' && <GuideTab />}
        {tab === 'phy' && <PhyTab api={api} result={areaResult} />}
        {tab === 'link' && <LinkTab api={api} result={areaResult} />}
        {tab === 'sites' && <SitesTab api={api} result={result} />}
      </main>

      <footer className="app-foot">
        Basado en 5G-RAND (Wong y Chuah, 2023) · 3GPP TS 38.214, TS 38.101, TR 38.901
      </footer>
    </div>
  );
}
