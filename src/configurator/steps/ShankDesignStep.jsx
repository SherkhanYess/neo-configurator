import React from 'react';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';

const FALLBACK_SHANKS = [
  { id: 'Neo',         label: 'Neo' },
  { id: 'Neo Luxe',    label: 'Neo Luxe' },
  { id: 'Sirius',      label: 'Sirius' },
  { id: 'Sirius Luxe', label: 'Sirius Luxe' },
  { id: 'Bezel',       label: 'Bezel' },
];

export function ShankDesignStep({ chosen, onChoose, onNext, onBack, variations, castChosen }) {
  const allShanks = variations?.length > 0 ? variations : FALLBACK_SHANKS;

  // Bezel shank only visible when bezel cast is selected
  const shanks = allShanks.filter((s) => {
    if (s.id === 'Bezel') return castChosen === 'bezel';
    return true;
  });

  return (
    <div className="cfg-step-content">
      <StepHeader title="Shank" sub="Выберите дизайн шинки" />

      <div className="cfg-option-grid" style={{ '--grid-cols': 2 }}>
        {shanks.map((shank) => (
          <button
            key={shank.id}
            type="button"
            className={['cfg-option-card', chosen === shank.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(shank)}
          >
            <span className="cfg-option-label">{shank.label}</span>
          </button>
        ))}
      </div>

      <div className="cfg-step-actions">
        <button type="button" className="cfg-back-btn" onClick={onBack}>← Назад</button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={chosen === null || chosen === undefined}
          fullWidth
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
