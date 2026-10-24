// Tablas normativas 3GPP usadas por el motor de cálculo.

export type McsTableId = 'qam256' | 'qam64';

export interface McsEntry {
  index: number;
  /** Orden de modulación Qm (bits por símbolo) */
  qm: number;
  /** Tasa de código objetivo R x 1024 */
  rx1024: number;
}

const build = (rows: [number, number][]): McsEntry[] =>
  rows.map(([qm, rx1024], index) => ({ index, qm, rx1024 }));

/** TS 38.214 Tabla 5.1.3.1-1 (MCS index table 1, hasta 64QAM). */
const QAM64: McsEntry[] = build([
  [2, 120], [2, 157], [2, 193], [2, 251], [2, 308], [2, 379], [2, 449], [2, 526], [2, 602], [2, 679],
  [4, 340], [4, 378], [4, 434], [4, 490], [4, 553], [4, 616], [4, 658],
  [6, 438], [6, 466], [6, 517], [6, 567], [6, 616], [6, 666], [6, 719], [6, 772], [6, 822], [6, 873], [6, 910], [6, 948],
]);

/** TS 38.214 Tabla 5.1.3.1-2 (MCS index table 2, hasta 256QAM). */
const QAM256: McsEntry[] = build([
  [2, 120], [2, 193], [2, 308], [2, 449], [2, 602],
  [4, 378], [4, 434], [4, 490], [4, 553], [4, 616], [4, 658],
  [6, 466], [6, 517], [6, 567], [6, 616], [6, 666], [6, 719], [6, 772], [6, 822], [6, 873],
  [8, 682.5], [8, 711], [8, 754], [8, 797], [8, 841], [8, 885], [8, 916.5], [8, 948],
]);

export const MCS_TABLES: Record<McsTableId, McsEntry[]> = { qam256: QAM256, qam64: QAM64 };

export const MCS_TABLE_LABELS: Record<McsTableId, string> = {
  qam256: 'Tabla 2 (hasta 256QAM)',
  qam64: 'Tabla 1 (hasta 64QAM)',
};

export const modulationName = (qm: number): string =>
  ({ 2: 'QPSK', 4: '16QAM', 6: '64QAM', 8: '256QAM' })[qm] ?? `Qm=${qm}`;

/** Eficiencia espectral por capa (bits/símbolo) = Qm · R */
export const spectralEfficiency = (m: McsEntry): number => (m.qm * m.rx1024) / 1024;

/** Etiqueta del estilo de 5G-RAND, p. ej. "256QAM 7.4063" */
export const mcsLabel = (m: McsEntry): string =>
  `${modulationName(m.qm)} ${spectralEfficiency(m).toFixed(4)}`;

/** TS 38.214 Tabla 5.1.3.2-1: TBS para N_info <= 3824 */
export const TBS_TABLE: readonly number[] = [
  24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192,
  208, 224, 240, 256, 272, 288, 304, 320, 336, 352, 368, 384, 408, 432, 456, 480, 504, 528, 552, 576,
  608, 640, 672, 704, 736, 768, 808, 848, 888, 928, 984, 1032, 1064, 1128, 1160, 1192, 1224, 1256,
  1288, 1320, 1352, 1416, 1480, 1544, 1608, 1672, 1736, 1800, 1864, 1928, 2024, 2088, 2152, 2216,
  2280, 2408, 2472, 2536, 2600, 2664, 2728, 2792, 2856, 2976, 3104, 3240, 3368, 3496, 3624, 3752, 3824,
];

/**
 * Número máximo de PRB (N_RB) por ancho de banda y SCS.
 * FR1: TS 38.101-1 Tabla 5.3.2-1. FR2: TS 38.101-2 Tabla 5.3.2-1.
 * Clave: SCS (kHz) -> ancho de banda (MHz) -> N_RB
 */
export const PRB_FR1: Record<number, Record<number, number>> = {
  15: { 5: 25, 10: 52, 15: 79, 20: 106, 25: 133, 30: 160, 35: 188, 40: 216, 45: 242, 50: 270 },
  30: { 5: 11, 10: 24, 15: 38, 20: 51, 25: 65, 30: 78, 35: 92, 40: 106, 45: 119, 50: 133, 60: 162, 70: 189, 80: 217, 90: 245, 100: 273 },
  60: { 10: 11, 15: 18, 20: 24, 25: 31, 30: 38, 35: 44, 40: 51, 45: 58, 50: 65, 60: 79, 70: 93, 80: 107, 90: 121, 100: 135 },
};

export const PRB_FR2: Record<number, Record<number, number>> = {
  60: { 50: 66, 100: 132, 200: 264 },
  120: { 50: 32, 100: 66, 200: 132, 400: 264 },
};

/** Margen de interferencia por defecto según modulación (dB), valores del Excel original. */
export const DEFAULT_INTERFERENCE_MARGIN: Record<number, number> = { 2: 2.5, 4: 3, 6: 4, 8: 5.5 };
