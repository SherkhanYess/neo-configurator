import React from 'react';
import { DIAMOND_SHAPES } from '../config.js';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';

// SVG silhouettes for each diamond cut
const SHAPE_ICONS = {
  round: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <circle cx="16" cy="16" r="12" />
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <ellipse cx="16" cy="16" rx="9" ry="13" />
    </svg>
  ),
  pear: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 3 C10 3 7 8 7 13 C7 20 11 27 16 29 C21 27 25 20 25 13 C25 8 22 3 16 3Z" />
    </svg>
  ),
  marquise: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 3 L27 16 L16 29 L5 16 Z" />
    </svg>
  ),
  radiant: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <rect x="7" y="5" width="18" height="22" rx="2" />
    </svg>
  ),
  emerald: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <polygon points="10,4 22,4 28,8 28,24 22,28 10,28 4,24 4,8" />
    </svg>
  ),
  cushion: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <rect x="6" y="6" width="20" height="20" rx="6" />
    </svg>
  ),
  princess: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <rect x="7" y="7" width="18" height="18" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 27 C16 27 4 19 4 11.5 A6 6 0 0 1 16 8 A6 6 0 0 1 28 11.5 C28 19 16 27 16 27Z" />
    </svg>
  ),
  asscher: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <polygon points="10,4 22,4 28,10 28,22 22,28 10,28 4,22 4,10" />
    </svg>
  ),
};

export function DiamondShapeStep({ chosen, onChoose, onNext, onBack }) {
  return (
    <div className="cfg-step-content">
      <StepHeader title="Форма бриллианта" sub="Выберите огранку центрального камня" />

      <div className="cfg-shape-grid">
        {DIAMOND_SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            className={['cfg-shape-card', chosen === shape.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(shape)}
          >
            <span className="cfg-shape-icon">{SHAPE_ICONS[shape.id]}</span>
            <span className="cfg-shape-label">{shape.label}</span>
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
