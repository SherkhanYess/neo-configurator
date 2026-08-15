import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SHAPES, SHANKS, CASTS, VALID_COMBOS, SHAPE_IJEWEL, CAST_IJEWEL, cardName } from '../data/config.js';
import { calcPrice, formatPrice } from '../data/priceCalc.js';
import { loadPrices } from '../data/prices.js';
import { LABEL_COLORS } from '../hooks/useIjewel.js';

const CARAT_OPTIONS = [1, 1.5, 2, 3, 4, 5];

// URL slug → shank ID (e.g. "neo-luxe" → "Neo Luxe")
function slugToShankId(slug) {
  return SHANKS.find(s => s.id.toLowerCase().replace(/\s+/g, '-') === slug)?.id ?? slug;
}

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

function ShapeMiniPicker({ activeShape, onSelect, onClose }) {
  return (
    <div className="shape-mini-overlay" onClick={onClose}>
      <div className="shape-mini-popup" onClick={e => e.stopPropagation()}>
        <div className="shape-mini-grid">
          {SHAPES.map(s => (
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

export default function DetailScreen({ ijewel }) {
  const { shank: shankSlug, cast, shape: shapeParam } = useParams();
  const navigate = useNavigate();

  const shankId = slugToShankId(shankSlug);

  const [shape,        setShape]        = useState(shapeParam);
  const [carat,        setCarat]        = useState(null);
  const [gem1,         setGem1]         = useState(null);
  const [gem1Label,    setGem1Label]    = useState(null);
  const [gem2,         setGem2]         = useState(null);
  const [gem2Label,    setGem2Label]    = useState(null);
  const [purity,       setPurity]       = useState('585');
  const [metal,        setMetal]        = useState(null);
  const [metalLabel,   setMetalLabel]   = useState(null);
  const [castMetal,    setCastMetal]    = useState(null);
  const [combinedGold, setCombinedGold] = useState(false);
  const [shapePicker,  setShapePicker]  = useState(false);
  const [prices,       setPrices]       = useState(() => loadPrices());

  const castRef        = useRef(cast);
  const initialDoneRef = useRef(false);

  // Reset state when URL changes (different card)
  useEffect(() => {
    setShape(shapeParam);
    setCarat(null);
    setGem1(null); setGem1Label(null);
    setGem2(null); setGem2Label(null);
    setPurity('585');
    setMetal(null); setMetalLabel(null);
    setCastMetal(null); setCombinedGold(false);
    initialDoneRef.current = false;
    ijewel.resetConfigured();
    ijewel.fitScene();
    castRef.current = cast;
  }, [shankSlug, cast, shapeParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply this card's shape/cast/shank once viewer is ready and variations are loaded
  useEffect(() => {
    if (!ijewel.isReady || !ijewel.shankVariations.length || initialDoneRef.current) return;
    const sv = ijewel.shankVariations.find(v => v.id === shankId) ??
               ijewel.shankVariations.find(v => v.id.toLowerCase() === shankId.toLowerCase());
    if (!sv) return;
    initialDoneRef.current = true;
    ijewel.applyInitial({
      shapeTag:  SHAPE_IJEWEL[shape],
      castTag:   CAST_IJEWEL[cast],
      shankName: sv.id,
    });
  }, [ijewel.isReady, ijewel.shankVariations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start interaction hint after ring is configured
  useEffect(() => {
    if (!ijewel.isConfigured) return;
    const t = setTimeout(() => ijewel.startInteractionHint(), 1500);
    return () => clearTimeout(t);
  }, [ijewel.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select white gem on load
  useEffect(() => {
    if (!ijewel.isReady || gem1) return;
    const findWhite = opts => opts.find(o => o.label.toLowerCase().includes('бел'));
    const w1 = findWhite(ijewel.gem1Options);
    if (w1) { setGem1(w1.uuid); setGem1Label(w1.label); ijewel.applyGem('gem1', w1.uuid); }
    const w2 = findWhite(ijewel.gem2Options);
    if (w2) { setGem2(w2.uuid); setGem2Label(w2.label); ijewel.applyGem('gem2', w2.uuid); }
  }, [ijewel.gem1Options]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select white metal on load
  useEffect(() => {
    if (!ijewel.isReady || metal) return;
    const white = ijewel.shankMetalOptions.find(o => o.label.toLowerCase().includes('бел'));
    if (white) {
      setMetal(white.uuid); setMetalLabel(white.label);
      ijewel.applyShankMetal(white.uuid);
      const castWhite = ijewel.castMetalOptions.find(o => o.label === white.label);
      if (castWhite) ijewel.applyCastMetal(castWhite.uuid);
    }
  }, [ijewel.shankMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShapeChange = useCallback((newShape) => {
    setShape(newShape);
    setShapePicker(false);
    ijewel.applyHead(SHAPE_IJEWEL[newShape], CAST_IJEWEL[castRef.current]);
  }, [ijewel]);

  const castUuidByLabel = useCallback((label) => {
    const shankColor = LABEL_COLORS[label];
    let m = ijewel.castMetalOptions.find(o => o.label === label);
    if (!m && shankColor) m = ijewel.castMetalOptions.find(o => LABEL_COLORS[o.label] === shankColor);
    if (!m) m = ijewel.castMetalOptions.find(o => o.label?.toLowerCase().startsWith(label?.split(' ')[0]?.toLowerCase()));
    return m?.uuid ?? null;
  }, [ijewel.castMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShankMetal = useCallback((uuid, label) => {
    setMetal(uuid); setMetalLabel(label);
    ijewel.applyShankMetal(uuid);
    if (!combinedGold) {
      const cu = castUuidByLabel(label);
      if (cu) ijewel.applyCastMetal(cu);
    }
  }, [ijewel, combinedGold, castUuidByLabel]);

  const handleToggleCombined = useCallback((checked) => {
    setCombinedGold(checked);
    if (!checked) {
      const cu = castUuidByLabel(metalLabel);
      if (cu) ijewel.applyCastMetal(cu);
    }
  }, [ijewel, metalLabel, castUuidByLabel]);

  const handleCastMetal = useCallback((uuid) => {
    setCastMetal(uuid);
    ijewel.applyCastMetal(uuid);
  }, [ijewel]);

  const handleGem1 = useCallback((uuid, label) => {
    setGem1(uuid); setGem1Label(label);
    ijewel.applyGem('gem1', uuid);
  }, [ijewel]);

  const handleGem2 = useCallback((uuid, label) => {
    setGem2(uuid); setGem2Label(label);
    ijewel.applyGem('gem2', uuid);
  }, [ijewel]);

  const shapeLabel  = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const productName = cardName(shankId, cast, shapeLabel);

  const choices = { shankLabel: shankId, cast, castLabel: cast, carat, purity, gem1Label, gem2Label };
  const price = carat
    ? calcPrice(choices, prices)
    : (() => {
        if (!prices) return null;
        let base = prices.baseByShank?.[shankId] ?? 0;
        if (cast !== 'classic') base += prices.casts?.[cast] ?? 0;
        if (purity === '750') base += prices.purity750surcharge ?? 0;
        return base;
      })();

  const hasScatter = cast !== 'bezel';

  function handleBook() {
    const bookingData = {
      shape, shank: shankId, cast, carat, purity, metalLabel, gem1Label, gem2Label, price,
    };
    sessionStorage.setItem('nd_booking', JSON.stringify(bookingData));
    navigate('/booking');
  }

  return (
    <>
      <div className="cfg-panel cfg-panel--light" style={{ paddingBottom: 160, flex: 1 }}>

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
            <div className="cfg-section-label">Каратность центрального бриллианта</div>
            <div className="carat-row">
              {CARAT_OPTIONS.map(c => (
                <button key={c} type="button"
                  className={`carat-btn${carat === c ? ' carat-btn--active' : ''}`}
                  onClick={() => { setCarat(c); ijewel.applyCarat(c); }}
                >
                  {c} ct
                </button>
              ))}
            </div>
          </div>

          {ijewel.gem1Options?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет центрального бриллианта</div>
              <DotPicker options={ijewel.gem1Options} chosen={gem1} onChoose={handleGem1} />
            </div>
          )}

          {hasScatter && ijewel.gem2Options?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет россыпных бриллиантов</div>
              <DotPicker options={ijewel.gem2Options} chosen={gem2} onChoose={handleGem2} />
            </div>
          )}

          <div className="cfg-section">
            <div className="cfg-section-label">Проба золота</div>
            <div className="cfg-purity-row">
              {[{ value: '585' }, { value: '750' }].map(p => (
                <button key={p.value} type="button"
                  className={`cfg-purity-btn${purity === p.value ? ' is-selected' : ''}`}
                  onClick={() => setPurity(p.value)}
                >
                  <span className="cfg-purity-value">{p.value}</span>
                  <span className="cfg-opt-price">
                    {p.value === '585' ? 'включено'
                      : prices?.purity750surcharge ? `+${formatPrice(prices.purity750surcharge)}` : '+20 000 ₸'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {ijewel.shankMetalOptions?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет золота</div>
              <DotPicker options={ijewel.shankMetalOptions} chosen={metal} onChoose={handleShankMetal} />
            </div>
          )}

          <div className="cfg-section">
            <label className="cfg-toggle-row">
              <input type="checkbox" className="cfg-toggle-checkbox"
                checked={!!combinedGold} onChange={e => handleToggleCombined(e.target.checked)} />
              <span className="cfg-toggle-label">Комбинированное золото</span>
            </label>
          </div>

          {combinedGold && ijewel.castMetalOptions?.length > 0 && (
            <div className="cfg-section cfg-section--animate">
              <div className="cfg-section-label">Цвет золота каста</div>
              <DotPicker options={ijewel.castMetalOptions} chosen={castMetal} onChoose={handleCastMetal} />
            </div>
          )}
        </div>
      </div>

      <div className="detail-cta-bar">
        <div className="detail-cta-price-row">
          <span className="detail-cta-label">Стоимость</span>
          <span className="detail-cta-price">{price ? formatPrice(price) : '—'}</span>
        </div>
        <button className="detail-cta-book" onClick={handleBook}>
          Подтвердить выбор
        </button>
      </div>

      {shapePicker && (
        <ShapeMiniPicker
          activeShape={shape}
          onSelect={handleShapeChange}
          onClose={() => setShapePicker(false)}
        />
      )}
    </>
  );
}
