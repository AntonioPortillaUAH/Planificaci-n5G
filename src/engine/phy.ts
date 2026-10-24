// Capa física: numerología, PRB, TBS (TS 38.214 §5.1.3.2), throughput y sensibilidad.

import {
  MCS_TABLES, PRB_FR1, PRB_FR2, TBS_TABLE, mcsLabel, modulationName, spectralEfficiency,
  type McsEntry, type McsTableId,
} from './tables';
import type { PhyCommon } from './types';

export type FrequencyRange = 'FR1' | 'FR2';

export function frequencyRange(frequencyGHz: number): FrequencyRange | null {
  if (frequencyGHz >= 0.41 && frequencyGHz <= 7.125) return 'FR1';
  if (frequencyGHz >= 24.25 && frequencyGHz <= 52.6) return 'FR2';
  return null;
}

/** Número de PRB o null si la combinación BW/SCS no existe en el rango de frecuencia. */
export function prbCount(fr: FrequencyRange, bandwidthMHz: number, scsKHz: number): number | null {
  const table = fr === 'FR1' ? PRB_FR1 : PRB_FR2;
  return table[scsKHz]?.[bandwidthMHz] ?? null;
}

export function validBandwidths(fr: FrequencyRange, scsKHz: number): number[] {
  const table = fr === 'FR1' ? PRB_FR1 : PRB_FR2;
  return Object.keys(table[scsKHz] ?? {}).map(Number).sort((a, b) => a - b);
}

export function validScs(fr: FrequencyRange): number[] {
  return Object.keys(fr === 'FR1' ? PRB_FR1 : PRB_FR2).map(Number);
}

/** μ tal que SCS = 15·2^μ kHz */
export const numerology = (scsKHz: number): number => Math.round(Math.log2(scsKHz / 15));

export const slotsPerSecond = (scsKHz: number): number => 1000 * 2 ** numerology(scsKHz);

export const symbolsPerSlot = (scsKHz: number, extendedCp: boolean): number =>
  extendedCp && scsKHz === 60 ? 12 : 14;

/** N_DMRS^PRB: elementos de recurso de DMRS por PRB y slot (incluye grupos CDM sin datos). */
export function dmrsRePerPrb(phy: PhyCommon): number {
  const rePerCdmGroup = phy.dmrsType === 1 ? 6 : 4;
  const groups = Math.min(phy.dmrsCdmGroupsWithoutData, phy.dmrsType === 1 ? 2 : 3);
  const symbols = phy.dmrsLength * (1 + phy.dmrsAdditionalPositions);
  return rePerCdmGroup * groups * symbols;
}

/** N'_RE por PRB = 12·N_symb − N_DMRS − N_oh */
export function rePerPrb(phy: PhyCommon, scsKHz: number): number {
  return Math.max(0, 12 * symbolsPerSlot(scsKHz, phy.extendedCp) - dmrsRePerPrb(phy) - phy.overheadPerPrb);
}

/** TBS de un único codeword (TS 38.214 §5.1.3.2, pasos 2 a 4). */
export function tbsFromNinfo(nInfo: number, codeRate: number): number {
  if (nInfo <= 0) return 0;
  if (nInfo <= 3824) {
    const n = Math.max(3, Math.floor(Math.log2(nInfo)) - 6);
    const nInfoQ = Math.max(24, 2 ** n * Math.floor(nInfo / 2 ** n));
    return TBS_TABLE.find((t) => t >= nInfoQ) ?? TBS_TABLE[TBS_TABLE.length - 1];
  }
  const n = Math.floor(Math.log2(nInfo - 24)) - 5;
  const nInfoQ = Math.max(3840, 2 ** n * Math.round((nInfo - 24) / 2 ** n));
  if (codeRate <= 1 / 4) {
    const c = Math.ceil((nInfoQ + 24) / 3816);
    return 8 * c * Math.ceil((nInfoQ + 24) / (8 * c)) - 24;
  }
  if (nInfoQ > 8424) {
    const c = Math.ceil((nInfoQ + 24) / 8424);
    return 8 * c * Math.ceil((nInfoQ + 24) / (8 * c)) - 24;
  }
  return 8 * Math.ceil((nInfoQ + 24) / 8) - 24;
}

