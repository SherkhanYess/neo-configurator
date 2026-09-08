import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, saveProducts, defaultProducts } from '../data/products.js';
import { SHAPES } from '../data/config.js';

// Controls what the catalog shows and how it is named.
//
// The iJewel bindings are intentionally not editable here — shank names and
// shape tags must match the 3D model exactly, so they stay in the bundle. What
// you can do is hide a product, or rename it.

const C = {
  paper050: '#FAFBFC', paper100: '#F2F5F9', paper200: '#E9EDF3', paper300: '#DBE2EB',
  ink800: '#0B2040', ink600: '#1E3149', ink400: '#5B81A1', champ700: '#7C6035',
};

const CAST_LABELS = { classic: 'Classic', halo: 'Halo', bezel: 'Bezel' };

function Section({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: C.ink400, marginBottom: hint ? 6 : 14,
      }}>{title}</div>
      {hint && <p style={{ fontSize: '0.78rem', color: C.ink400, margin: '0 0 14px', lineHeight: 1.55 }}>{hint}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 46, height: 27, flexShrink: 0, borderRadius: 50, cursor: 'pointer',
        border: `1.5px solid ${on ? C.ink800 : C.paper300}`,
        background: on ? C.ink800 : '#fff',
        position: 'relative', transition: 'background 0.18s, border-color 0.18s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 21 : 2,
        width: 19, height: 19, borderRadius: '50%',
        background: on ? '#fff' : C.paper300,
        transition: 'left 0.18s',
      }} />
    </button>
  );
}

function Row({ children, dimmed }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#fff', border: `1.5px solid ${C.paper300}`,
      borderRadius: 14, padding: '12px 14px',
      opacity: dimmed ? 0.55 : 1, transition: 'opacity 0.18s',
    }}>
      {children}
    </div>
  );
}

const textInput = {
  flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 10,
  border: `1.5px solid ${C.paper300}`, background: C.paper050,
  fontSize: '0.88rem', color: C.ink800, fontFamily: 'Manrope, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

export default function ProductsTab({ token }) {
  const [cfg,     setCfg]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchProducts()
      .then(setCfg)
      .catch(() => setError('Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  }, []);

  const touch = () => setStatus('');

  const setShape = useCallback((id, patch) => {
    setCfg(c => ({ ...c, shapes: c.shapes.map(s => (s.id === id ? { ...s, ...patch } : s)) }));
    touch();
  }, []);

  const setRing = useCallback((shank, cast, patch) => {
    setCfg(c => ({
      ...c,
      rings: c.rings.map(r => (r.shank === shank && r.cast === cast ? { ...r, ...patch } : r)),
    }));
    touch();
  }, []);

  const setPusety = useCallback((cast, shape, patch) => {
    setCfg(c => ({
      ...c,
      pusety: c.pusety.map(p => (p.cast === cast && p.shape === shape ? { ...p, ...patch } : p)),
    }));
    touch();
  }, []);

  async function handleSave() {
    setStatus('saving');
    setError('');
    try {
      const saved = await saveProducts(cfg, token);
      setCfg(saved);
      setStatus('saved');
      setTimeout(() => setStatus(''), 2500);
    } catch (e) {
      setError(e.message);
      setStatus('');
    }
  }

  function handleReset() {
    if (!confirm('Вернуть все товары к исходному состоянию? Изменения примутся только после сохранения.')) return;
    setCfg(defaultProducts());
    setStatus('');
  }

  if (loading) return <div style={{ color: C.ink400, fontSize: '0.88rem', padding: '8px 2px' }}>Загружаем товары...</div>;
  if (!cfg)    return <div style={{ color: '#A8322B', fontSize: '0.88rem' }}>{error || 'Нет данных'}</div>;

  const shapeFile = (id) => SHAPES.find(s => s.id === id)?.file;
  const enabledShapeIds = new Set(cfg.shapes.filter(s => s.enabled).map(s => s.id));
  const offCount = cfg.shapes.filter(s => !s.enabled).length
                 + cfg.rings.filter(r => !r.enabled).length
                 + cfg.pusety.filter(p => !p.enabled).length;

  return (
    <div style={{ paddingBottom: 96 }}>

      <Section
        title="Огранки"
        hint="Выключенная огранка исчезает из выбора и из витрины. Название можно изменить — оно попадёт в имя карточки."
      >
        {cfg.shapes.map(s => (
          <Row key={s.id} dimmed={!s.enabled}>
            <img
              src={`/assets/shapes/${shapeFile(s.id)}`}
              alt=""
              width={32} height={32}
              style={{ borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
            />
            <input
              value={s.label}
              onChange={e => setShape(s.id, { label: e.target.value })}
              style={textInput}
            />
            <Toggle on={s.enabled} onChange={v => setShape(s.id, { enabled: v })} />
          </Row>
        ))}
      </Section>

      <Section
        title="Кольца"
        hint="Сочетание шинки и каста. Привязка к 3D-модели зашита в код и здесь не меняется — можно скрыть позицию или переименовать её."
      >
        {cfg.rings.map(r => (
          <Row key={`${r.shank}|${r.cast}`} dimmed={!r.enabled}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={r.name}
                onChange={e => setRing(r.shank, r.cast, { name: e.target.value })}
                style={{ ...textInput, width: '100%', marginBottom: 4 }}
              />
              <div style={{
                fontSize: '0.7rem', color: C.ink400,
                fontFamily: '"JetBrains Mono", "Courier New", monospace',
              }}>
                {r.shank} · {CAST_LABELS[r.cast] ?? r.cast}
              </div>
            </div>
            <Toggle on={r.enabled} onChange={v => setRing(r.shank, r.cast, { enabled: v })} />
          </Row>
        ))}
      </Section>

      <Section
        title="Пусеты"
        hint="Какие огранки доступны для каждого стиля. Позиция показывается только если её огранка включена выше."
      >
        {['classic', 'halo'].map(cast => {
          const rows = cfg.pusety.filter(p => p.cast === cast);
          if (!rows.length) return null;
          return (
            <div key={cast} style={{ marginBottom: 6 }}>
              <div style={{
                fontSize: '0.74rem', fontWeight: 700, color: C.champ700,
                letterSpacing: '0.06em', margin: '8px 0 8px 2px',
              }}>
                {CAST_LABELS[cast]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map(p => (
                  <Row key={`${p.cast}|${p.shape}`} dimmed={!p.enabled || !enabledShapeIds.has(p.shape)}>
                    <span style={{ flex: 1, fontSize: '0.88rem', color: C.ink600 }}>
                      {cfg.shapes.find(s => s.id === p.shape)?.label ?? p.shape}
                      {!enabledShapeIds.has(p.shape) && (
                        <span style={{ fontSize: '0.72rem', color: C.ink400 }}> · огранка выключена</span>
                      )}
                    </span>
                    <Toggle on={p.enabled} onChange={v => setPusety(p.cast, p.shape, { enabled: v })} />
                  </Row>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {offCount > 0 && (
        <p style={{ fontSize: '0.78rem', color: C.ink400, margin: '0 2px 16px', lineHeight: 1.55 }}>
          Скрыто позиций: {offCount}. Изменения вступят в силу после сохранения.
        </p>
      )}

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
