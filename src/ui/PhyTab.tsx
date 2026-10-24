import {
  MCS_TABLE_LABELS, frequencyRange, validBandwidths, validScs,
  type CarrierResult, type McsTableId, type ServiceArea,
} from '../engine';
import type { AreaResult } from '../engine';
import { CheckField, Grid, Messages, NumberField, Panel, SelectField, Stat } from './fields';
import { fmt, fmtInt } from './format';
import type { ScenarioApi } from './useScenario';

const TABLE_OPTIONS = (Object.keys(MCS_TABLE_LABELS) as McsTableId[]).map((t) => ({ value: t, label: MCS_TABLE_LABELS[t] }));

export function AreaPhyFields({ area, onChange }: { area: ServiceArea; onChange: (p: Partial<ServiceArea>) => void }) {
  const fr = frequencyRange(area.frequencyGHz);
  const scsOptions = fr ? validScs(fr) : [];
  const bwOptions = fr ? validBandwidths(fr, area.scsKHz) : [];
  return (
    <Grid>
      <NumberField label="Frecuencia" unit="GHz" step={0.1} value={area.frequencyGHz} onChange={(v) => onChange({ frequencyGHz: v })} />
      <SelectField label="Duplexado" value={area.duplex} options={[{ value: 'FDD', label: 'FDD' }, { value: 'TDD', label: 'TDD' }]} onChange={(v) => onChange({ duplex: v })} />
      <SelectField
        label="Separación entre subportadoras"
        value={area.scsKHz}
        options={(scsOptions.includes(area.scsKHz) ? scsOptions : [area.scsKHz, ...scsOptions]).map((s) => ({ value: s, label: `${s} kHz` }))}
        onChange={(v) => onChange({ scsKHz: v })}
      />
      <SelectField
        label="Ancho de banda del canal"
        value={area.bandwidthMHz}
        options={(bwOptions.includes(area.bandwidthMHz) ? bwOptions : [area.bandwidthMHz, ...bwOptions]).map((b) => ({ value: b, label: `${b} MHz` }))}
        onChange={(v) => onChange({ bandwidthMHz: v })}
      />
      {area.duplex === 'TDD' && (
        <NumberField label="Proporción DL en TDD" percent step={1} min={0} max={100} value={area.tddDlRatio} onChange={(v) => onChange({ tddDlRatio: v })} />
      )}
      <NumberField label="Capas MIMO DL" step={1} min={1} max={8} value={area.dlLayers} onChange={(v) => onChange({ dlLayers: Math.max(1, Math.round(v)) })} />
      <NumberField label="Capas MIMO UL" step={1} min={1} max={4} value={area.ulLayers} onChange={(v) => onChange({ ulLayers: Math.max(1, Math.round(v)) })} />
      <SelectField label="Tabla MCS DL (PDSCH)" value={area.dlMcsTable} options={TABLE_OPTIONS} onChange={(v) => onChange({ dlMcsTable: v })} />
      <SelectField label="Tabla MCS UL (PUSCH)" value={area.ulMcsTable} options={TABLE_OPTIONS} onChange={(v) => onChange({ ulMcsTable: v })} />
    </Grid>
  );
}

