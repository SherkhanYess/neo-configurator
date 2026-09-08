import { useState, useRef, useEffect } from 'react';

// Collects the two fields amoCRM actually requires — name and phone — right
// before handing the visitor over to WhatsApp.
//
// Until now the catalog opened wa.me directly, so a visitor who never pressed
// "send" in WhatsApp left no trace at all: no contact, no deal, no attribution.
// Everything else about the ring already travels in the WhatsApp text and in
// the lead note, so asking for more here would only cost conversions.

const C = {
  paper050: '#FAFBFC',
  paper100: '#F2F5F9',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
  wa:       '#25D366',
  danger:   '#A8322B',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: `1.5px solid ${C.paper300}`,
  background: '#fff',
  color: C.ink800,
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1rem',
  outline: 'none',
};

const labelStyle = {
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.ink400,
  marginBottom: 8,
  display: 'block',
};

// "7015" -> "701 5", "7015551234" -> "701 555 12 34"
function formatKzPhone(digits) {
  const d = digits.slice(0, 10);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  return parts.filter(Boolean).join(' ');
}

export default function LeadCaptureModal({ onClose, onSubmit, submitting }) {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim())      { setError('Введите ваше имя'); return; }
    if (phone.length < 10) { setError('Введите номер полностью'); return; }
    setError('');
    // Must stay inside the submit gesture — window.open runs in here.
    onSubmit({ name: name.trim(), phone: `+7${phone}` });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Контактные данные"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(11,32,64,0.42)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        background: C.paper050,
        borderRadius: '28px 28px 0 0',
        width: '100%', maxWidth: 480,
        padding: '28px 24px calc(28px + env(safe-area-inset-bottom))',
        fontFamily: 'Manrope, sans-serif',
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.champ700, marginBottom: 8,
          }}>
            Последний шаг
          </div>
          <h3 style={{
            fontFamily: '"Unbounded", sans-serif', fontWeight: 300,
            fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1.25,
            margin: '0 0 8px', color: C.ink800,
          }}>
            Как к вам обращаться?
          </h3>
          <p style={{ margin: 0, fontSize: '0.87rem', color: C.ink400, lineHeight: 1.6 }}>
            Сохраним вашу конфигурацию, чтобы менеджер видел её до начала разговора.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="lead-name">Имя</label>
            <input
              id="lead-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
              placeholder="Айгерим"
              autoComplete="name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="lead-phone">Номер WhatsApp</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                ...inputStyle, width: 'auto', flexShrink: 0,
                background: C.paper100, color: C.ink600, fontWeight: 600,
              }}>
                +7
              </span>
              <input
                id="lead-phone"
                type="tel"
                inputMode="numeric"
                value={formatKzPhone(phone)}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (error) setError(''); }}
                placeholder="701 555 12 34"
                autoComplete="tel-national"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div role="alert" style={{ fontSize: '0.83rem', color: C.danger }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', minHeight: 56, padding: '16px 20px',
              borderRadius: 50, border: 'none',
              cursor: submitting ? 'default' : 'pointer',
              background: C.wa, color: '#fff',
              fontSize: '0.97rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(37,211,102,0.42)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Открываем WhatsApp...' : 'Продолжить в WhatsApp'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.83rem', color: C.ink400,
              fontFamily: 'Manrope, sans-serif', padding: '4px 0',
            }}
          >
            Назад
          </button>
        </form>
      </div>
    </div>
  );
}
