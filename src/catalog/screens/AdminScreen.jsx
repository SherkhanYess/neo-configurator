import { useState, useCallback } from 'react';
import { PRICE_DEFAULTS, loadPrices, savePrices, resetPrices, SHANK_LABELS } from '../data/prices.js';
import { formatPrice } from '../data/priceCalc.js';

const CAST_LABELS = { halo: 'Хало', bezel: 'Безель' };

function NumInput({ value, onChange, step = 1000 }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '1.5px solid #DBE2EB',
        borderRadius: 12,
        fontSize: '0.92rem',
        fontFamily: 'JetBrains Mono, Courier New, monospace',
        fontWeight: 500,
        color: '#0B2040',
        background: '#FAFBFC',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontSize: '0.68rem', fontFamily: 'Manrope, sans-serif',
        fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#5B81A1', marginBottom: 16,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <label style={{ fontSize: '0.85rem', color: '#0B2040', fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: '0.78rem', color: '#5B81A1', fontFamily: 'Manrope, sans-serif' }}>
            {hint}
          </span>
        )}
      </div>
      <NumInput value={value} onChange={onChange} />
    </div>
  );
}

export default function AdminScreen() {
  const [prices, setPrices]  = useState(() => loadPrices());
  const [saved,  setSaved]   = useState(false);

  const setBase = useCallback((shank, val) => {
    setPrices(p => ({ ...p, baseByShank: { ...p.baseByShank, [shank]: val } }));
    setSaved(false);
  }, []);

  const setCast = useCallback((cast, val) => {
    setPrices(p => ({ ...p, casts: { ...p.casts, [cast]: val } }));
    setSaved(false);
  }, []);

  const setField = useCallback((key, val) => {
    setPrices(p => ({ ...p, [key]: val }));
    setSaved(false);
  }, []);

  function handleSave() {
    savePrices(prices);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!confirm('Сбросить все цены к значениям по умолчанию?')) return;
    resetPrices();
    setPrices(PRICE_DEFAULTS);
    setSaved(false);
  }

  const inputHint = (val) => val ? formatPrice(val) : null;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F2F5F9',
      fontFamily: 'Manrope, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0B2040',
        padding: '20px 24px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#DCC29B', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
              Neo Diamond
            </div>
            <div style={{ color: '#FAFBFC', fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Управление ценами
            </div>
          </div>
          <a
            href="/"
            style={{
              color: '#C2D1DE', fontSize: '0.8rem', textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Каталог
          </a>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 160px' }}>

        <Section title="Базовая цена по дизайну шинки">
          {SHANK_LABELS.map(shank => (
            <Field
              key={shank}
              label={shank}
              value={prices.baseByShank[shank] ?? 0}
              onChange={v => setBase(shank, v)}
              hint={inputHint(prices.baseByShank[shank])}
            />
          ))}
          <p style={{ fontSize: '0.76rem', color: '#5B81A1', margin: '4px 0 0', lineHeight: 1.5 }}>
            Базовая цена включает: кольцо с 1 карат белым бриллиантом, 585 пробу, классический каст
          </p>
        </Section>

        <Section title="Надбавки за тип каста">
          {Object.entries(CAST_LABELS).map(([id, label]) => (
            <Field
              key={id}
              label={label}
              value={prices.casts[id] ?? 0}
              onChange={v => setCast(id, v)}
              hint={inputHint(prices.casts[id])}
            />
          ))}
        </Section>

        <Section title="Каратность">
          <Field
            label="Цена за карат (сверх 1 кт)"
            value={prices.caratPrice}
            onChange={v => setField('caratPrice', v)}
            hint={inputHint(prices.caratPrice)}
          />
          <p style={{ fontSize: '0.76rem', color: '#5B81A1', margin: '4px 0 0', lineHeight: 1.5 }}>
            При выборе 1.5 кт → надбавка 0.5 × цена за карат
          </p>
        </Section>

        <Section title="Металл">
          <Field
            label="Надбавка 750 проба (18к)"
            value={prices.purity750surcharge}
            onChange={v => setField('purity750surcharge', v)}
            hint={inputHint(prices.purity750surcharge)}
          />
        </Section>

        <Section title="Цвет бриллиантов (фэнси)">
          <Field
            label="Центральный бриллиант — надбавка за карат"
            value={prices.fancyColorSurcharge}
            onChange={v => setField('fancyColorSurcharge', v)}
            hint={inputHint(prices.fancyColorSurcharge)}
          />
          <Field
            label="Россыпные бриллианты — фиксированная надбавка"
            value={prices.scatterFancySurcharge}
            onChange={v => setField('scatterFancySurcharge', v)}
            hint={inputHint(prices.scatterFancySurcharge)}
          />
          <p style={{ fontSize: '0.76rem', color: '#5B81A1', margin: '4px 0 0', lineHeight: 1.5 }}>
            При хало-касте россыпная надбавка применяется дважды
          </p>
        </Section>

      </div>

      {/* Sticky save bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(250,251,252,0.97)', borderTop: '1.5px solid #DBE2EB',
        backdropFilter: 'blur(16px)',
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 12 }}>
          <button
            onClick={handleReset}
            style={{
              flex: '0 0 auto',
              padding: '0 20px', height: 48,
              border: '1.5px solid #DBE2EB',
              borderRadius: 999, background: '#fff',
              fontSize: '0.85rem', fontWeight: 500, color: '#5B81A1',
              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
            }}
          >
            Сбросить
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              height: 48,
              border: 'none', borderRadius: 999,
              background: saved ? '#2e7d32' : '#0B2040',
              fontSize: '0.9rem', fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
              transition: 'background 0.2s',
            }}
          >
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
