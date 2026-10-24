// Modelos de pérdidas de propagación de 3GPP TR 38.901 (Tabla 7.4.1-1) y su inversión.

import type { PropagationModelId } from './types';

const C = 3e8;
const log10 = Math.log10;

export interface PropagationParams {
  model: PropagationModelId;
  frequencyGHz: number;
  gnbHeightM: number;
  ueHeightM: number;
  /** Ancho medio de calle W (RMa) */
  streetWidthM: number;
  /** Altura media de edificios h (RMa) */
  buildingHeightM: number;
  /** true: PL_NLOS = max(PL_LOS, PL'_NLOS); false: sólo PL'_NLOS */
  nlosWithLosBound: boolean;
}

export const MODEL_LABELS: Record<PropagationModelId, string> = {
  UMi: 'UMi – Street Canyon',
  UMa: 'UMa – Urban Macro',
  RMa: 'RMa – Rural Macro',
};

/** Rango de validez de d2D (m) para el escenario NLOS */
export const VALID_D2D_M: Record<PropagationModelId, [number, number]> = {
  UMi: [10, 5000],
  UMa: [10, 5000],
  RMa: [10, 5000],
};

const d3d = (d2D: number, p: PropagationParams) => Math.hypot(d2D, p.gnbHeightM - p.ueHeightM);

function umiLos(d2D: number, p: PropagationParams): number {
  const fc = p.frequencyGHz;
  const dBp = (4 * (p.gnbHeightM - 1) * (p.ueHeightM - 1) * fc * 1e9) / C;
  const d = d3d(d2D, p);
  if (d2D <= dBp) return 32.4 + 21 * log10(d) + 20 * log10(fc);
  return 32.4 + 40 * log10(d) + 20 * log10(fc) - 9.5 * log10(dBp ** 2 + (p.gnbHeightM - p.ueHeightM) ** 2);
}

function umiNlosPrime(d2D: number, p: PropagationParams): number {
  return 35.3 * log10(d3d(d2D, p)) + 22.4 + 21.3 * log10(p.frequencyGHz) - 0.3 * (p.ueHeightM - 1.5);
}

function umaLos(d2D: number, p: PropagationParams): number {
  const fc = p.frequencyGHz;
  // h_E = 1 m (C(d2D, hUT) = 0 para hUT < 13 m)
  const dBp = (4 * (p.gnbHeightM - 1) * (p.ueHeightM - 1) * fc * 1e9) / C;
  const d = d3d(d2D, p);
  if (d2D <= dBp) return 28 + 22 * log10(d) + 20 * log10(fc);
  return 28 + 40 * log10(d) + 20 * log10(fc) - 9 * log10(dBp ** 2 + (p.gnbHeightM - p.ueHeightM) ** 2);
}

function umaNlosPrime(d2D: number, p: PropagationParams): number {
  return 13.54 + 39.08 * log10(d3d(d2D, p)) + 20 * log10(p.frequencyGHz) - 0.6 * (p.ueHeightM - 1.5);
}

function rmaPl1(d: number, p: PropagationParams): number {
  const h = p.buildingHeightM;
  const fc = p.frequencyGHz;
  return (
    20 * log10((40 * Math.PI * d * fc) / 3) +
    Math.min(0.03 * h ** 1.72, 10) * log10(d) -
    Math.min(0.044 * h ** 1.72, 14.77) +
    0.002 * log10(h) * d
  );
}

function rmaLos(d2D: number, p: PropagationParams): number {
  const dBp = (2 * Math.PI * p.gnbHeightM * p.ueHeightM * p.frequencyGHz * 1e9) / C;
  const d = d3d(d2D, p);
  if (d2D <= dBp) return rmaPl1(d, p);
  return rmaPl1(d3d(dBp, p), p) + 40 * log10(d / dBp);
}

function rmaNlosPrime(d2D: number, p: PropagationParams): number {
  const { streetWidthM: W, buildingHeightM: h, gnbHeightM: hBS, ueHeightM: hUT } = p;
  return (
    161.04 - 7.1 * log10(W) + 7.5 * log10(h) -
    (24.37 - 3.7 * (h / hBS) ** 2) * log10(hBS) +
    (43.42 - 3.1 * log10(hBS)) * (log10(d3d(d2D, p)) - 3) +
    20 * log10(p.frequencyGHz) -
    (3.2 * log10(11.75 * hUT) ** 2 - 4.97)
  );
}

/** Pérdidas NLOS (dB) a la distancia horizontal d2D (m). */
export function pathLossDb(d2D: number, p: PropagationParams): number {
  const [los, nlos] =
    p.model === 'UMi' ? [umiLos, umiNlosPrime] : p.model === 'UMa' ? [umaLos, umaNlosPrime] : [rmaLos, rmaNlosPrime];
  const plNlos = nlos(d2D, p);
  return p.nlosWithLosBound ? Math.max(los(d2D, p), plNlos) : plNlos;
}

export interface RadiusResult {
  /** Radio de celda en km */
  radiusKm: number;
  /** El radio cae fuera del rango de validez del modelo */
  outOfRange: boolean;
}

const MIN_D_M = 1;
const MAX_D_M = 100_000;

/** Distancia horizontal máxima (km) a la que las pérdidas no superan el MAPL (bisección). */
export function cellRadius(maplDb: number, p: PropagationParams): RadiusResult {
  const [vMin, vMax] = VALID_D2D_M[p.model];
  if (!Number.isFinite(maplDb) || pathLossDb(MIN_D_M, p) >= maplDb) return { radiusKm: 0, outOfRange: true };
  if (pathLossDb(MAX_D_M, p) <= maplDb) return { radiusKm: MAX_D_M / 1000, outOfRange: true };
  let lo = Math.log(MIN_D_M);
  let hi = Math.log(MAX_D_M);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (pathLossDb(Math.exp(mid), p) <= maplDb) lo = mid;
    else hi = mid;
  }
  const d = Math.exp(lo);
  return { radiusKm: d / 1000, outOfRange: d < vMin || d > vMax };
}
