import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SHAPES, SHANKS, CASTS, SHAPE_IJEWEL, CAST_IJEWEL, cardName } from '../data/config.js';
import { calcPrice, formatPrice } from '../data/priceCalc.js';
import { usePrices } from '../data/prices.js';
import { LABEL_COLORS } from '../hooks/useIjewel.js';
import { track, EVENTS } from '../lib/track.js';
import { useContentReveal } from '../lib/useContentReveal.js';
import { resolveVariant, showPrices } from '../lib/variant.js';
import WhatsAppCta from '../components/WhatsAppCta.jsx';
import ProductInfo from '../components/ProductInfo.jsx';


// The base price already covers a 1 ct stone, so 1 ct starts selected: the
// figure on the card and the chosen carat now say the same thing, and no lead
// can reach WhatsApp without a carat for the manager to work from.
const DEFAULT_CARAT = 1;


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


export default function DetailScreen({ ijewel }) {
  const { shank: shankSlug, cast, shape: shapeParam } = useParams();

  const shankId    = slugToShankId(shankSlug);
  const cardKey    = `${shankSlug}/${cast}/${shapeParam}`;
  // Stable boolean: false→true once, never reverts — safe dep without reference churn
  const hasVariations = ijewel.shankVariations.length > 0;

  const [shape,        setShape]        = useState(shapeParam);
  const [carat,        setCarat]        = useState(DEFAULT_CARAT);
  const [gem1,         setGem1]         = useState(null);
  const [gem1Label,    setGem1Label]    = useState(null);
  const [gem2,         setGem2]         = useState(null);
  const [gem2Label,    setGem2Label]    = useState(null);
  const [purity,       setPurity]       = useState('585');
  const [metal,        setMetal]        = useState(null);
  const [metalLabel,   setMetalLabel]   = useState(null);
  const [castMetal,    setCastMetal]    = useState(null);
  const [combinedGold, setCombinedGold] = useState(false);
  const prices                          = usePrices();

  // Stores the 3D config to apply — set in Phase 1, consumed in Phase 2.
  // Using state (not ref) so Phase 2 fires in a separate React render cycle,
  // guaranteeing the loader overlay is painted before any 3D changes happen.
  const [pendingInit, setPendingInit] = useState(null);

  const castRef = useRef(cast);
  const reveal  = useContentReveal(ijewel.isConfigured, cardKey);

  // Which models actually get opened — independent of whether the 3D finished loading.
  useEffect(() => {
    track(EVENTS.PRODUCT_OPEN, {
      category: 'ring',
      model:    shankId,
      cast:     cast,
      shape:    shapeParam,
    });
  }, [cardKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase 1: Reset UI + schedule loader ────────────────────────────────────
  // Fires when: card changes, viewer first ready, variations first populated.
  // Does NOT include shankVariations as dep — its reference changes every 500ms
  // due to bump() polling even when content is identical, which would re-trigger
  // applyInitial concurrently. hasVariations (boolean) only changes false→true once.
  useEffect(() => {
    if (!ijewel.isReady || !hasVariations) return;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const sv = ijewel.shankVariations.find(v => v.id === shankId) ??
               ijewel.shankVariations.find(v => v.id.toLowerCase() === shankId.toLowerCase());
    if (!sv) return;

    // Reset all selection UI
    setShape(shapeParam);
    setCarat(DEFAULT_CARAT);
    setPurity('585');
    setCombinedGold(false);
    setGem1(null);    setGem1Label(null);
    setGem2(null);    setGem2Label(null);
    setMetal(null);   setMetalLabel(null);
    setCastMetal(null);
    castRef.current = cast;

    // These two batched together: React renders once with loader shown + pendingInit set.
    // Phase 2 fires only AFTER that render, guaranteeing the loader is on screen
    // before the SDK makes any 3D changes.
    ijewel.resetConfigured();
    setPendingInit({ shapeTag: SHAPE_IJEWEL[shapeParam], castTag: CAST_IJEWEL[cast], shankName: sv.id });
  }, [cardKey, ijewel.isReady, hasVariations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase 2: Apply 3D changes after loader is painted ──────────────────────
  // `useEffect` always runs post-paint, so by the time this fires the loader
  // overlay is already visible — the SDK's internal model swap is hidden.
  useEffect(() => {
    if (!pendingInit) return;
    setPendingInit(null);

    ijewel.fitScene();
    ijewel.applyInitial(pendingInit);
  }, [pendingInit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase 3: Auto-select defaults once ring is configured ──────────────────
  // Fires after applyInitial → setIsConfigured(true). By that point gem1/metal
  // are null (reset in Phase 1), so we apply white defaults if available.
  useEffect(() => {
    if (!ijewel.isConfigured) return;

    // Keep the 3D in step with the pre-selected carat.
    ijewel.applyCarat(DEFAULT_CARAT);

    if (!gem1 && ijewel.gem1Options.length) {
      const findWhite = opts => opts.find(o => o.label.toLowerCase().includes('бел'));
      const w1 = findWhite(ijewel.gem1Options);
      if (w1) { setGem1(w1.uuid); setGem1Label(w1.label); ijewel.applyGem('gem1', w1.uuid); }
      const w2 = findWhite(ijewel.gem2Options);
      if (w2) { setGem2(w2.uuid); setGem2Label(w2.label); ijewel.applyGem('gem2', w2.uuid); }
    }

    if (!metal && ijewel.shankMetalOptions.length) {
      const white = ijewel.shankMetalOptions.find(o => o.label.toLowerCase().includes('бел'));
      if (white) {
        setMetal(white.uuid); setMetalLabel(white.label);
        ijewel.applyShankMetal(white.uuid);
        const castWhite = ijewel.castMetalOptions.find(o => o.label === white.label);
        if (castWhite) { setCastMetal(castWhite.uuid); ijewel.applyCastMetal(castWhite.uuid); }
      }
    }
  }, [ijewel.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Interaction hint ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ijewel.isConfigured) return;
    const t = setTimeout(() => ijewel.startInteractionHint(), 1500);
    return () => clearTimeout(t);
  }, [ijewel.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const castUuidByLabel = useCallback((label) => {
    const shankColor = LABEL_COLORS[label];
    let m = ijewel.castMetalOptions.find(o => o.label === label);
    if (!m && shankColor) m = ijewel.castMetalOptions.find(o => LABEL_COLORS[o.label] === shankColor);
    if (!m) m = ijewel.castMetalOptions.find(o => o.label?.toLowerCase().startsWith(label?.split(' ')[0]?.toLowerCase()));
    return m?.uuid ?? null;
  }, [ijewel.castMetalOptions]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleShankMetal = useCallback((uuid, label) => {
    setMetal(uuid); setMetalLabel(label);
    track(EVENTS.CONFIG_CHANGE, { field: 'metal', value: label });
    ijewel.applyShankMetal(uuid);
    if (!combinedGold) {
      const cu = castUuidByLabel(label);
      if (cu) ijewel.applyCastMetal(cu);
    }
  }, [ijewel, combinedGold, castUuidByLabel]);


  const handleCastMetal = useCallback((uuid) => {
    setCastMetal(uuid);
    ijewel.applyCastMetal(uuid);
  }, [ijewel]);



  // ─── Render ──────────────────────────────────────────────────────────────────
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

  const variant   = resolveVariant();
  const withPrice = showPrices(variant);

  // Караты больше не выбирают: базовая цена уже включает один карат, а дальше
  // считает менеджер. Поэтому цена подписана как «от» — это честнее, чем
  // точная сумма за конфигурацию, которую человек не собирал.
  const caratStep = prices?.caratPrice ? formatPrice(prices.caratPrice) : null;

  function waMessage(city) {
    const parts = [
      'Здравствуйте! Пишу с сайта.',
      `Интересует ${productName}.`,
      metalLabel ? `Цвет золота: ${metalLabel}.` : null,
      withPrice ? null : 'Подскажите, пожалуйста, стоимость.',
      `Шоурум: ${city}.`,
    ];
    return parts.filter(Boolean).join(' ');
  }

  function handleHandover(city) {
    track(EVENTS.WA_CLICK, {
      model: shankId, cast, shape, city,
      price: withPrice ? (price ?? null) : null,
    });
  }

  return (
    <>
      <div className="cfg-panel cfg-panel--light" style={{ paddingBottom: 160, flex: 1, opacity: reveal.visible ? 1 : 0, transition: 'opacity 0.25s ease' }}>

        <div className="cfg-step-content" style={{ paddingBottom: 0 }}>
          <h2 style={{
            fontFamily: 'var(--font-body, Manrope, sans-serif)',
            fontWeight: 600, fontSize: '1.05rem',
            color: 'var(--cfg-ink, #0b2040)', margin: '0 0 4px',
            letterSpacing: '-0.01em',
          }}>
            {productName}
          </h2>
          {withPrice && (
            <div style={{ fontSize: '0.82rem', color: '#5b81a1' }}>
              от <span style={{ fontWeight: 600, color: '#0b2040' }}>{price ? formatPrice(price) : '—'}</span>
              {' '}— за украшение с бриллиантом 1 карат, золото 585 пробы
              {caratStep ? `. Каждый следующий карат — ${caratStep}` : ''}
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
        {withPrice && (
          <div className="detail-cta-price-row">
            <span className="detail-cta-label">Стоимость</span>
            <span className="detail-cta-price">от {price ? formatPrice(price) : '—'}</span>
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