/**
 * TBS por slot ocupando todos los PRB. Con más de 4 capas se usan dos codewords
 * (⌊v/2⌋ y ⌈v/2⌉ capas), cada uno con su propio TBS.
 */
export function transportBlockSize(nRe: number, mcs: McsEntry, layers: number): { nInfo: number; tbs: number } {
  const r = mcs.rx1024 / 1024;
  const perCodeword = (v: number) => tbsFromNinfo(nRe * r * mcs.qm * v, r);
  const nInfo = nRe * r * mcs.qm * layers;
  if (layers <= 4) return { nInfo, tbs: perCodeword(layers) };
  const v1 = Math.floor(layers / 2);
  return { nInfo, tbs: perCodeword(v1) + perCodeword(layers - v1) };
}

/** SNR requerido por el modelo de Shannon atenuado: SE = α·log2(1 + SNR) */
export function requiredSnrDb(se: number, alpha: number, offsetDb: number): number {
  return 10 * Math.log10(2 ** (se / alpha) - 1) + offsetDb;
}

export interface CarrierConfig {
  frequencyGHz: number;
  bandwidthMHz: number;
  scsKHz: number;
  /** Fracción de tiempo disponible en el enlace (1 en FDD) */
  timeFraction: number;
  layers: number;
  noiseFigureDb: number;
}

export interface McsRow {
  index: number;
  label: string;
  modulation: string;
  qm: number;
  codeRate: number;
  efficiency: number;
  snrDb: number;
  interferenceMarginDb: number;
  sinrDb: number;
  sensitivityDbm: number;
  nInfo: number;
  tbs: number;
  /** Throughput de una celda/portadora (Mbps) */
  throughputMbps: number;
}

export interface CarrierResult {
  fr: FrequencyRange | null;
  nPrb: number | null;
  occupiedBandwidthHz: number;
  rePerPrb: number;
  nRe: number;
  slotsPerSecond: number;
  rows: McsRow[];
  error?: string;
}

/** Tabla completa de MCS de un enlace (sensibilidad, TBS y throughput por MCS). */
export function carrierTable(cfg: CarrierConfig, table: McsTableId, phy: PhyCommon): CarrierResult {
  const fr = frequencyRange(cfg.frequencyGHz);
  const base = { fr, nPrb: null, occupiedBandwidthHz: 0, rePerPrb: 0, nRe: 0, slotsPerSecond: 0, rows: [] };
  if (!fr) return { ...base, error: `La frecuencia ${cfg.frequencyGHz} GHz no está en FR1 (0,41–7,125 GHz) ni en FR2 (24,25–52,6 GHz).` };
  const nPrb = prbCount(fr, cfg.bandwidthMHz, cfg.scsKHz);
  if (nPrb === null) return { ...base, error: `La combinación ${cfg.bandwidthMHz} MHz / ${cfg.scsKHz} kHz no está definida en ${fr}.` };

  const rePrb = rePerPrb(phy, cfg.scsKHz);
  const nRe = Math.min(156, rePrb) * nPrb;
  const slots = slotsPerSecond(cfg.scsKHz);
  const occupiedBandwidthHz = nPrb * 12 * cfg.scsKHz * 1e3;
  const noiseFloorDbm = -174 + 10 * Math.log10(occupiedBandwidthHz) + cfg.noiseFigureDb;

  const rows = MCS_TABLES[table].map((m): McsRow => {
    const efficiency = spectralEfficiency(m);
    const snrDb = requiredSnrDb(efficiency, phy.shannonAlpha, phy.snrOffsetDb);
    const im = phy.interferenceMarginDb[m.qm] ?? 0;
    const { nInfo, tbs } = transportBlockSize(nRe, m, cfg.layers);
    return {
      index: m.index,
      label: mcsLabel(m),
      modulation: modulationName(m.qm),
      qm: m.qm,
      codeRate: m.rx1024 / 1024,
      efficiency,
      snrDb,
      interferenceMarginDb: im,
      sinrDb: snrDb + im,
      sensitivityDbm: noiseFloorDbm + snrDb + im,
      nInfo,
      tbs,
      throughputMbps: (tbs * slots * cfg.timeFraction) / 1e6,
    };
  });
  return { fr, nPrb, occupiedBandwidthHz, rePerPrb: rePrb, nRe, slotsPerSecond: slots, rows };
}
