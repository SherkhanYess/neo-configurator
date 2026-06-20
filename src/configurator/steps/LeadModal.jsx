import React, { useState, useCallback, useEffect } from 'react';
import { buildConfigUrl } from '../config.js';
import { calcPrice } from '../priceCalc.js';
import { buildBreakdown, formatBreakdownForWA } from '../priceBreakdown.js';

// Values must exactly match amoCRM enum values in the «Повод покупки» field
const OCCASIONS = [
  'Предложение',
  'Подарок',
  'Для себя',
];

// Values must exactly match amoCRM enum values in the «Когда нужно» field
const TIMINGS = [
  'До 5-дней',
  'В течений 10 дней',
  'В течений месяца',
  'Больше месяца',
];

const DIAL_CODES = [
  { code: '+7',   label: '🇰🇿 +7'   },
  { code: '+7',   label: '🇷🇺 +7'   },
  { code: '+998', label: '🇺🇿 +998' },
  { code: '+996', label: '🇰🇬 +996' },
  { code: '+994', label: '🇦🇿 +994' },
  { code: '+90',  label: '🇹🇷 +90'  },
  { code: '+49',  label: '🇩🇪 +49'  },
  { code: '+44',  label: '🇬🇧 +44'  },
  { code: '+1',   label: '🇺🇸 +1'   },
];

// Values must exactly match amoCRM enum values in the «Город заказа» field
const CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Актобе',
  'Актау',
  'Атырау',
  'Караганды',
  'Другой город',
];

function PillGroup({ options, value, onChange }) {
  return (
    <div className="lead-pills">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`lead-pill${value === opt ? ' lead-pill--active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SuccessScreen({ onClose }) {
  return (
    <div className="lead-success">
      <div className="lead-success-icon">💎</div>
      <h3 className="lead-success-title">Супер!</h3>
      <p className="lead-success-text">
        Мы получили ваш номер, в течение&nbsp;10&nbsp;секунд отправим стоимость украшения
      </p>
      <button type="button" className="lead-close-btn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}

export function LeadModal({ choices, prices: pricesProp, onClose }) {
  const [name, setName]         = useState('');
  const [dialCode, setDialCode] = useState('+7');
  const [localPhone, setLocalPhone] = useState('');
  const [city, setCity]         = useState('');
  const [occasion, setOccasion] = useState('');
  const [timing, setTiming]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [prices, setPrices]     = useState(pricesProp ?? null);

  // Lock background scroll while modal is open (iOS-safe: save scroll position)
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Fetch prices only if not passed from parent
  useEffect(() => {
    if (pricesProp) return;
    fetch('/api/get-prices')
      .then((r) => r.json())
      .then(setPrices)
      .catch(() => {});
  }, [pricesProp]);

  let utm = null;
  try { utm = JSON.parse(sessionStorage.getItem('nd_utm') ?? 'null'); } catch (_) {}

  let senderUtm = null;
  try { senderUtm = JSON.parse(sessionStorage.getItem('nd_sender_utm') ?? 'null'); } catch (_) {}

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    const phone = `${dialCode}${localPhone.replace(/\D/g, '')}`;

    if (!name.trim())       { setError('Введите ваше имя'); return; }
    if (!localPhone.trim()) { setError('Введите номер WhatsApp'); return; }
    if (!city)         { setError('Выберите город'); return; }
    if (!occasion)     { setError('Выберите повод покупки'); return; }
    if (!timing)       { setError('Выберите срок'); return; }

    setLoading(true);

    const estimatedPrice = prices ? calcPrice(choices, prices) : null;
    const breakdown = buildBreakdown(choices, prices);
    const configLinesWA = formatBreakdownForWA(breakdown);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      city,
      occasion,
      timing,
      estimatedPrice,
      configLinesWA,
      config: {
        shapeLabel: choices.shapeLabel,
        shankLabel: choices.shankLabel,
        castLabel:  choices.castLabel,
        carat:      choices.carat,
        gem1Label:  choices.gem1Label,
        gem2Label:  choices.gem2Label,
        purity:     choices.purity,
        metalLabel: choices.metalLabel,
      },
      configUrl: buildConfigUrl(choices),
      utm: utm ?? {},
      senderUtm: senderUtm ?? {},
    };

    // Show success immediately — server handles amoCRM + WhatsApp in background
    setSuccess(true);

    fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

  }, [name, dialCode, localPhone, city, occasion, timing, choices, utm, senderUtm]);

  return (
    <div className="lead-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lead-modal">
        <button
          type="button"
          className="lead-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>

        {success ? (
          <SuccessScreen onClose={onClose} />
        ) : (
          <form className="lead-form" onSubmit={handleSubmit} noValidate>
            <div className="lead-modal-header">
              <span className="nd-eyebrow">Получить стоимость</span>
              <h3 className="lead-modal-title">Оставьте контакт</h3>
              <p className="lead-modal-subtitle">
                Отправим расчёт цены в WhatsApp в течение 10 секунд
              </p>
            </div>

            <div className="lead-field">
              <label className="lead-label" htmlFor="lead-name">Ваше имя</label>
              <input
                id="lead-name"
                type="text"
                className="lead-input"
                placeholder="Айдана"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div className="lead-field">
              <label className="lead-label" htmlFor="lead-phone">Номер WhatsApp</label>
              <div className="lead-phone-row">
                <select
                  className="lead-dial-select"
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  aria-label="Код страны"
                >
                  {DIAL_CODES.map((d) => (
                    <option key={d.label} value={d.code}>{d.label}</option>
                  ))}
                </select>
                <input
                  id="lead-phone"
                  type="tel"
                  className="lead-input lead-phone-input"
                  placeholder="700 000 00 00"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  autoComplete="tel-national"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="lead-field">
              <label className="lead-label" htmlFor="lead-city">Ваш город</label>
              <select
                id="lead-city"
                className="lead-input lead-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="" disabled>Выберите город</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="lead-field">
              <label className="lead-label">Повод покупки</label>
              <PillGroup options={OCCASIONS} value={occasion} onChange={setOccasion} />
            </div>

            <div className="lead-field">
              <label className="lead-label">Когда нужно украшение?</label>
              <PillGroup options={TIMINGS} value={timing} onChange={setTiming} />
            </div>

            {error && <p className="lead-error">{error}</p>}

            <button
              type="submit"
              className="lead-submit-btn"
              disabled={loading}
            >
              {loading ? 'Отправляем…' : 'Получить стоимость в WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
