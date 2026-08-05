import React, { useState } from 'react';
import { CARAT_OPTIONS } from '../config.js';
import { LABEL_COLORS } from '../useIjewel.js';
import { StepHeader } from '../components/StepHeader.jsx';
import { Button } from '../../components/core/Button.jsx';
import { formatPrice } from '../priceCalc.js';

const GEM_DISPLAY_LABELS = { 'Рубин': 'Красный' };

function ColorPicker({ options, chosen, onChoose }) {
  if (!options?.length) return null;
  return (
    <div className="cfg-color-row">
      {options.map((opt) => {
        const color = LABEL_COLORS[opt.label] ?? '#888';
        const isSelected = chosen === opt.uuid;
        const displayLabel = GEM_DISPLAY_LABELS[opt.label] ?? opt.label;
        return (
          <button
            key={opt.uuid}
            type="button"
            className={['cfg-color-btn', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onChoose(opt.uuid, opt.label)}
            title={displayLabel}
          >
            <span className="cfg-color-circle" style={{ background: color }} />
            <span className="cfg-color-name">{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CaratStep({
  carat, gem1, gem2,
  gem1Options, gem2Options,
  cast, prices,
  onChooseCarat, onChooseGem1, onChooseGem2,
  onNext, onBack,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const hasScatter = cast !== 'bezel';
  const canNext = carat !== null && carat !== undefined;

  const caratPrice    = prices?.caratPrice ?? 200000;
  const fancyPerCarat = prices?.fancyColorSurcharge ?? 100000;
  const scatterPrice  = prices?.scatterFancySurcharge ?? 150000;

  return (
    <div className="cfg-step-content">
      <StepHeader title="Характеристики бриллианта" />

      <button
        type="button"
        className="cfg-info-btn cfg-info-btn--sub"
        onClick={() => setShowInfo((v) => !v)}
      >
        ⓘ <span className="cfg-info-btn-text">как считается стоимость</span>
      </button>

      {showInfo && (
        <div className="cfg-info-box">
          <p>Первый карат входит в базовую стоимость — бесплатно.</p>
          <p>Каждый следующий карат прибавляет <strong>{formatPrice(caratPrice)}</strong>.<br/>
            <span className="cfg-info-example">(например 1.5 кар — это +{formatPrice(caratPrice * 0.5)})</span>
          </p>
          <p><strong>Цвет бриллианта:</strong></p>
          <ul>
            <li>Белый бриллиант — по умолчанию, доплаты нет</li>
            <li>Фантазийный цвет (не белый) — +<strong>{formatPrice(fancyPerCarat)}</strong> за каждый карат</li>
            <li>Фантазийный цвет россыпи — <strong>{formatPrice(scatterPrice)}</strong> за дорожку и ореол отдельно</li>
          </ul>
        </div>
      )}

      <div className="cfg-carat-sections">
        <div className="cfg-section">
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

        {hasScatter && gem2Options?.length > 0 && (
          <div className="cfg-section">
            <div className="cfg-section-label">Цвет россыпных бриллиантов</div>
            <ColorPicker options={gem2Options} chosen={gem2} onChoose={onChooseGem2} />
          </div>
        )}
      </div>

      <div className="cfg-step-actions">
        <button type="button" className="cfg-back-btn" onClick={onBack}>← Назад</button>
        <Button variant="primary" onClick={onNext} disabled={!canNext} fullWidth>
          Далее
        </Button>
      </div>
    </div>
  );
}
