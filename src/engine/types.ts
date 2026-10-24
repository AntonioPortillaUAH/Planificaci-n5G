import type { McsTableId } from './tables';

export type Duplex = 'FDD' | 'TDD';
export type AntennaType = 'omni' | 'tri';
export type PropagationModelId = 'UMi' | 'UMa' | 'RMa';
export type AreaId = 'denseUrban' | 'urban' | 'suburban' | 'rural';

export const AREA_IDS: AreaId[] = ['denseUrban', 'urban', 'suburban', 'rural'];

export const NUM_UL_MCS = 6;
export const NUM_YEARS = 5;

/** Especificaciones de equipos (comunes a todas las áreas) */
export interface Equipment {
  gnbTxPowerDbm: number;
  gnbAntennaGainDbi: number;
  gnbCableLossDb: number;
  gnbNoiseFigureDb: number;
  ueTxPowerDbm: number;
  ueAntennaGainDbi: number;
  ueCableLossDb: number;
  ueNoiseFigureDb: number;
}

/** Parámetros de capa física comunes */
export interface PhyCommon {
  /** Factor de atenuación α del modelo de Shannon atenuado para el SNR requerido */
  shannonAlpha: number;
  /** Desplazamiento adicional del SNR requerido (dB) */
  snrOffsetDb: number;
  /** Margen de interferencia por orden de modulación Qm (dB) */
  interferenceMarginDb: Record<number, number>;
  /** Prefijo cíclico extendido (sólo válido con SCS = 60 kHz) */
  extendedCp: boolean;
  dmrsType: 1 | 2;
  /** Símbolos DMRS por posición (1 o 2) */
  dmrsLength: 1 | 2;
  /** Posiciones DMRS adicionales (0..3) */
  dmrsAdditionalPositions: 0 | 1 | 2 | 3;
  /** Grupos CDM sin datos (1..3) */
  dmrsCdmGroupsWithoutData: 1 | 2 | 3;
  /** Sobrecarga por PRB (xOverhead: 0, 6, 12, 18) */
  overheadPerPrb: 0 | 6 | 12 | 18;
}

export interface ServiceArea {
  id: AreaId;
  name: string;
  // --- Capa física
  frequencyGHz: number;
  duplex: Duplex;
  bandwidthMHz: number;
  scsKHz: number;
  /** Fracción de tiempo DL en TDD (0..1) */
  tddDlRatio: number;
  ulLayers: number;
  dlLayers: number;
  ulMcsTable: McsTableId;
  dlMcsTable: McsTableId;
  // --- Propagación
  propagationModel: PropagationModelId;
  /** true: NLOS completo de TR 38.901 (máx. entre LOS y NLOS'); false: sólo la ecuación NLOS' */
  nlosWithLosBound: boolean;
  gnbHeightM: number;
  ueHeightM: number;
  /** Sólo RMa */
  streetWidthM: number;
  /** Sólo RMa */
  buildingHeightM: number;
  // --- Pérdidas y márgenes (dB)
  diversityGainDb: number;
  foliageLossDb: number;
  bodyLossDb: number;
  rainMarginDb: number;
  fadingMarginDb: number;
  penetrationLossDb: number;
  antenna: AntennaType;
  /** Índices (en la tabla UL) de las 6 MCS UL, de mayor a menor orden */
  ulMcs: number[];
  // --- Mercado y previsión
  /** Superficie a cubrir en la zona (km²) */
  coverageAreaKm2: number;
  /** Fracción de los abonados totales que está en esta zona */
  subscriberShare: number;
  /** Requisito de cobertura por año (fracción 0..1) */
  coverageRequirement: number[];
  /** Crecimiento anual de abonados por año (fracción, el año 1 se ignora) */
  subscriberGrowth: number[];
}

export interface SubscriberClass {
  name: string;
  gbPerMonth: number;
  /** Fracción de abonados de esta clase */
  share: number;
}

export interface Market {
  totalPopulation: number;
  addressableMarket: number;
  marketShareYear1: number;
  /** Crecimiento anual del tráfico por abonado (fracción) */
  annualTrafficGrowth: number;
  daysPerMonth: number;
  /** Horas de uso medias al día */
  hoursOfUsePerDay: number;
  /** Fracción de abonados activos simultáneamente en la hora cargada */
  activityFactor: number;
  classes: SubscriberClass[];
}

export interface Options {
  /** Multiplicar la capacidad de una celda por el nº de sectores para obtener la del emplazamiento */
  multiplyBySectors: boolean;
}

export interface Scenario {
  name: string;
  equipment: Equipment;
  phy: PhyCommon;
  areas: ServiceArea[];
  market: Market;
  options: Options;
}
