import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt } from './format';

// Paleta categórica validada (orden fijo; ver la skill de visualización de datos)
const LIGHT = { series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'], grid: '#e4e3df', text: '#52514e', surface: '#fcfcfb' };
const DARK = { series: ['#3987e5', '#d95926', '#199e70', '#c98500'], grid: '#3a3a37', text: '#c3c2b7', surface: '#1a1a19' };

function useDark(): boolean {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia(query);
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

export interface SeriesDef {
  key: string;
  label: string;
}

interface Props {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  series: SeriesDef[];
  unit?: string;
  decimals?: number;
  height?: number;
}

/** Barras agrupadas con leyenda y tooltip; los colores siguen a la serie, no a su posición en pantalla. */
export function GroupedBars({ title, data, xKey, series, unit, decimals = 0, height = 260 }: Props) {
  const theme = useDark() ? DARK : LIGHT;
  const format = (v: number) => `${fmt(v, decimals)}${unit ? ` ${unit}` : ''}`;
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={theme.grid} />
          <XAxis dataKey={xKey} tick={{ fill: theme.text, fontSize: 12 }} axisLine={{ stroke: theme.grid }} tickLine={false} />
          <YAxis tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v, 0)} width={64} />
          <Tooltip
            formatter={(v) => format(Number(v))}
            cursor={{ fill: theme.grid, opacity: 0.4 }}
            contentStyle={{ background: theme.surface, borderColor: theme.grid, color: theme.text }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: theme.text }}
            itemSorter={(item) => series.findIndex((s) => s.key === item.dataKey)}
            formatter={(value) => <span style={{ color: theme.text }}>{value}</span>}
          />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={theme.series[i % theme.series.length]} radius={[4, 4, 0, 0]} stroke={theme.surface} strokeWidth={1} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
