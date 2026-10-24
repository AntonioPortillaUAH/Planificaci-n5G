import {
  MCS_TABLES, carrierTable, dmrsRePerPrb, prbCount, slotsPerSecond, tbsFromNinfo, transportBlockSize,
  DEFAULT_SCENARIO,
} from '..';

const phy = DEFAULT_SCENARIO.phy;

describe('tablas y numerología', () => {
  it('número de PRB según TS 38.101', () => {
    expect(prbCount('FR1', 100, 30)).toBe(273);
    expect(prbCount('FR1', 50, 60)).toBe(65);
    expect(prbCount('FR2', 400, 120)).toBe(264);
    expect(prbCount('FR1', 100, 15)).toBeNull();
  });

  it('slots por segundo', () => {
    expect(slotsPerSecond(15)).toBe(1000);
    expect(slotsPerSecond(30)).toBe(2000);
    expect(slotsPerSecond(120)).toBe(8000);
  });

  it('tablas MCS con el número de entradas correcto', () => {
    expect(MCS_TABLES.qam256).toHaveLength(28);
    expect(MCS_TABLES.qam64).toHaveLength(29);
  });

  it('DMRS tipo 1, 1 símbolo, 1 posición adicional, 1 grupo CDM = 12 RE', () => {
    expect(dmrsRePerPrb(phy)).toBe(12);
  });
});

describe('TBS (TS 38.214 §5.1.3.2)', () => {
  it('N_info <= 3824 usa la tabla con el menor TBS no inferior a N_info cuantificado', () => {
    expect(tbsFromNinfo(1000, 0.5)).toBe(1032);
    expect(tbsFromNinfo(20, 0.5)).toBe(24);
    expect(tbsFromNinfo(3824, 0.5)).toBe(3824);
  });

  it('caso de pico conocido: 273 PRB, MCS 27 (256QAM), 4 capas → 1 277 992 bits', () => {
    const mcs = MCS_TABLES.qam256[27];
    const { tbs } = transportBlockSize(156 * 273, mcs, 4);
    expect(tbs).toBe(1277992);
  });

  it('tasa baja (R <= 1/4) segmenta en bloques de 3816', () => {
    // N_info grande con R = 120/1024
    const tbs = tbsFromNinfo(20000, 120 / 1024);
    expect((tbs + 24) % 8).toBe(0);
    expect(tbs).toBeGreaterThanOrEqual(19968 - 24);
  });

  it('más de 4 capas suma dos codewords', () => {
    const mcs = MCS_TABLES.qam256[27];
    const one = transportBlockSize(156 * 273, mcs, 4).tbs;
    expect(transportBlockSize(156 * 273, mcs, 8).tbs).toBe(2 * one);
  });
});

describe('throughput y sensibilidad', () => {
  const cfg = { frequencyGHz: 3.5, bandwidthMHz: 100, scsKHz: 30, timeFraction: 1, layers: 4, noiseFigureDb: 7 };
  const res = carrierTable(cfg, 'qam256', { ...phy, dmrsAdditionalPositions: 0 });

  it('throughput de pico en Mbps (10^6, no 2^20)', () => {
    // N'_RE = 168 − 6 = 162 → se limita a 156
    expect(res.rows[27].throughputMbps).toBeCloseTo((1277992 * 2000) / 1e6, 6);
  });

  it('sensibilidad sobre el ancho de banda ocupado', () => {
    const bw = 273 * 12 * 30e3;
    const r = res.rows[0];
    expect(r.sensitivityDbm).toBeCloseTo(-174 + 10 * Math.log10(bw) + 7 + r.snrDb + r.interferenceMarginDb, 9);
  });

  it('sensibilidad creciente con la MCS', () => {
    for (let i = 1; i < res.rows.length; i++) {
      expect(res.rows[i].sensitivityDbm).toBeGreaterThan(res.rows[i - 1].sensitivityDbm - 1e-9);
    }
  });

  it('error explicativo para combinaciones no válidas', () => {
    expect(carrierTable({ ...cfg, frequencyGHz: 10 }, 'qam256', phy).error).toMatch(/FR1/);
    expect(carrierTable({ ...cfg, scsKHz: 15 }, 'qam256', phy).error).toMatch(/no está definida/);
  });
});
