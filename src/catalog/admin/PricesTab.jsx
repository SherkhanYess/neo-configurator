import { useState, useEffect, useCallback } from 'react';
import { PRICE_DEFAULTS, fetchPrices, savePrices, SHANK_LABELS } from '../data/prices.js';
import { formatPrice } from '../data/priceCalc.js';

// Price editor. Reads and writes the server copy, so an edit here reaches every
// visitor — the previous version wrote to localStorage and never left this
// browser.

const CAST_LABELS = { halo: 'Хало', bezel: 'Безель' };

const C = {
  paper050: '#FAFBFC', paper300: '#DBE2EB',
  ink800: '#0B2040', ink400: '#5B81A1',
};

function NumInput({ value, onChange }) {
  return (
    <input
      type="number"
      step={1000}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      style={{
        width: '100%', padding: '10px 14px',
        border: `1.5px solid ${C.paper300}`, borderRadius: 12,
        fontSize: '0.92rem',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500, color: C.ink800, background: C.paper050,
        outline: 'none', boxSizing: 'border-box',
      }}
    />
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: C.ink400, marginBottom: 14,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, hint }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: '0.85rem', color: C.ink800, fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontSize: '0.78rem', color: C.ink400 }}>{hint}</span>}
      </div>
      <NumInput value={value} onChange={onChange} />
    </div>
  );
}

const note = { fontSize: '0.76rem', color: C.ink400, margin: '4px 0 0', lineHeight: 1.5 };

export default function PricesTab({ token }) {
  const [prices,  setPrices]  = useState(PRICE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');   // '', 'saving', 'saved'
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchPrices()
      .then(setPrices)
      .catch(() => setError('Не удалось загрузить текущие цены'))
      .finally(() => setLoading(false));
  }, []);

  const setBase  = useCallback((shank, v) => { setPrices(p => ({ ...p, baseByShank: { ...p.baseByShank, [shank]: v } })); setStatus(''); }, []);
  const setCast  = useCallback((cast,  v) => { setPrices(p => ({ ...p, casts: { ...p.casts, [cast]: v } })); setStatus(''); }, []);
  const setField = useCallback((key,   v) => { setPrices(p => ({ ...p, [key]: v })); setStatus(''); }, []);

  async function handleSave() {
    setStatus('saving');
    setError('');
    try {
      await savePrices(prices, token);
      setStatus('saved');
      setTimeout(() => setStatus(''), 2500);
    } catch (e) {
      setError(e.message);
      setStatus('');
    }
  }

  function handleReset() {
    if (!confirm('Вернуть цены к значениям по умолчанию? Изменения примутся только после сохранения.')) return;
    setPrices(PRICE_DEFAULTS);
    setStatus('');
  }

  const hint = (v) => (v ? formatPrice(v) : null);

  if (loading) {
    return <div style={{ color: C.ink400, fontSize: '0.88rem', padding: '8px 2px' }}>Загружаем цены...</div>;
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      <Section title="Базовая цена по дизайну шинки">
        {SHANK_LABELS.map(shank => (
          <Field key={shank} label={shank}
            value={prices.baseByShank?.[shank] ?? 0}
            onChange={v => setBase(shank, v)}
            hint={hint(prices.baseByShank?.[shank])} />
        ))}
        <p style={note}>
          Базовая цена включает: кольцо с 1 карат белым бриллиантом, 585 пробу, классический каст
        </p>
      </Section>

      <Section title="Надбавки за тип каста">
        {Object.entries(CAST_LABELS).map(([id, label]) => (
          <Field key={id} label={label}
            value={prices.casts?.[id] ?? 0}
            onChange={v => setCast(id, v)}
            hint={hint(prices.casts?.[id])} />
        ))}
      </Section>

      <Section title="Каратность">
        <Field label="Цена за карат (сверх 1 кт)"
          value={prices.caratPrice ?? 0}
          onChange={v => setField('caratPrice', v)}
          hint={hint(prices.caratPrice)} />
        <p style={note}>При выборе 1.5 кт → надбавка 0.5 × цена за карат</p>
      </Section>

      <Section title="Металл">
        <Field label="Надбавка 750 проба (18к)"
          value={prices.purity750surcharge ?? 0}
          onChange={v => setField('purity750surcharge', v)}
          hint={hint(prices.purity750surcharge)} />
      </Section>

      <Section title="Цвет бриллиантов (фэнси)">
        <Field label="Центральный бриллиант — надбавка за карат"
          value={prices.fancyColorSurcharge ?? 0}
          onChange={v => setField('fancyColorSurcharge', v)}
          hint={hint(prices.fancyColorSurcharge)} />
        <Field label="Россыпные бриллианты — фиксированная надбавка"
          value={prices.scatterFancySurcharge ?? 0}
          onChange={v => setField('scatterFancySurcharge', v)}
          hint={hint(prices.scatterFancySurcharge)} />
        <p style={note}>При хало-касте россыпная надбавка применяется дважды</p>
      </Section>

      {error && (
        <div style={{
          background: '#FCF3F2', border: '1.5px solid #E3B7B3', borderRadius: 14,
          padding: '12px 16px', fontSize: '0.85rem', color: '#A8322B', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(250,251,252,0.97)', borderTop: `1.5px solid ${C.paper300}`,
        backdropFilter: 'blur(16px)', padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 12 }}>
          <button onClick={handleReset} style={{
            flex: '0 0 auto', padding: '0 20px', height: 48,
            border: `1.5px solid ${C.paper300}`, borderRadius: 999, background: '#fff',
            fontSize: '0.85rem', fontWeight: 500, color: C.ink400,
            cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
          }}>
            Сбросить
          </button>
          <button onClick={handleSave} disabled={status === 'saving'} style={{
            flex: 1, height: 48, border: 'none', borderRadius: 999,
            background: status === 'saved' ? '#2e7d32' : C.ink800,
            fontSize: '0.9rem', fontWeight: 600, color: '#fff',
            cursor: status === 'saving' ? 'default' : 'pointer',
            fontFamily: 'Manrope, sans-serif', transition: 'background 0.2s',
            opacity: status === 'saving' ? 0.7 : 1,
          }}>
            {status === 'saving' ? 'Сохраняем...' : status === 'saved' ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
