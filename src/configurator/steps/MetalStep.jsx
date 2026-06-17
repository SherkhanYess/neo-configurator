import React from 'react';
import { LABEL_COLORS } from '../useIjewel.js';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';

function MetalPicker({ options, chosen, onChoose }) {
  if (!options?.length) return null;
  return (
    <div className="cfg-color-row">
      {options.map((m) => {
        const color = LABEL_COLORS[m.label] ?? '#888';
        const isSelected = chosen === m.uuid;
        return (
          <button
            key={m.uuid}
            type="button"
            className={['cfg-color-btn', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(m.uuid, m.label)}
            title={m.label}
          >
            <span className="cfg-color-circle" style={{ background: color }} />
            <span className="cfg-color-name">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MetalStep({
  shankMetal, castMetal, combinedGold,
  shankMetalOptions, castMetalOptions,
  onChooseShankMetal, onToggleCombined, onChooseCastMetal,
  onNext, onBack,
}) {
  const canNext = !!shankMetal;

  return (
    <div className="cfg-step-content">
      <StepHeader title="Металл" sub="Цвет сплава" />

      <div className="cfg-section">
        <div className="cfg-section-label">Цвет металла</div>
        <MetalPicker
          options={shankMetalOptions}
          chosen={shankMetal}
          onChoose={onChooseShankMetal}
        />
      </div>

      {shankMetal && (
        <div className="cfg-section">
          <label className="cfg-toggle-row">
            <input
              type="checkbox"
              className="cfg-toggle-checkbox"
              checked={!!combinedGold}
              onChange={(e) => onToggleCombined(e.target.checked)}
            />
            <span className="cfg-toggle-label">Комбинированное золото</span>
          </label>
        </div>
      )}

      {combinedGold && (
        <div className="cfg-section cfg-section--animate">
          <div className="cfg-section-label">Цвет золота каста</div>
          <MetalPicker
            options={castMetalOptions}
            chosen={castMetal}
            onChoose={onChooseCastMetal}
          />
        </div>
      )}

      <div className="cfg-step-actions">
        <button type="button" className="cfg-back-btn" onClick={onBack}>← Назад</button>
        <Button variant="primary" onClick={onNext} disabled={!canNext} fullWidth>
          К итогам
        </Button>
      </div>
    </div>
  );
}
