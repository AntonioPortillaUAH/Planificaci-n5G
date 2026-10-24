import type { AreaId, ServiceArea } from '../engine';

export function AreaPicker({ areas, value, onChange }: { areas: ServiceArea[]; value: AreaId; onChange: (id: AreaId) => void }) {
  return (
    <div className="segmented" role="tablist" aria-label="Zona de servicio">
      {areas.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={a.id === value}
          className={a.id === value ? 'active' : ''}
          onClick={() => onChange(a.id)}
        >
          {a.name}
        </button>
      ))}
    </div>
  );
}
