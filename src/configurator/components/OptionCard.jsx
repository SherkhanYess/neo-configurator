import React from 'react';

export function OptionCard({ label, sub, icon, color, selected, onClick, wide }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['cfg-option-card', selected ? 'is-selected' : '', wide ? 'is-wide' : ''].filter(Boolean).join(' ')}
    >
      {color !== undefined && (
        <span className="cfg-option-swatch" style={{ background: color }} />
      )}
      {icon && !color && (
        <span className="cfg-option-icon">{icon}</span>
      )}
      <span className="cfg-option-label">{label}</span>
      {sub && <span className="cfg-option-sub">{sub}</span>}
    </button>
  );
}
