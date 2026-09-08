import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SHAPES, PUSETЫ_SHAPES_BY_CAST, PUSETЫ_CASTS, SHAPE_IJEWEL, CAST_IJEWEL, pusetyCardName } from '../data/config.js';
import { LABEL_COLORS } from '../hooks/useIjewel.js';
import { track, EVENTS } from '../lib/track.js';

const CARAT_OPTIONS = [0.5, 1, 1.5, 2, 3];

function DotPicker({ options, chosen, onChoose }) {
  if (!options?.length) return null;
  return (
    <div className="dot-picker">
      {options.map((opt) => {
        const color = LABEL_COLORS[opt.label] ?? '#888';
        const isSelected = chosen === opt.uuid;
        return (
          <button
            key={opt.uuid}
            type="button"
            className={`dot-btn${isSelected ? ' dot-btn--active' : ''}`}
            onClick={() => onChoose(opt.uuid, opt.label)}
            title={opt.label}
          >
            <span className="dot-circle" style={{ background: color }} />
          </button>
        );
      })}
    </div>
  );
}

function ShapeMiniPicker({ cast, activeShape, onSelect, onClose }) {
  const available = SHAPES.filter(s => PUSETЫ_SHAPES_BY_CAST[cast]?.includes(s.id));
  return (
    <div className="shape-mini-overlay" onClick={onClose}>
      <div className="shape-mini-popup" onClick={e => e.stopPropagation()}>
        <div className="shape-mini-grid">
          {available.map(s => (
            <button
              key={s.id}
              className={`shape-mini-btn${activeShape === s.id ? ' shape-mini-btn--active' : ''}`}
              onClick={() => { onSelect(s.id); onClose(); }}
              title={s.label}
            >
              <img src={`/assets/shapes/${s.file}`} alt={s.label} className="shape-mini-img" />
              <span className="shape-mini-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PusetyDetailScreen({ ijewel }) {
  const { cast, shape: shapeParam } = useParams();
  const navigate = useNavigate();

  const cardKey = `${cast}/${shapeParam}`;

  const [shape,        setShape]        = useState(shapeParam);
  const [carat,        setCarat]        = useState(null);
  const [gem1,         setGem1]         = useState(null);
  const [gem1Label,    setGem1Label]    = useState(null);
  const [metal,        setMetal]        = useState(null);
  const [metalLabel,   setMetalLabel]   = useState(null);
  const [purity,       setPurity]       = useState('585');
  const [shapePicker,  setShapePicker]  = useState(false);
  const [pendingInit,  setPendingInit]  = useState(null);

  const castRef = useRef(cast);

  useEffect(() => {
    track(EVENTS.PRODUCT_OPEN, {
      category: 'pusety',
      model:    'Пусеты',
      cast:     cast,
      shape:    shapeParam,
    });
  }, [cardKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const shapeLabel  = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const castLabel   = cast === 'halo' ? 'Halo' : 'Classic';
  const productName = pusetyCardName(cast, shapeLabel);

  // ─── Phase 1: Reset UI + schedule loader ──────────────────────────────────
  // Pusety has no shank variations — gate only on isReady.
  useEffect(() => {
    if (!ijewel.isReady) return;
    window.scrollTo({ top: 0, behavior: 'instant' });

    setShape(shapeParam);
    setCarat(null);
    setPurity('585');
    setShapePicker(false);
    setGem1(null);  setGem1Label(null);
    setMetal(null); setMetalLabel(null);
    castRef.current = cast;

    ijewel.resetConfigured();
    setPendingInit({ shapeTag: SHAPE_IJEWEL[shapeParam], castTag: CAST_IJEWEL[cast] });
  }, [cardKey, ijewel.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase 2: Apply 3D after loader is painted ────────────────────────────
  useEffect(() => {
    if (!pendingInit) return;
    setPendingInit(null);
    ijewel.fitScene();
    ijewel.applyInitial(pendingInit);
  }, [pendingInit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase 3: Auto-select white defaults ──────────────────────────────────
  useEffect(() => {
    if (!ijewel.isConfigured) return;

    if (!gem1 && ijewel.gem1Options.length) {
      const w = ijewel.gem1Options.find(o => o.label.toLowerCase().includes('бел'));
      if (w) { setGem1(w.uuid); setGem1Label(w.label); ijewel.applyGem('gem1', w.uuid); }
    }

    if (!metal && ijewel.shankMetalOptions.length) {
      const w = ijewel.shankMetalOptions.find(o => o.label.toLowerCase().includes('бел'));
      if (w) { setMetal(w.uuid); setMetalLabel(w.label); ijewel.applyShankMetal(w.uuid); }
    }
  }, [ijewel.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Interaction hint ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ijewel.isConfigured) return;
    const t = setTimeout(() => ijewel.startInteractionHint(), 1500);
    return () => clearTimeout(t);
  }, [ijewel.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Shape change ─────────────────────────────────────────────────────────
  const handleShapeChange = useCallback((newShape) => {
    setShape(newShape);
    setShapePicker(false);
    track(EVENTS.CONFIG_CHANGE, { field: 'shape', value: newShape });
    ijewel.applyHead(SHAPE_IJEWEL[newShape], CAST_IJEWEL[castRef.current]);
  }, [ijewel]);

  function handleBook() {
    sessionStorage.setItem('nd_booking', JSON.stringify({
      shape, shank: `Пусеты ${castLabel}`, cast, carat, purity, metalLabel, gem1Label, price: null,
    }));
    navigate('/catalog/booking');
  }

  return (
    <>
      <div
        className="cfg-panel cfg-panel--light"
        style={{ paddingBottom: 160, flex: 1, opacity: ijewel.isConfigured ? 1 : 0, transition: 'opacity 0.25s ease' }}
      >
        <div className="cfg-step-content" style={{ paddingBottom: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-body, Manrope, sans-serif)',
              fontWeight: 600, fontSize: '1.05rem',
              color: 'var(--cfg-ink, #0b2040)', marginBottom: 4,
              letterSpacing: '-0.01em',
            }}>
              {productName}
            </h2>
            <button
              onClick={() => setShapePicker(true)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '0.78rem', color: 'var(--cfg-ink-muted, #5b81a1)',
                textDecoration: 'underline', textUnderlineOffset: 3,
                fontFamily: 'var(--font-body, Manrope, sans-serif)',
              }}
            >
              Поменять форму бриллианта
            </button>
          </div>
        </div>

        <div className="cfg-step-content" style={{ paddingTop: 0 }}>

          <div className="cfg-section">
            <div className="cfg-section-label">Каратность бриллианта</div>
            <div className="carat-row">
              {CARAT_OPTIONS.map(c => (
                <button key={c} type="button"
                  className={`carat-btn${carat === c ? ' carat-btn--active' : ''}`}
                  onClick={() => {
                    setCarat(c);
                    track(EVENTS.CONFIG_CHANGE, { field: 'carat', value: c });
                    ijewel.applyCarat(c);
                  }}
                >
                  {c} ct
                </button>
              ))}
            </div>
          </div>

          {ijewel.gem1Options?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет бриллианта</div>
              <DotPicker options={ijewel.gem1Options} chosen={gem1} onChoose={(uuid, label) => {
                setGem1(uuid); setGem1Label(label);
                track(EVENTS.CONFIG_CHANGE, { field: 'gem1', value: label });
                ijewel.applyGem('gem1', uuid);
              }} />
            </div>
          )}

          <div className="cfg-section">
            <div className="cfg-section-label">Проба золота</div>
            <div className="cfg-purity-row">
              {[{ value: '585' }, { value: '750' }].map(p => (
                <button key={p.value} type="button"
                  className={`cfg-purity-btn${purity === p.value ? ' is-selected' : ''}`}
                  onClick={() => {
                    setPurity(p.value);
                    track(EVENTS.CONFIG_CHANGE, { field: 'purity', value: p.value });
                  }}
                >
                  <span className="cfg-purity-value">{p.value}</span>
                  <span className="cfg-opt-price">{p.value === '585' ? 'включено' : '+20 000 ₸'}</span>
                </button>
              ))}
            </div>
          </div>

          {ijewel.shankMetalOptions?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет золота</div>
              <DotPicker options={ijewel.shankMetalOptions} chosen={metal} onChoose={(uuid, label) => {
                setMetal(uuid); setMetalLabel(label);
                track(EVENTS.CONFIG_CHANGE, { field: 'metal', value: label });
                ijewel.applyShankMetal(uuid);
              }} />
            </div>
          )}

        </div>
      </div>

      <div className="detail-cta-bar">
        <div className="detail-cta-price-row">
          <span className="detail-cta-label">Стоимость</span>
          <span className="detail-cta-price">по запросу</span>
        </div>
        <button className="detail-cta-book" onClick={handleBook}>
          Подтвердить выбор
        </button>
      </div>

      {shapePicker && (
        <ShapeMiniPicker
          cast={cast}
          activeShape={shape}
          onSelect={handleShapeChange}
          onClose={() => setShapePicker(false)}
        />
      )}
    </>
  );
}
