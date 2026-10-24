import { useEffect, useId, useState, type ReactNode } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  /** Muestra y edita el valor como porcentaje (el modelo guarda fracciones) */
  percent?: boolean;
  hint?: string;
}

export function NumberField({ label, value, onChange, unit, step = 1, min, max, percent, hint }: NumberFieldProps) {
  const id = useId();
  const shown = percent ? round(value * 100) : value;
  const [text, setText] = useState(String(shown));
  // Sincroniza el texto si el valor cambia desde fuera (p. ej. al restaurar el escenario)
  useEffect(() => {
    setText((t) => (Number(t.replace(',', '.')) === shown ? t : String(shown)));
  }, [shown]);
  return (
    <label className="field" htmlFor={id} title={hint}>
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={text}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            setText(e.target.value);
            const v = Number(e.target.value.replace(',', '.'));
            if (e.target.value !== '' && Number.isFinite(v)) onChange(percent ? v / 100 : v);
          }}
        />
        {(unit || percent) && <span className="unit">{percent ? '%' : unit}</span>}
      </span>
    </label>
  );
}

const round = (x: number) => Math.round(x * 1e6) / 1e6;

interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}

export function SelectField<T extends string | number>({ label, value, options, onChange, hint }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <label className="field" htmlFor={id} title={hint}>
      <span className="field-label">{label}</span>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          if (opt) onChange(opt.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function CheckField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="field check" title={hint}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid">{children}</div>;
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}{unit && <small> {unit}</small>}</span>
    </div>
  );
}

export function Messages({ errors, warnings }: { errors?: string[]; warnings?: string[] }) {
  if (!errors?.length && !warnings?.length) return null;
  return (
    <div className="messages">
      {errors?.map((e) => <p key={e} className="msg error" role="alert">✖ {e}</p>)}
      {warnings?.map((w) => <p key={w} className="msg warning">⚠ {w}</p>)}
    </div>
  );
}
