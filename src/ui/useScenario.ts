import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SCENARIO, cloneScenario,
  type AreaId, type Equipment, type Market, type Options, type PhyCommon, type Scenario, type ServiceArea,
} from '../engine';

const STORAGE_KEY = 'planificacion5g.scenario.v1';

function load(): Scenario {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // almacenamiento no disponible o contenido corrupto: se usa el escenario por defecto
  }
  return cloneScenario(DEFAULT_SCENARIO);
}

/** Completa con valores por defecto los campos que falten en un escenario guardado o importado. */
export function migrate(input: Partial<Scenario>): Scenario {
  const d = cloneScenario(DEFAULT_SCENARIO);
  return {
    name: input.name ?? d.name,
    equipment: { ...d.equipment, ...input.equipment },
    phy: { ...d.phy, ...input.phy, interferenceMarginDb: { ...d.phy.interferenceMarginDb, ...input.phy?.interferenceMarginDb } },
    areas: d.areas.map((da) => ({ ...da, ...input.areas?.find((a) => a.id === da.id) })),
    market: { ...d.market, ...input.market, classes: input.market?.classes ?? d.market.classes },
    options: { ...d.options, ...input.options },
  };
}

export function useScenario() {
  const [scenario, setScenario] = useState<Scenario>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
    } catch {
      // sin persistencia: la aplicación sigue funcionando en memoria
    }
  }, [scenario]);

  const updateArea = useCallback((id: AreaId, patch: Partial<ServiceArea>) => {
    setScenario((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }, []);
  const updateEquipment = useCallback((patch: Partial<Equipment>) => {
    setScenario((s) => ({ ...s, equipment: { ...s.equipment, ...patch } }));
  }, []);
  const updatePhy = useCallback((patch: Partial<PhyCommon>) => {
    setScenario((s) => ({ ...s, phy: { ...s.phy, ...patch } }));
  }, []);
  const updateMarket = useCallback((patch: Partial<Market>) => {
    setScenario((s) => ({ ...s, market: { ...s.market, ...patch } }));
  }, []);
  const updateOptions = useCallback((patch: Partial<Options>) => {
    setScenario((s) => ({ ...s, options: { ...s.options, ...patch } }));
  }, []);
  const reset = useCallback(() => setScenario(cloneScenario(DEFAULT_SCENARIO)), []);
  const replace = useCallback((s: Partial<Scenario>) => setScenario(migrate(s)), []);

  return { scenario, updateArea, updateEquipment, updatePhy, updateMarket, updateOptions, reset, replace };
}

export type ScenarioApi = ReturnType<typeof useScenario>;
