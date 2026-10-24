import {
  DEFAULT_SCENARIO, areaLinkBudget, cellRadius, computeScenario, demandPerSubscriberMbps, pathLossDb,
  type PropagationParams,
} from '..';

const base: PropagationParams = {
  model: 'UMi', frequencyGHz: 3.5, gnbHeightM: 10, ueHeightM: 1.5,
  streetWidthM: 20, buildingHeightM: 5, nlosWithLosBound: false,
};

describe('propagación TR 38.901', () => {
  it('UMi NLOS\' a 1 km y 3,5 GHz', () => {
    const d3d = Math.hypot(1000, 8.5);
    expect(pathLossDb(1000, base)).toBeCloseTo(35.3 * Math.log10(d3d) + 22.4 + 21.3 * Math.log10(3.5), 9);
  });

  it.each(['UMi', 'UMa', 'RMa'] as const)('la inversión %s devuelve la distancia del MAPL', (model) => {
    const p = { ...base, model, gnbHeightM: model === 'UMi' ? 10 : 30, nlosWithLosBound: true };
    const pl = pathLossDb(800, p);
    expect(cellRadius(pl, p).radiusKm).toBeCloseTo(0.8, 6);
  });

  it('NLOS completo nunca es menor que el LOS', () => {
    const full = { ...base, nlosWithLosBound: true };
    for (const d of [10, 50, 200, 1000]) expect(pathLossDb(d, full)).toBeGreaterThanOrEqual(pathLossDb(d, base) - 1e-9);
  });
});

describe('balance de enlace', () => {
  const s = DEFAULT_SCENARIO;
  const lb = areaLinkBudget(s.areas[1], s.equipment, s.phy, true);

  it('los radios UL crecen al bajar la MCS y las fracciones suman 1', () => {
    const radii = lb.ul.rows.map((r) => r.radiusKm);
    for (let i = 1; i < radii.length; i++) expect(radii[i]).toBeGreaterThanOrEqual(radii[i - 1]);
    expect(lb.ul.rows.reduce((a, r) => a + r.fraction, 0)).toBeCloseTo(1, 9);
    expect(lb.dl.rows.reduce((a, r) => a + r.fraction, 0)).toBeCloseTo(1, 9);
  });

  it('MAPL UL = PIRE UE + ganancias Rx − sensibilidad − pérdidas', () => {
    const e = s.equipment;
    const a = s.areas[1];
    const r = lb.ul.rows[0];
    const expected = e.ueTxPowerDbm + e.ueAntennaGainDbi - e.ueCableLossDb + e.gnbAntennaGainDbi - e.gnbCableLossDb
      + a.diversityGainDb - r.mcs.sensitivityDbm
      - (a.foliageLossDb + a.bodyLossDb + a.rainMarginDb + a.fadingMarginDb + a.penetrationLossDb);
    expect(r.maplDb).toBeCloseTo(expected, 9);
  });

  it('cada MCS DL elegida es la de radio más próximo al radio UL', () => {
    lb.dl.rows.forEach((d, i) => {
      const target = lb.ul.rows[i].radiusKm;
      for (const c of lb.dlCandidates) {
        expect(Math.abs(d.radiusKm - target)).toBeLessThanOrEqual(Math.abs(c.radiusKm - target) + 1e-12);
      }
    });
  });

  it('superficie de emplazamiento trisectorial = 1,95·R²', () => {
    expect(lb.coverageSiteAreaKm2).toBeCloseTo(1.95 * lb.coverageRadiusKm ** 2, 12);
  });
});

describe('recuento de emplazamientos', () => {
  const res = computeScenario(DEFAULT_SCENARIO);

  it('abonados del año 1 por zona (Tabla 2 del artículo)', () => {
    expect(res.totalSubscribersYear1).toBeCloseTo(390000, 6);
    expect(res.areas.map((a) => Math.round(a.years[0].subscribers))).toEqual([89700, 175500, 117000, 7800]);
  });

  it('crecimiento de abonados (Fig. 4 del artículo)', () => {
    expect(Math.round(res.areas[0].years[1].subscribers)).toBe(134550);
    expect(Math.round(res.areas[1].years[2].subscribers)).toBe(294840);
  });

  it('la demanda crece con abonados y tráfico', () => {
    const a = res.areas[0];
    const ratio = a.years[1].demandMbps / a.years[0].demandMbps;
    expect(ratio).toBeCloseTo(1.5 * 1.4, 9);
    expect(a.years[0].demandMbps).toBeCloseTo(89700 * demandPerSubscriberMbps(DEFAULT_SCENARIO.market), 6);
  });

  it('el total final es el máximo de cobertura y capacidad', () => {
    for (const a of res.areas) {
      for (const y of a.years) expect(y.sites).toBe(Math.max(y.coverageSites, y.capacitySites));
    }
  });
});
