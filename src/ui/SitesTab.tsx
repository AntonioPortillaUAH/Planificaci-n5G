import { NUM_YEARS, type ScenarioResult, type ServiceArea } from '../engine';
import { GroupedBars } from './charts';
import { Grid, NumberField, Panel, Stat } from './fields';
import { fmt, fmtInt, pct } from './format';
import type { ScenarioApi } from './useScenario';

const YEARS = Array.from({ length: NUM_YEARS }, (_, i) => i);

function YearRow({ label, area, field, onChange, skipFirst }: {
  label: string;
  area: ServiceArea;
  field: 'coverageRequirement' | 'subscriberGrowth';
  onChange: (values: number[]) => void;
  skipFirst?: boolean;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {YEARS.map((y) => (
        <td key={y}>
          {skipFirst && y === 0 ? <span className="muted">—</span> : (
            <NumberField
              label={`${label} año ${y + 1}`}
              percent step={1}
              value={area[field][y] ?? 0}
              onChange={(v) => {
                const next = [...area[field]];
                next[y] = v;
                onChange(next);
              }}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

export function SitesTab({ api, result }: { api: ScenarioApi; result: ScenarioResult }) {
  const { scenario, updateMarket, updateArea } = api;
  const m = scenario.market;
  const shareSum = scenario.areas.reduce((s, a) => s + a.subscriberShare, 0);
  const classSum = m.classes.reduce((s, c) => s + c.share, 0);

  const yearLabel = (y: number) => `Año ${y + 1}`;
  const byYear = (f: (a: ScenarioResult['areas'][number], y: number) => number) =>
    YEARS.map((y) => ({
      year: yearLabel(y),
      ...Object.fromEntries(result.areas.map((a) => [a.area.id, f(a, y)])),
    }));
  const areaSeries = result.areas.map((a) => ({ key: a.area.id, label: a.area.name }));

  return (
    <>
      <Panel title="Mercado y perfil de abonado">
        <Grid>
          <NumberField label="Población total" step={1000} min={0} value={m.totalPopulation} onChange={(v) => updateMarket({ totalPopulation: v })} />
          <NumberField label="Mercado direccionable" percent step={1} value={m.addressableMarket} onChange={(v) => updateMarket({ addressableMarket: v })} />
          <NumberField label="Cuota de mercado en el año 1" percent step={1} value={m.marketShareYear1} onChange={(v) => updateMarket({ marketShareYear1: v })} />
          <NumberField label="Crecimiento anual del tráfico por abonado" percent step={1} value={m.annualTrafficGrowth} onChange={(v) => updateMarket({ annualTrafficGrowth: v })} />
          <NumberField label="Días por mes" step={1} min={1} value={m.daysPerMonth} onChange={(v) => updateMarket({ daysPerMonth: v })} />
          <NumberField label="Horas de uso al día" unit="h" step={0.25} min={0.01} value={m.hoursOfUsePerDay} onChange={(v) => updateMarket({ hoursOfUsePerDay: v })} />
          <NumberField
            label="Factor de actividad en hora cargada" percent step={1} min={0} max={100} value={m.activityFactor}
            hint="Fracción de abonados que están transmitiendo simultáneamente"
            onChange={(v) => updateMarket({ activityFactor: v })}
          />
        </Grid>
        <div className="table-wrap">
          <h3>Clases de abonado</h3>
          <table className="inputs">
            <thead><tr><th>Clase</th><th>Consumo mensual (GB)</th><th>% de abonados</th></tr></thead>
            <tbody>
              {m.classes.map((c, i) => (
                <tr key={i}>
                  <th scope="row">{c.name}</th>
                  <td><NumberField label={`Consumo ${c.name}`} unit="GB" step={1} min={0} value={c.gbPerMonth} onChange={(v) => updateMarket({ classes: m.classes.map((x, j) => (j === i ? { ...x, gbPerMonth: v } : x)) })} /></td>
                  <td><NumberField label={`% ${c.name}`} percent step={1} min={0} value={c.share} onChange={(v) => updateMarket({ classes: m.classes.map((x, j) => (j === i ? { ...x, share: v } : x)) })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {Math.abs(classSum - 1) > 1e-6 && <p className="msg warning">⚠ Los porcentajes de las clases suman {pct(classSum, 1)} (deberían sumar 100 %).</p>}
        </div>
        <div className="stats">
          <Stat label="Abonados en el año 1" value={fmtInt(result.totalSubscribersYear1)} />
          <Stat label="Consumo medio por abonado" value={fmt(result.avgGbPerSubscriber, 2)} unit="GB/mes" />
          <Stat label="Demanda DL por abonado en hora cargada" value={fmt(result.demandPerSubscriberMbps, 3)} unit="Mbps" />
        </div>
      </Panel>

      <Panel title="Zonas de servicio y previsión a 5 años">
        <div className="table-wrap">
          <table className="inputs">
            <thead>
              <tr><th>Zona</th><th>Superficie a cubrir (km²)</th><th>% de los abonados</th><th>Abonados año 1</th></tr>
            </thead>
            <tbody>
              {result.areas.map(({ area, years }) => (
                <tr key={area.id}>
                  <th scope="row">{area.name}</th>
                  <td><NumberField label={`Superficie ${area.name}`} unit="km²" step={10} min={0} value={area.coverageAreaKm2} onChange={(v) => updateArea(area.id, { coverageAreaKm2: v })} /></td>
                  <td><NumberField label={`% abonados ${area.name}`} percent step={0.1} min={0} value={area.subscriberShare} onChange={(v) => updateArea(area.id, { subscriberShare: v })} /></td>
                  <td>{fmtInt(years[0].subscribers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {Math.abs(shareSum - 1) > 1e-6 && <p className="msg warning">⚠ El reparto de abonados entre zonas suma {pct(shareSum, 1)} (debería sumar 100 %).</p>}
        </div>
        <div className="table-wrap">
          <table className="inputs">
            <thead>
              <tr><th>Zona / parámetro</th>{YEARS.map((y) => <th key={y}>{yearLabel(y)}</th>)}</tr>
            </thead>
            <tbody>
              {scenario.areas.map((a) => (
                <YearRow key={`c-${a.id}`} label={`${a.name} · cobertura`} area={a} field="coverageRequirement" onChange={(v) => updateArea(a.id, { coverageRequirement: v })} />
              ))}
              {scenario.areas.map((a) => (
                <YearRow key={`g-${a.id}`} label={`${a.name} · crecimiento abonados`} area={a} field="subscriberGrowth" skipFirst onChange={(v) => updateArea(a.id, { subscriberGrowth: v })} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Recuento de emplazamientos">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zona</th><th>Concepto</th>{YEARS.map((y) => <th key={y}>{yearLabel(y)}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.areas.map(({ area, years }) => (
                <FragmentRows key={area.id} name={area.name} years={years} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>Total emplazamientos</th>
                {result.totals.map((t) => <td key={t.year}><strong>{fmtInt(t.sites)}</strong></td>)}
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="charts">
          <GroupedBars title="Abonados previstos" data={byYear((a, y) => a.years[y].subscribers)} xKey="year" series={areaSeries} />
          <GroupedBars title="Demanda agregada de tráfico DL (Gbps)" data={byYear((a, y) => a.years[y].demandMbps / 1000)} xKey="year" series={areaSeries} unit="Gbps" decimals={2} />
        </div>
        <div className="charts">
          {result.areas.map((a) => (
            <GroupedBars
              key={a.area.id}
              title={`Emplazamientos por cobertura y capacidad · ${a.area.name}`}
              data={a.years.map((y) => ({ year: `Año ${y.year}`, coverage: y.coverageSites, capacity: y.capacitySites }))}
              xKey="year"
              series={[{ key: 'coverage', label: 'Cobertura' }, { key: 'capacity', label: 'Capacidad' }]}
              height={220}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}

function FragmentRows({ name, years }: { name: string; years: ScenarioResult['areas'][number]['years'] }) {
  return (
    <>
      <tr className="group-start">
        <th scope="row" rowSpan={4}>{name}</th>
        <td>Demanda DL (Mbps)</td>{years.map((y) => <td key={y.year}>{fmt(y.demandMbps, 0)}</td>)}
      </tr>
      <tr><td>Por cobertura</td>{years.map((y) => <td key={y.year}>{fmtInt(y.coverageSites)}</td>)}</tr>
      <tr><td>Por capacidad</td>{years.map((y) => <td key={y.year}>{fmtInt(y.capacitySites)}</td>)}</tr>
      <tr>
        <td>Final</td>
        {years.map((y) => (
          <td key={y.year}><strong>{fmtInt(y.sites)}</strong> <span className="muted">({y.limitedBy})</span></td>
        ))}
      </tr>
    </>
  );
}
