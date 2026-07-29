import React, { useState } from 'react';
import logoWhite from '../../assets/logo/neo-diamond-logo-white.png';

const TIMING_OPTIONS = [
  { label: 'В течение недели',   amoValue: 'До 5-дней' },
  { label: 'В течение месяца',   amoValue: 'В течений месяца' },
  { label: 'Пока присматриваюсь', amoValue: 'Больше месяца' },
];

function getUtm() {
  try { return JSON.parse(sessionStorage.getItem('nd_utm') || '{}'); } catch { return {}; }
}

export function LeadFormStep({ onStart }) {
  const [name,   setName]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [timing, setTiming] = useState(null);
  const [busy,   setBusy]   = useState(false);

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 7 && timing;

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);

    const digits   = phone.replace(/\D/g, '');
    const fullPhone = `+7${digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits}`;
    const timingOpt = TIMING_OPTIONS.find(o => o.label === timing);

    try {
      sessionStorage.setItem('nd_lead_pre', JSON.stringify({ name: name.trim(), phone: fullPhone, timing }));
    } catch {}

    // Fire-and-forget — don't block UX
    fetch('/api/submit-lead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       name.trim(),
        phone:      fullPhone,
        timing:     timingOpt?.amoValue || timing,
        preCapture: true,
        utm:        getUtm(),
      }),
    }).catch(() => {});

    setBusy(false);
    onStart('diamond');
  };

  return (
    <div className="cfg-lead">
      <div className="cfg-lead-inner">
        <img src={logoWhite} alt="Neo Diamond" className="cfg-lead-logo" />

        <h1 className="cfg-lead-title">Давайте<br />познакомимся</h1>
        <p className="cfg-lead-sub">Это займёт 10 секунд — а мы покажем живую цену прямо в конструкторе</p>

        <div className="cfg-lead-fields">
          <input
            className="cfg-lead-input"
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="given-name"
          />

          <div className="cfg-lead-phone-row">
            <span className="cfg-lead-dial">+7</span>
            <input
              className="cfg-lead-input cfg-lead-phone-input"
              type="tel"
              inputMode="numeric"
              placeholder="777 123 45 67"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              autoComplete="tel-national"
            />
          </div>

          <div className="cfg-lead-timing-label">Когда нужно украшение?</div>
          <div className="cfg-lead-pills">
            {TIMING_OPTIONS.map(opt => (
              <button
                key={opt.label}
                type="button"
                className={['cfg-lead-pill', timing === opt.label ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => setTiming(opt.label)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="cfg-lead-submit"
          onClick={handleSubmit}
          disabled={!canSubmit || busy}
        >
          {busy ? 'Загрузка...' : 'Начать создание →'}
        </button>
      </div>
    </div>
  );
}