function McsTable({ title, carrier }: { title: string; carrier: CarrierResult }) {
  return (
    <div className="table-wrap">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>MCS</th><th>Modulación</th><th>R</th><th>Eficiencia<br />(bit/sím.)</th><th>SNR<br />(dB)</th>
            <th>Margen interf.<br />(dB)</th><th>Sensibilidad<br />(dBm)</th><th>N<sub>info</sub></th><th>TBS<br />(bits)</th><th>Throughput<br />(Mbps)</th>
          </tr>
        </thead>
        <tbody>
          {carrier.rows.map((r) => (
            <tr key={r.index}>
              <td>{r.index}</td><td>{r.modulation}</td><td>{fmt(r.codeRate, 4)}</td><td>{fmt(r.efficiency, 4)}</td>
              <td>{fmt(r.snrDb, 1)}</td><td>{fmt(r.interferenceMarginDb, 1)}</td><td>{fmt(r.sensitivityDbm, 1)}</td>
              <td>{fmtInt(r.nInfo)}</td><td>{fmtInt(r.tbs)}</td><td>{fmt(r.throughputMbps, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PhyTab({ api, result }: { api: ScenarioApi; result: AreaResult }) {
  const { scenario, updatePhy, updateArea, updateEquipment } = api;
  const phy = scenario.phy;
  const area = result.area;
  const { ulCarrier, dlCarrier } = result.link;
  return (
    <>
      <Panel title="Parámetros comunes de capa física">
        <Grid>
          <NumberField label="Figura de ruido del UE" unit="dB" step={0.5} value={scenario.equipment.ueNoiseFigureDb} onChange={(v) => updateEquipment({ ueNoiseFigureDb: v })} />
          <NumberField label="Figura de ruido del gNB" unit="dB" step={0.5} value={scenario.equipment.gnbNoiseFigureDb} onChange={(v) => updateEquipment({ gnbNoiseFigureDb: v })} />
          <NumberField
            label="α de Shannon atenuado" step={0.05} min={0.1} max={1} value={phy.shannonAlpha}
            hint="SNR requerido: eficiencia = α · log2(1 + SNR)" onChange={(v) => updatePhy({ shannonAlpha: v })}
          />
          <NumberField label="Desplazamiento del SNR" unit="dB" step={0.5} value={phy.snrOffsetDb} onChange={(v) => updatePhy({ snrOffsetDb: v })} />
          {[2, 4, 6, 8].map((qm) => (
            <NumberField
              key={qm}
              label={`Margen de interferencia ${({ 2: 'QPSK', 4: '16QAM', 6: '64QAM', 8: '256QAM' } as Record<number, string>)[qm]}`}
              unit="dB" step={0.5}
              value={phy.interferenceMarginDb[qm] ?? 0}
              onChange={(v) => updatePhy({ interferenceMarginDb: { ...phy.interferenceMarginDb, [qm]: v } })}
            />
          ))}
          <SelectField label="Tipo de DMRS" value={phy.dmrsType} options={[{ value: 1, label: 'Tipo 1' }, { value: 2, label: 'Tipo 2' }]} onChange={(v) => updatePhy({ dmrsType: v })} />
          <SelectField label="Longitud DMRS" value={phy.dmrsLength} options={[{ value: 1, label: '1 símbolo' }, { value: 2, label: '2 símbolos' }]} onChange={(v) => updatePhy({ dmrsLength: v })} />
          <SelectField
            label="Posiciones DMRS adicionales" value={phy.dmrsAdditionalPositions}
            options={[0, 1, 2, 3].map((n) => ({ value: n as 0 | 1 | 2 | 3, label: String(n) }))}
            onChange={(v) => updatePhy({ dmrsAdditionalPositions: v })}
          />
          <SelectField
            label="Grupos CDM sin datos" value={phy.dmrsCdmGroupsWithoutData}
            options={[1, 2, 3].map((n) => ({ value: n as 1 | 2 | 3, label: String(n) }))}
            onChange={(v) => updatePhy({ dmrsCdmGroupsWithoutData: v })}
          />
          <SelectField
            label="Sobrecarga por PRB (xOverhead)" value={phy.overheadPerPrb}
            options={[0, 6, 12, 18].map((n) => ({ value: n as 0 | 6 | 12 | 18, label: `${n} RE` }))}
            onChange={(v) => updatePhy({ overheadPerPrb: v })}
          />
          <CheckField label="Prefijo cíclico extendido (sólo 60 kHz)" checked={phy.extendedCp} onChange={(v) => updatePhy({ extendedCp: v })} />
        </Grid>
      </Panel>

      <Panel title={`Portadora de la zona: ${area.name}`}>
        <AreaPhyFields area={area} onChange={(p) => updateArea(area.id, p)} />
        <Messages errors={ulCarrier.error ? [ulCarrier.error] : []} />
        {!ulCarrier.error && (
          <div className="stats">
            <Stat label="Rango de frecuencia" value={ulCarrier.fr ?? '—'} />
            <Stat label="PRB" value={fmtInt(ulCarrier.nPrb ?? NaN)} />
            <Stat label="Ancho de banda ocupado" value={fmt(ulCarrier.occupiedBandwidthHz / 1e6, 2)} unit="MHz" />
            <Stat label="RE por PRB (N'RE)" value={fmtInt(ulCarrier.rePerPrb)} />
            <Stat label="Slots por segundo" value={fmtInt(ulCarrier.slotsPerSecond)} />
          </div>
        )}
      </Panel>

      {!ulCarrier.error && (
        <Panel title="Throughput por MCS (una celda)">
          <McsTable title={`Enlace descendente · ${area.dlLayers} capa(s) · ${area.duplex === 'TDD' ? `${fmt(area.tddDlRatio * 100, 0)} % del tiempo` : 'FDD'}`} carrier={dlCarrier} />
          <McsTable title={`Enlace ascendente · ${area.ulLayers} capa(s) · ${area.duplex === 'TDD' ? `${fmt((1 - area.tddDlRatio) * 100, 0)} % del tiempo` : 'FDD'}`} carrier={ulCarrier} />
        </Panel>
      )}
    </>
  );
}
