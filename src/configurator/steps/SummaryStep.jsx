import React, { useState } from 'react';
import { LABEL_COLORS } from '../useIjewel.js';
import { LeadModal } from './LeadModal.jsx';

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

const SUMMARY_LABELS = {
  shapeLabel:  { label: 'Форма бриллианта', step: 'diamond' },
  shankLabel:  { label: 'Дизайн оправы',    step: 'shank' },
  castLabel:   { label: 'Дизайн каста',     step: 'cast' },
  carat:       { label: 'Каратность',        step: 'carat', format: (v) => `${v} кар` },
  gem1Label:   { label: 'Цвет центр. бриллианта', step: 'carat', isColor: true },
  gem2Label:   { label: 'Цвет россыпи',     step: 'carat', isColor: true },
  metalLabel:  { label: 'Цвет металла',     step: 'metal', isColor: true },
};

const UTM_LABELS = {
  utm_source:   'Источник',
  utm_medium:   'Канал',
  utm_campaign: 'Кампания',
  utm_term:     'Ключевое слово',
  utm_content:  'Контент',
};

function UtmBlock() {
  let utm = null;
  try { utm = JSON.parse(sessionStorage.getItem('nd_utm') ?? 'null'); } catch (_) {}
  if (!utm || !Object.keys(utm).length) return null;
  return (
    <div className="cfg-utm-block">
      <div className="cfg-utm-title">UTM-данные</div>
      {Object.entries(utm).map(([k, v]) => (
        <div key={k} className="cfg-utm-row">
          <span className="cfg-utm-key">{UTM_LABELS[k] ?? k}</span>
          <span className="cfg-utm-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function SummaryStep({ choices, sequence, onGoTo }) {
  const [showLead, setShowLead] = useState(false);

  const rows = Object.entries(SUMMARY_LABELS).filter(([key]) => {
    const def = SUMMARY_LABELS[key];
    const val = choices[key];
    return sequence.includes(def.step) && val !== null && val !== undefined;
  });

  return (
    <div className="cfg-step-content cfg-summary">
      <div className="cfg-summary-header">
        <span className="nd-eyebrow">Ваш заказ</span>
        <h2 className="cfg-step-title">Итог конфигурации</h2>
      </div>

      <div className="cfg-summary-list">
        {rows.map(([key, def]) => {
          const raw = choices[key];
          return (
            <div key={key} className="cfg-summary-row">
              <span className="cfg-summary-key">{def.label}</span>
              <span className="cfg-summary-val">
                {def.isColor
                  ? <ColorSwatch label={raw} />
                  : def.format ? def.format(raw) : String(raw)
                }
              </span>
              <button
                type="button"
                className="cfg-summary-edit"
                onClick={() => onGoTo(def.step)}
              >
                Изменить
              </button>
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

      <UtmBlock />

      {showLead && (
        <LeadModal choices={choices} onClose={() => setShowLead(false)} />
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
