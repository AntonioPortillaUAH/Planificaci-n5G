// Balance de enlace UL/DL, radios de celda y throughput medio por emplazamiento (método 5G-RAND).

import { carrierTable, type CarrierResult, type McsRow } from './phy';
import { cellRadius, type PropagationParams } from './propagation';
import type { AntennaType, Equipment, PhyCommon, ServiceArea } from './types';

/** Superficie de un emplazamiento hexagonal en función del radio de celda: A = K·R² */
export const SITE_AREA_FACTOR: Record<AntennaType, number> = { omni: 2.6, tri: 1.95 };
export const SECTORS: Record<AntennaType, number> = { omni: 1, tri: 3 };
export const ANTENNA_LABELS: Record<AntennaType, string> = { omni: 'Omnidireccional', tri: 'Trisectorial' };

export interface LinkRow {
  mcs: McsRow;
  maplDb: number;
  radiusKm: number;
  outOfRange: boolean;
  siteAreaKm2: number;
  /** Superficie del anillo servido por esta MCS */
  ringAreaKm2: number;
  /** Fracción del emplazamiento servida por esta MCS */
  fraction: number;
  /** Throughput del emplazamiento con esta MCS (Mbps) */
  siteThroughputMbps: number;
}

export interface LinkResult {
  rows: LinkRow[];
  /** Throughput medio por emplazamiento (Mbps) */
  averageSiteThroughputMbps: number;
  maxRadiusKm: number;
  maxSiteAreaKm2: number;
}

export interface AreaLinkBudget {
  ulCarrier: CarrierResult;
  dlCarrier: CarrierResult;
  ul: LinkResult;
  dl: LinkResult;
  ulEirpDbm: number;
  dlEirpDbm: number;
  totalLossesDb: number;
  /** Radio de cobertura (máximo radio UL) */
  coverageRadiusKm: number;
  coverageSiteAreaKm2: number;
  /** MAPL y radio de cada MCS DL (usados para emparejar UL↔DL) */
  dlCandidates: { mcs: McsRow; maplDb: number; radiusKm: number; outOfRange: boolean }[];
  errors: string[];
  warnings: string[];
}

export const propagationParams = (a: ServiceArea): PropagationParams => ({
  model: a.propagationModel,
  frequencyGHz: a.frequencyGHz,
  gnbHeightM: a.gnbHeightM,
  ueHeightM: a.ueHeightM,
  streetWidthM: a.streetWidthM,
  buildingHeightM: a.buildingHeightM,
  nlosWithLosBound: a.nlosWithLosBound,
});

export const totalLossesDb = (a: ServiceArea): number =>
  a.foliageLossDb + a.bodyLossDb + a.rainMarginDb + a.fadingMarginDb + a.penetrationLossDb;

/** Reparte el emplazamiento en anillos concéntricos y pondera el throughput de cada MCS. */
function ringsAndAverage(
  items: { mcs: McsRow; maplDb: number; radiusKm: number; outOfRange: boolean }[],
  area: ServiceArea,
  multiplyBySectors: boolean,
): LinkResult {
  const k = SITE_AREA_FACTOR[area.antenna];
  const sectors = multiplyBySectors ? SECTORS[area.antenna] : 1;
  const maxRadiusKm = Math.max(0, ...items.map((i) => i.radiusKm));
  const maxSiteAreaKm2 = k * maxRadiusKm ** 2;
  // Los anillos se calculan en orden creciente de radio; el orden de presentación se conserva.
  const order = items.map((_, i) => i).sort((a, b) => items[a].radiusKm - items[b].radiusKm);
  const ring = new Array<number>(items.length).fill(0);
  let inner = 0;
  for (const i of order) {
    const areaI = k * items[i].radiusKm ** 2;
    ring[i] = Math.max(0, areaI - inner);
    inner = Math.max(inner, areaI);
  }
  const rows = items.map((it, i): LinkRow => {
    const fraction = maxSiteAreaKm2 > 0 ? ring[i] / maxSiteAreaKm2 : 0;
    return {
      ...it,
      siteAreaKm2: k * it.radiusKm ** 2,
      ringAreaKm2: ring[i],
      fraction,
      siteThroughputMbps: it.mcs.throughputMbps * sectors,
    };
  });
  const averageSiteThroughputMbps = rows.reduce((s, r) => s + r.fraction * r.siteThroughputMbps, 0);
  return { rows, averageSiteThroughputMbps, maxRadiusKm, maxSiteAreaKm2 };
}

