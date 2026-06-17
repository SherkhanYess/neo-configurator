import React from 'react';
import { CAST_DESIGNS } from '../config.js';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';

const CAST_ICONS = {
  classic: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="24" cy="18" r="8" />
      <path d="M18 24 L14 36" />
      <path d="M30 24 L34 36" />
      <path d="M20 26 L28 26" />
      <path d="M14 36 Q24 40 34 36" />
    </svg>
  ),
  halo: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="24" cy="18" r="7" />
      <circle cx="24" cy="18" r="12" strokeDasharray="3 2" />
      <path d="M18 28 L14 38" />
      <path d="M30 28 L34 38" />
      <path d="M14 38 Q24 42 34 38" />
    </svg>
  ),
  bezel: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="24" cy="18" r="10" />
      <circle cx="24" cy="18" r="6" />
      <path d="M16 26 L12 38" />
      <path d="M32 26 L36 38" />
      <path d="M12 38 Q24 42 36 38" />
    </svg>
  ),
};

export function CastDesignStep({ chosen, onChoose, onNext, onBack }) {
  return (
    <div className="cfg-step-content">
      <StepHeader title="Дизайн каста" sub="Способ крепления центрального бриллианта" />

      <div className="cfg-cast-grid">
        {CAST_DESIGNS.map((cast) => (
          <button
            key={cast.id}
            type="button"
            className={['cfg-cast-card', chosen === cast.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(cast)}
          >
            <span className="cfg-cast-icon">{CAST_ICONS[cast.id]}</span>
            <span className="cfg-cast-label">{cast.label}</span>
            <span className="cfg-cast-sub">{cast.sub}</span>
          </button>
        ))}
      </div>

      <div className="cfg-step-actions">
        <button type="button" className="cfg-back-btn" onClick={onBack}>← Назад</button>
        <Button variant="primary" onClick={onNext} disabled={!chosen} fullWidth>
          Далее
        </Button>
      </div>
    </div>
  );
}
