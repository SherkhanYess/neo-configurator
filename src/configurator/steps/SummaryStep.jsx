import React, { useState, useEffect } from 'react';
import { LABEL_COLORS } from '../useIjewel.js';
import { LeadModal } from './LeadModal.jsx';
import { buildBreakdown } from '../priceBreakdown.js';

function ColorSwatch({ label }) {
  if (!label) return null;
  const color = LABEL_COLORS[label];
  if (!color) return <span>{label}</span>;
  return (
    <span className="cfg-summary-color">
      <span className="cfg-summary-color-dot" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

export function SummaryStep({ choices, sequence, onGoTo }) {
  const [showLead, setShowLead] = useState(false);
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    fetch('/api/get-prices').then(r => r.json()).then(setPrices).catch(() => {});
  }, []);

  const lines = buildBreakdown(choices, prices);

  // Map breakdown key → which step to navigate to on "Изменить"
  const stepByKey = {
    model:  'shank',
    cast:   'cast',
    carat:  'carat',
    purity: 'metal',
    metal:  'metal',
    gem1:   'carat',
    gem2:   'carat',
  };

  const isColorKey = { metal: true, gem1: true, gem2: true };

  return (
    <div className="cfg-step-content cfg-summary">
      <div className="cfg-summary-header">
        <span className="nd-eyebrow">Ваш заказ</span>
        <h2 className="cfg-step-title">Итог конфигурации</h2>
      </div>

      <div className="cfg-summary-list">
        {lines.map((line) => {
          const step = stepByKey[line.key];
          if (step && !sequence.includes(step)) return null;

          return (
            <div key={line.key} className="cfg-summary-row">
              <span className="cfg-summary-key">{line.label}</span>
              <span className="cfg-summary-val">
                {line.value
                  ? (isColorKey[line.key]
                      ? <ColorSwatch label={line.value} />
                      : <span>{line.value}</span>)
                  : null
                }
              </span>
              {step && (
                <button
                  type="button"
                  className="cfg-summary-edit"
                  onClick={() => onGoTo(step)}
                >
                  Изменить
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="cfg-summary-cta">
        <p className="cfg-summary-cta-note">
          Получите точную стоимость украшения прямо в WhatsApp — ответим за 10 секунд
        </p>
        <button
          type="button"
          className="cfg-wa-btn"
          onClick={() => setShowLead(true)}
        >
          <WhatsAppIcon />
          Получить стоимость на WhatsApp
        </button>
      </div>

      {showLead && (
        <LeadModal choices={choices} prices={prices} onClose={() => setShowLead(false)} />
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
