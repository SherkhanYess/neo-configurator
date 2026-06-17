import React, { useState, useCallback } from 'react';
import { buildConfigUrl } from '../config.js';

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

export function LeadModal({ choices, onClose }) {
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [city, setCity]         = useState('');
  const [occasion, setOccasion] = useState('');
  const [timing, setTiming]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  let utm = null;
  try { utm = JSON.parse(sessionStorage.getItem('nd_utm') ?? 'null'); } catch (_) {}

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim())  { setError('Введите ваше имя'); return; }
    if (!phone.trim()) { setError('Введите номер WhatsApp'); return; }
    if (!city)         { setError('Выберите город'); return; }
    if (!occasion)     { setError('Выберите повод покупки'); return; }
    if (!timing)       { setError('Выберите срок'); return; }

    setLoading(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      city,
      occasion,
      timing,
      config: {
        shapeLabel: choices.shapeLabel,
        shankLabel: choices.shankLabel,
        castLabel:  choices.castLabel,
        carat:      choices.carat,
        gem1Label:  choices.gem1Label,
        gem2Label:  choices.gem2Label,
        metalLabel: choices.metalLabel,
      },
      configUrl: buildConfigUrl(choices),
      utm: utm ?? {},
    };

    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'Ошибка отправки. Попробуйте ещё раз.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Нет соединения. Попробуйте ещё раз.');
      setLoading(false);
    }
  }, [name, phone, city, occasion, timing, choices, utm]);

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
              <input
                id="lead-phone"
                type="tel"
                className="lead-input"
                placeholder="+7 700 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
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
