import {
  ANTENNA_LABELS, MODEL_LABELS, NUM_UL_MCS,
  type AntennaType, type AreaResult, type LinkResult, type PropagationModelId,
} from '../engine';
import { CheckField, Grid, Messages, NumberField, Panel, SelectField, Stat } from './fields';
import { fmt, pct } from './format';
import type { ScenarioApi } from './useScenario';

function LinkTable({ title, link }: { title: string; link: LinkResult }) {
  return (
    <div className="table-wrap">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>MCS</th><th>MAPL<br />(dB)</th><th>Radio de celda<br />(km)</th><th>Superficie<br />emplaz. (km²)</th>
            <th>Superficie por<br />MCS (km²)</th><th>% del<br />emplazamiento</th><th>Throughput<br />emplaz. (Mbps)</th>
          </tr>
        </thead>
        <tbody>
          {link.rows.map((r, i) => (
            <tr key={i} className={r.outOfRange ? 'out-of-range' : undefined}>
              <td>{r.mcs.label} <span className="muted">(MCS {r.mcs.index})</span></td>
              <td>{fmt(r.maplDb, 2)}</td>
              <td>{fmt(r.radiusKm, 4)}{r.outOfRange && <span title="Fuera del rango de validez del modelo"> ⚠</span>}</td>
              <td>{fmt(r.siteAreaKm2, 4)}</td>
              <td>{fmt(r.ringAreaKm2, 4)}</td>
              <td>
                <span className="bar" aria-hidden="true"><span style={{ width: `${Math.min(100, r.fraction * 100)}%` }} /></span>
                {pct(r.fraction)}
              </td>
              <td>{fmt(r.siteThroughputMbps, 2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6}>Throughput medio por emplazamiento</td>
            <td><strong>{fmt(link.averageSiteThroughputMbps, 2)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function LinkTab({ api, result }: { api: ScenarioApi; result: AreaResult }) {
  const { scenario, updateEquipment, updateArea, updateOptions } = api;
  const eq = scenario.equipment;
  const area = result.area;
  const lb = result.link;
  const set = (p: Parameters<typeof updateArea>[1]) => updateArea(area.id, p);
  const ulOptions = lb.ulCarrier.rows.map((r) => ({ value: r.index, label: `${r.label} (MCS ${r.index})` }));

  return (
    <>
      <Panel title="Especificaciones de equipos (todas las zonas)">
        <div className="two-col">
          <div>
            <h3>gNB</h3>
            <Grid>
              <NumberField label="Potencia de transmisión" unit="dBm" step={0.5} value={eq.gnbTxPowerDbm} onChange={(v) => updateEquipment({ gnbTxPowerDbm: v })} />
              <NumberField label="Ganancia de antena" unit="dBi" step={0.5} value={eq.gnbAntennaGainDbi} onChange={(v) => updateEquipment({ gnbAntennaGainDbi: v })} />
              <NumberField label="Pérdidas de cables y alimentador" unit="dB" step={0.1} min={0} value={eq.gnbCableLossDb} onChange={(v) => updateEquipment({ gnbCableLossDb: v })} />
            </Grid>
          </div>
          <div>
            <h3>UE</h3>
            <Grid>
              <NumberField label="Potencia de transmisión" unit="dBm" step={0.5} value={eq.ueTxPowerDbm} onChange={(v) => updateEquipment({ ueTxPowerDbm: v })} />
              <NumberField label="Ganancia de antena" unit="dBi" step={0.5} value={eq.ueAntennaGainDbi} onChange={(v) => updateEquipment({ ueAntennaGainDbi: v })} />
              <NumberField label="Pérdidas internas" unit="dB" step={0.1} min={0} value={eq.ueCableLossDb} onChange={(v) => updateEquipment({ ueCableLossDb: v })} />
            </Grid>
          </div>
        </div>
        <CheckField
          label="Capacidad del emplazamiento = capacidad de celda × nº de sectores"
          hint="Desactívelo para reproducir el criterio del artículo, que asigna al emplazamiento el throughput de una sola celda."
          checked={scenario.options.multiplyBySectors}
          onChange={(v) => updateOptions({ multiplyBySectors: v })}
        />
      </Panel>

      <Panel title={`Zona: ${area.name}`}>
        <div className="two-col">
          <div>
            <h3>Propagación ({area.frequencyGHz} GHz, {area.duplex})</h3>
            <Grid>
              <SelectField
                label="Modelo TR 38.901" value={area.propagationModel}
                options={(Object.keys(MODEL_LABELS) as PropagationModelId[]).map((m) => ({ value: m, label: MODEL_LABELS[m] }))}
                onChange={(v) => set({ propagationModel: v })}
              />
              <NumberField label="Altura del gNB" unit="m" step={1} min={1} value={area.gnbHeightM} onChange={(v) => set({ gnbHeightM: v })} />
              <NumberField label="Altura del UE" unit="m" step={0.5} min={1} value={area.ueHeightM} onChange={(v) => set({ ueHeightM: v })} />
              {area.propagationModel === 'RMa' && (
                <>
                  <NumberField label="Ancho medio de calle" unit="m" step={1} min={5} max={50} value={area.streetWidthM} onChange={(v) => set({ streetWidthM: v })} />
                  <NumberField label="Altura media de edificios" unit="m" step={1} min={5} max={50} value={area.buildingHeightM} onChange={(v) => set({ buildingHeightM: v })} />
                </>
              )}
              <SelectField
                label="Antena" value={area.antenna}
                options={(Object.keys(ANTENNA_LABELS) as AntennaType[]).map((a) => ({ value: a, label: ANTENNA_LABELS[a] }))}
                onChange={(v) => set({ antenna: v })}
              />
              <CheckField
                label="NLOS completo (máx. de LOS y NLOS')"
                hint="TR 38.901 define PL_NLOS = max(PL_LOS, PL'_NLOS). Desactivado se usa sólo PL'_NLOS, como en el Excel."
                checked={area.nlosWithLosBound}
                onChange={(v) => set({ nlosWithLosBound: v })}
              />
            </Grid>
          </div>
          <div>
            <h3>Pérdidas y márgenes</h3>
            <Grid>
              <NumberField label="Ganancia por diversidad" unit="dB" step={0.5} value={area.diversityGainDb} onChange={(v) => set({ diversityGainDb: v })} />
              <NumberField label="Pérdidas por vegetación" unit="dB" step={0.5} value={area.foliageLossDb} onChange={(v) => set({ foliageLossDb: v })} />
              <NumberField label="Pérdidas por el cuerpo" unit="dB" step={0.5} value={area.bodyLossDb} onChange={(v) => set({ bodyLossDb: v })} />
              <NumberField label="Margen por lluvia" unit="dB" step={0.5} value={area.rainMarginDb} onChange={(v) => set({ rainMarginDb: v })} />
              <NumberField label="Margen por desvanecimiento" unit="dB" step={0.5} value={area.fadingMarginDb} onChange={(v) => set({ fadingMarginDb: v })} />
              <NumberField label="Pérdidas de penetración" unit="dB" step={0.5} value={area.penetrationLossDb} onChange={(v) => set({ penetrationLossDb: v })} />
            </Grid>
          </div>
        </div>

        <h3>MCS del enlace ascendente (de mayor a menor orden)</h3>
        <Grid>
          {Array.from({ length: NUM_UL_MCS }, (_, i) => (
            <SelectField
              key={i}
              label={`MCS UL ${i + 1}`}
              value={area.ulMcs[i] ?? 0}
              options={ulOptions}
              onChange={(v) => {
                const ulMcs = [...area.ulMcs];
                ulMcs[i] = v;
                set({ ulMcs });
              }}
            />
          ))}
        </Grid>

        <Messages errors={lb.errors} warnings={lb.warnings} />
        <div className="stats">
          <Stat label="PIRE gNB" value={fmt(lb.dlEirpDbm, 1)} unit="dBm" />
          <Stat label="PIRE UE" value={fmt(lb.ulEirpDbm, 1)} unit="dBm" />
          <Stat label="Pérdidas y márgenes" value={fmt(lb.totalLossesDb, 1)} unit="dB" />
          <Stat label="Radio UL máximo" value={fmt(lb.coverageRadiusKm, 4)} unit="km" />
          <Stat label="Superficie por emplazamiento" value={fmt(lb.coverageSiteAreaKm2, 4)} unit="km²" />
          <Stat label="Throughput DL medio" value={fmt(lb.dl.averageSiteThroughputMbps, 1)} unit="Mbps" />
        </div>
      </Panel>

      {!lb.errors.length && (
        <Panel title="Resultados del balance de enlace">
          <LinkTable title={`${area.name} · Enlace ascendente`} link={lb.ul} />
          <LinkTable title={`${area.name} · Enlace descendente (MCS de radio más próximo a cada radio UL)`} link={lb.dl} />
        </Panel>
      )}
    </>
  );
}