export function areaLinkBudget(
  area: ServiceArea,
  eq: Equipment,
  phy: PhyCommon,
  multiplyBySectors: boolean,
): AreaLinkBudget {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tdd = area.duplex === 'TDD';
  const ulCarrier = carrierTable(
    {
      frequencyGHz: area.frequencyGHz, bandwidthMHz: area.bandwidthMHz, scsKHz: area.scsKHz,
      timeFraction: tdd ? 1 - area.tddDlRatio : 1, layers: area.ulLayers, noiseFigureDb: eq.gnbNoiseFigureDb,
    },
    area.ulMcsTable, phy,
  );
  const dlCarrier = carrierTable(
    {
      frequencyGHz: area.frequencyGHz, bandwidthMHz: area.bandwidthMHz, scsKHz: area.scsKHz,
      timeFraction: tdd ? area.tddDlRatio : 1, layers: area.dlLayers, noiseFigureDb: eq.ueNoiseFigureDb,
    },
    area.dlMcsTable, phy,
  );
  if (ulCarrier.error) errors.push(ulCarrier.error);

  const losses = totalLossesDb(area);
  const ulEirpDbm = eq.ueTxPowerDbm + eq.ueAntennaGainDbi - eq.ueCableLossDb;
  const dlEirpDbm = eq.gnbTxPowerDbm + eq.gnbAntennaGainDbi - eq.gnbCableLossDb;
  const ulRxGain = eq.gnbAntennaGainDbi - eq.gnbCableLossDb + area.diversityGainDb;
  const dlRxGain = eq.ueAntennaGainDbi - eq.ueCableLossDb + area.diversityGainDb;
  const prop = propagationParams(area);

  const withRadius = (mcs: McsRow, maplDb: number) => {
    const r = cellRadius(maplDb, prop);
    return { mcs, maplDb, radiusKm: r.radiusKm, outOfRange: r.outOfRange };
  };

  const ulItems = area.ulMcs
    .map((idx) => ulCarrier.rows.find((r) => r.index === idx))
    .filter((r): r is McsRow => !!r)
    .map((mcs) => withRadius(mcs, ulEirpDbm + ulRxGain - mcs.sensitivityDbm - losses));
  const ul = ringsAndAverage(ulItems, area, multiplyBySectors);

  const dlCandidates = dlCarrier.rows.map((mcs) =>
    withRadius(mcs, dlEirpDbm + dlRxGain - mcs.sensitivityDbm - losses),
  );
  // Para cada radio UL se elige la MCS DL cuyo radio es el más próximo (5G-RAND §3.4).
  const dlItems = ul.rows.map((u) => {
    let best = dlCandidates[0];
    for (const c of dlCandidates) {
      if (Math.abs(c.radiusKm - u.radiusKm) < Math.abs(best.radiusKm - u.radiusKm)) best = c;
    }
    return best;
  });
  const dl = dlItems.length
    ? ringsAndAverage(dlItems, area, multiplyBySectors)
    : { rows: [], averageSiteThroughputMbps: 0, maxRadiusKm: 0, maxSiteAreaKm2: 0 };

  if (ul.rows.some((r) => r.outOfRange) || dl.rows.some((r) => r.outOfRange)) {
    warnings.push('Algún radio queda fuera del rango de validez del modelo de propagación (10 m – 5 km).');
  }
  if (ul.rows.length && ul.maxRadiusKm === 0) {
    errors.push('El MAPL UL es insuficiente incluso a 1 m: revise potencias, ganancias y pérdidas.');
  }

  return {
    ulCarrier, dlCarrier, ul, dl, ulEirpDbm, dlEirpDbm, totalLossesDb: losses,
    coverageRadiusKm: ul.maxRadiusKm,
    coverageSiteAreaKm2: ul.maxSiteAreaKm2,
    dlCandidates, errors, warnings,
  };
}
