import React from 'react';
import { CARAT_OPTIONS } from '../config.js';
import { LABEL_COLORS } from '../useIjewel.js';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';

function ColorPicker({ options, chosen, onChoose }) {
  if (!options?.length) return null;
  return (
    <div className="cfg-color-row">
      {options.map((opt) => {
        const color = LABEL_COLORS[opt.label] ?? '#888';
        const isSelected = chosen === opt.uuid;
        return (
          <button
            key={opt.uuid}
            type="button"
            className={['cfg-color-btn', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(opt.uuid, opt.label)}
            title={opt.label}
          >
            <span className="cfg-color-circle" style={{ background: color }} />
            <span className="cfg-color-name">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CaratStep({
  carat, gem1, gem2,
  gem1Options, gem2Options,
  onChooseCarat, onChooseGem1, onChooseGem2,
  onNext, onBack,
}) {
  const canNext = carat !== null && carat !== undefined;

  return (
    <div className="cfg-step-content">
      <StepHeader title="Характеристики бриллианта" sub="Каратность и цвет" />

      <div className="cfg-section">
        <div className="cfg-section-label">Каратность</div>
        <div className="cfg-carat-row">
          {CARAT_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={['cfg-carat-btn', carat === c ? 'is-selected' : ''].filter(Boolean).join(' ')}
              onClick={() => onChooseCarat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {gem1Options?.length > 0 && (
        <div className="cfg-section">
          <div className="cfg-section-label">Цвет центрального бриллианта</div>
          <ColorPicker options={gem1Options} chosen={gem1} onChoose={onChooseGem1} />
        </div>
      )}

      {gem2Options?.length > 0 && (
        <div className="cfg-section">
          <div className="cfg-section-label">Цвет россыпных бриллиантов</div>
          <ColorPicker options={gem2Options} chosen={gem2} onChoose={onChooseGem2} />
        </div>
      )}

      <div className="cfg-step-actions">
        <button type="button" className="cfg-back-btn" onClick={onBack}>← Назад</button>
        <Button variant="primary" onClick={onNext} disabled={!canNext} fullWidth>
          Далее
        </Button>
      </div>
    </div>
  );
}
