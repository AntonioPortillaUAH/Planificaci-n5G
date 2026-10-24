// Recuento de emplazamientos por cobertura y por capacidad con previsión a 5 años.

import { areaLinkBudget, type AreaLinkBudget } from './linkBudget';
import { NUM_YEARS, type Market, type Scenario, type ServiceArea } from './types';

/** Consumo mensual medio por abonado (GB) según el reparto de clases */
export const averageGbPerSubscriber = (m: Market): number =>
  m.classes.reduce((s, c) => s + c.gbPerMonth * c.share, 0);

/**
 * Demanda DL por abonado en la hora cargada (Mbps):
 * el consumo mensual se reparte en (días · horas de uso) y se pondera por el factor de actividad.
 */
export const demandPerSubscriberMbps = (m: Market): number =>
  ((averageGbPerSubscriber(m) * 8000) / (m.daysPerMonth * m.hoursOfUsePerDay * 3600)) * m.activityFactor;

export const totalSubscribersYear1 = (m: Market): number =>
  m.totalPopulation * m.addressableMarket * m.marketShareYear1;

export interface YearResult {
  year: number;
  subscribers: number;
  demandMbps: number;
  coverageFraction: number;
  coveredAreaKm2: number;
  coverageSites: number;
  capacitySites: number;
  sites: number;
  limitedBy: 'cobertura' | 'capacidad';
}

export interface AreaResult {
  area: ServiceArea;
  link: AreaLinkBudget;
  years: YearResult[];
}

export interface ScenarioResult {
  areas: AreaResult[];
  avgGbPerSubscriber: number;
  demandPerSubscriberMbps: number;
  totalSubscribersYear1: number;
  totals: { year: number; coverageSites: number; capacitySites: number; sites: number; demandMbps: number; subscribers: number }[];
}

const safeCeil = (x: number) => (Number.isFinite(x) ? Math.ceil(x - 1e-9) : NaN);

export function computeScenario(s: Scenario): ScenarioResult {
  const subs1 = totalSubscribersYear1(s.market);
  const perSub = demandPerSubscriberMbps(s.market);

  const areas = s.areas.map((area): AreaResult => {
    const link = areaLinkBudget(area, s.equipment, s.phy, s.options.multiplyBySectors);
    const years: YearResult[] = [];
    let subscribers = subs1 * area.subscriberShare;
    for (let y = 0; y < NUM_YEARS; y++) {
      if (y > 0) subscribers *= 1 + (area.subscriberGrowth[y] ?? 0);
      const demandMbps = subscribers * perSub * (1 + s.market.annualTrafficGrowth) ** y;
      const coverageFraction = area.coverageRequirement[y] ?? 0;
      const coveredAreaKm2 = area.coverageAreaKm2 * coverageFraction;
      const coverageSites = link.coverageSiteAreaKm2 > 0 ? safeCeil(coveredAreaKm2 / link.coverageSiteAreaKm2) : NaN;
      const capacitySites =
        link.dl.averageSiteThroughputMbps > 0 ? safeCeil(demandMbps / link.dl.averageSiteThroughputMbps) : NaN;
      const sites = Math.max(coverageSites, capacitySites);
      years.push({
        year: y + 1, subscribers, demandMbps, coverageFraction, coveredAreaKm2,
        coverageSites, capacitySites, sites,
        limitedBy: capacitySites > coverageSites ? 'capacidad' : 'cobertura',
      });
    }
    return { area, link, years };
  });

  const totals = Array.from({ length: NUM_YEARS }, (_, y) => {
    const sum = (f: (r: YearResult) => number) => areas.reduce((acc, a) => acc + f(a.years[y]), 0);
    return {
      year: y + 1,
      coverageSites: sum((r) => r.coverageSites),
      capacitySites: sum((r) => r.capacitySites),
      sites: sum((r) => r.sites),
      demandMbps: sum((r) => r.demandMbps),
      subscribers: sum((r) => r.subscribers),
    };
  });

  return {
    areas,
    avgGbPerSubscriber: averageGbPerSubscriber(s.market),
    demandPerSubscriberMbps: perSub,
    totalSubscribersYear1: subs1,
    totals,
  };
}
