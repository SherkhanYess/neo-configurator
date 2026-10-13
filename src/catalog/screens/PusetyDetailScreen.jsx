import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SHAPES, PUSETЫ_SHAPES_BY_CAST, PUSETЫ_CASTS, SHAPE_IJEWEL, CAST_IJEWEL, pusetyCardName } from '../data/config.js';
import { LABEL_COLORS } from '../hooks/useIjewel.js';
import { usePrices } from '../data/prices.js';
import { calcPusetyPrice, formatPrice } from '../data/priceCalc.js';
import { track, EVENTS } from '../lib/track.js';
import { useContentReveal } from '../lib/useContentReveal.js';
import { resolveVariant, showPrices } from '../lib/variant.js';
import WhatsAppCta from '../components/WhatsAppCta.jsx';
import ProductInfo from '../components/ProductInfo.jsx';


// The base price already covers a 1 ct stone, so 1 ct starts selected: the
// figure on the card and the chosen carat now say the same thing, and no lead
// can reach WhatsApp without a carat for the manager to work from.
const DEFAULT_CARAT = 1;


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

export default function PusetyDetailScreen({ ijewel }) {
  const { cast, shape: shapeParam } = useParams();

  const cardKey = `${cast}/${shapeParam}`;

  const [shape,        setShape]        = useState(shapeParam);
  const [carat,        setCarat]        = useState(DEFAULT_CARAT);
  const [gem1,         setGem1]         = useState(null);
  const [gem1Label,    setGem1Label]    = useState(null);
  const [metal,        setMetal]        = useState(null);
  const [metalLabel,   setMetalLabel]   = useState(null);
  const [purity,       setPurity]       = useState('585');
  const [pendingInit,  setPendingInit]  = useState(null);

  const castRef = useRef(cast);
  const reveal  = useContentReveal(ijewel.isConfigured, cardKey);
  const prices  = usePrices();

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
  const price       = calcPusetyPrice({ cast, carat, purity, gem1Label }, prices);

  // ─── Phase 1: Reset UI + schedule loader ──────────────────────────────────
  // Pusety has no shank variations — gate only on isReady.
  useEffect(() => {
    if (!ijewel.isReady) return;
    window.scrollTo({ top: 0, behavior: 'instant' });

    setShape(shapeParam);
    setCarat(DEFAULT_CARAT);
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

    ijewel.applyCarat(DEFAULT_CARAT);

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

  const variant   = resolveVariant();
  const withPrice = showPrices(variant);

  function waMessage(city) {
    return [
      'Здравствуйте! Пишу с сайта.',
      `Интересуют ${productName}.`,
      metalLabel ? `Цвет золота: ${metalLabel}.` : null,
      withPrice ? null : 'Подскажите, пожалуйста, стоимость.',
      `Шоурум: ${city}.`,
    ].filter(Boolean).join(' ');
  }

  function handleHandover(city) {
    track(EVENTS.WA_CLICK, {
      model: 'Пусеты', cast, shape, city,
      price: withPrice ? (price ?? null) : null,
    });
  }

  return (
    <>
      <div
        className="cfg-panel cfg-panel--light"
        style={{ paddingBottom: 160, flex: 1, opacity: reveal.visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
      >
        <div className="cfg-step-content" style={{ paddingBottom: 0 }}>
          <h2 style={{
            fontFamily: 'var(--font-body, Manrope, sans-serif)',
            fontWeight: 600, fontSize: '1.05rem',
            color: 'var(--cfg-ink, #0b2040)', margin: '0 0 4px',
            letterSpacing: '-0.01em',
          }}>
            {productName}
          </h2>
          {withPrice && price > 0 && (
            <div style={{ fontSize: '0.82rem', color: '#5b81a1' }}>
              от <span style={{ fontWeight: 600, color: '#0b2040' }}>{formatPrice(price)}</span>
              {' '}— за пару с бриллиантами 1 карат, золото 585 пробы
            </div>
          )}
        </div>

        <div className="cfg-step-content" style={{ paddingTop: 0 }}>
          {ijewel.shankMetalOptions?.length > 0 && (
            <div className="cfg-section">
              <div className="cfg-section-label">Цвет золота</div>
              <DotPicker options={ijewel.shankMetalOptions} chosen={metal} onChoose={handleShankMetal} />
            </div>
          )}

          <ProductInfo />
        </div>
      </div>

      <div className="detail-cta-bar">
        {withPrice && price > 0 && (
          <div className="detail-cta-price-row">
            <span className="detail-cta-label">Стоимость</span>
            <span className="detail-cta-price">от {formatPrice(price)}</span>
          </div>
        )}
        <WhatsAppCta
          label={withPrice ? 'Написать в WhatsApp' : 'Узнать цены'}
          message={waMessage}
          onHandover={handleHandover}
        />
      </div>
    </>
  );
}
