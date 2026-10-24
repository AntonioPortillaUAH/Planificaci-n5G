// Escenario por defecto: parámetros de las Tablas 2 y 3 del artículo de Wong y Chuah (2023).
// Los valores que el artículo no publica (equipos, alturas, capas MIMO...) son supuestos típicos.

import { DEFAULT_INTERFERENCE_MARGIN } from './tables';
import type { Scenario, ServiceArea } from './types';

const commonLosses = {
  bodyLossDb: 3,
  rainMarginDb: 0,
  ueHeightM: 1.5,
  streetWidthM: 20,
  buildingHeightM: 5,
  nlosWithLosBound: true,
};

const areas: ServiceArea[] = [
  {
    id: 'denseUrban', name: 'Urbano denso',
    frequencyGHz: 28, duplex: 'TDD', bandwidthMHz: 50, scsKHz: 60, tddDlRatio: 0.75,
    ulLayers: 1, dlLayers: 2, ulMcsTable: 'qam256', dlMcsTable: 'qam256',
    propagationModel: 'UMi', gnbHeightM: 10,
    diversityGainDb: 6, foliageLossDb: 2, fadingMarginDb: 8, penetrationLossDb: 10,
    antenna: 'tri', ulMcs: [24, 19, 14, 9, 5, 2],
    coverageAreaKm2: 300, subscriberShare: 89700 / 390000,
    coverageRequirement: [0.7, 0.8, 0.9, 0.95, 1],
    subscriberGrowth: [0, 0.5, 0.1, 0.15, 0.05],
    ...commonLosses,
  },
  {
    id: 'urban', name: 'Urbano',
    frequencyGHz: 4.7, duplex: 'TDD', bandwidthMHz: 50, scsKHz: 60, tddDlRatio: 0.75,
    ulLayers: 1, dlLayers: 2, ulMcsTable: 'qam256', dlMcsTable: 'qam256',
    propagationModel: 'UMa', gnbHeightM: 25,
    diversityGainDb: 6, foliageLossDb: 4, fadingMarginDb: 8, penetrationLossDb: 10,
    antenna: 'tri', ulMcs: [24, 19, 14, 9, 5, 2],
    coverageAreaKm2: 1500, subscriberShare: 175500 / 390000,
    coverageRequirement: [0.6, 0.75, 0.85, 0.95, 1],
    subscriberGrowth: [0, 0.4, 0.2, 0.15, 0.05],
    ...commonLosses,
  },
  {
    id: 'suburban', name: 'Suburbano',
    frequencyGHz: 2.6, duplex: 'FDD', bandwidthMHz: 30, scsKHz: 30, tddDlRatio: 0.75,
    ulLayers: 1, dlLayers: 2, ulMcsTable: 'qam256', dlMcsTable: 'qam256',
    propagationModel: 'UMa', gnbHeightM: 30,
    diversityGainDb: 3, foliageLossDb: 6, fadingMarginDb: 8, penetrationLossDb: 8,
    antenna: 'tri', ulMcs: [19, 16, 13, 9, 6, 2],
    coverageAreaKm2: 3500, subscriberShare: 117000 / 390000,
    coverageRequirement: [0.5, 0.65, 0.75, 0.8, 0.85],
    subscriberGrowth: [0, 0.2, 0.15, 0.15, 0.1],
    ...commonLosses,
  },
  {
    id: 'rural', name: 'Rural',
    frequencyGHz: 0.7, duplex: 'FDD', bandwidthMHz: 30, scsKHz: 30, tddDlRatio: 0.75,
    ulLayers: 1, dlLayers: 2, ulMcsTable: 'qam256', dlMcsTable: 'qam256',
    propagationModel: 'RMa', gnbHeightM: 35,
    diversityGainDb: 3, foliageLossDb: 8, fadingMarginDb: 5, penetrationLossDb: 5,
    antenna: 'omni', ulMcs: [19, 17, 15, 13, 10, 7],
    coverageAreaKm2: 4700, subscriberShare: 7800 / 390000,
    coverageRequirement: [0.3, 0.45, 0.55, 0.6, 0.65],
    subscriberGrowth: [0, 0.1, 0.15, 0.1, 0.05],
    ...commonLosses,
  },
];

export const DEFAULT_SCENARIO: Scenario = {
  name: 'Escenario del artículo 5G-RAND (Tablas 2 y 3)',
  equipment: {
    gnbTxPowerDbm: 46,
    gnbAntennaGainDbi: 18,
    gnbCableLossDb: 0.5,
    gnbNoiseFigureDb: 5,
    ueTxPowerDbm: 23,
    ueAntennaGainDbi: 0,
    ueCableLossDb: 0,
    ueNoiseFigureDb: 9,
  },
  phy: {
    shannonAlpha: 0.75,
    snrOffsetDb: 0,
    interferenceMarginDb: { ...DEFAULT_INTERFERENCE_MARGIN },
    extendedCp: false,
    dmrsType: 1,
    dmrsLength: 1,
    dmrsAdditionalPositions: 1,
    dmrsCdmGroupsWithoutData: 1,
    overheadPerPrb: 0,
  },
  areas,
  market: {
    totalPopulation: 3_000_000,
    addressableMarket: 0.65,
    marketShareYear1: 0.2,
    annualTrafficGrowth: 0.4,
    daysPerMonth: 30,
    hoursOfUsePerDay: 2,
    activityFactor: 0.5,
    classes: [
      { name: 'Muy intensivo', gbPerMonth: 30, share: 0.35 },
      { name: 'Intensivo', gbPerMonth: 20, share: 0.4 },
      { name: 'Medio', gbPerMonth: 7, share: 0.2 },
      { name: 'Ligero', gbPerMonth: 3, share: 0.05 },
    ],
  },
  options: { multiplyBySectors: true },
};

export const cloneScenario = (s: Scenario): Scenario => structuredClone(s);
