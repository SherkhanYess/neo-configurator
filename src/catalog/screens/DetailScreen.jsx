import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SHAPES, SHAPE_IJEWEL, CAST_IJEWEL, shapeImage } from '../data/config.js';
import { ringOf, shankFromSlug } from '../data/models.js';
import { calcPrice, formatPrice } from '../data/priceCalc.js';
import { usePrices } from '../data/prices.js';
import { useProducts, enabledShapes, ringName, shapeLabel as adminShapeLabel } from '../data/products.js';
import { LABEL_COLORS } from '../hooks/useIjewel.js';
import { track, EVENTS } from '../lib/track.js';
import { waMessage } from '../lib/waMessage.js';
import { leadCode, sourceLatin } from '../lib/leadCode.js';
import { currentCity } from '../lib/city.js';
import { useWhatsApp, readUtm } from '../components/model/whatsapp.jsx';
import HintSheet from '../components/model/HintSheet.jsx';
import GlassBar from '../components/model/GlassBar.jsx';
import { Engraving, Like, Pair, Service, Fitting, Proof, Others, Questions, Final } from '../components/model/Sections.jsx';

// Восемь вариантов, две строки по четыре. Цена любого считается одинаково:
// база включает 1 ct, сверху — caratPrice за каждый карат сверх одного.
const CARAT_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5];

const CHEV = (
  <svg width="12" height="8" viewBox="0 0 14 9" aria-hidden="true"><path d="M1 1l6 6 6-6" fill="none" stroke="#52615B" strokeWidth="1.5"/></svg>
);

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

/** Форма камня — первый выбор. Подписей под камнями нет: название огранки
 *  стоит в имени кольца в стеклянной панели. */
function ShapePicker({ shapes, value, onChoose }) {
  return (
    <div className="mp-shapes" role="radiogroup" aria-label="Форма бриллианта">
      {shapes.map(s => (
        <button key={s.id} type="button" role="radio" aria-checked={value === s.id} aria-label={s.label} title={s.label}
                className={`mp-shape${value === s.id ? ' is-active' : ''}`}
                onClick={() => value !== s.id && onChoose(s.id)}>
          <img src={shapeImage(s.file)} alt="" />
        </button>
      ))}
    </div>
  );
}

/**
 * Ореол — не отдельная модель, а выбор на странице: «Halo Luxe» без ореола —
 * это «Sirius Luxe». Переключатель меняет голову кольца в 3D так же, как
 * выбор огранки, — без перезагрузки, — а вместе с ней имя, цену, адрес
 * страницы и текст в WhatsApp: всё, как будто человек открыл ту модель.
 */
function HaloPicker({ on, extra, onChange }) {
  return (
    <div>
      <div className="mp-head"><span className="mp-head__t">Ореол из бриллиантов</span><span className="mp-head__v">{extra}</span></div>
      <div className="mp-halo" role="radiogroup" aria-label="Ореол из бриллиантов">
        {[[false, 'Без ореола'], [true, 'С ореолом']].map(([v, l]) => (
          <button key={l} type="button" role="radio" aria-checked={on === v}
                  className={`mp-chip${on === v ? ' is-active' : ''}`} onClick={() => on !== v && onChange(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export default function DetailScreen({ ijewel }) {
  const { shank: shankSlug, cast: castParam, shape: shapeParam } = useParams();
  const location = useLocation();
  // Карат из ссылки-намёка или старой ссылки «Ваш выбор» — иначе 1 ct.
  const urlCarat = Number(new URLSearchParams(location.search).get('ct'));
  const startCarat = CARAT_OPTIONS.includes(urlCarat) ? urlCarat : DEFAULT_CARAT;

  const productCfg = useProducts();
  const shankId    = shankFromSlug(productCfg, shankSlug) ?? shankSlug;
  const cardKey    = `${shankSlug}/${castParam}/${shapeParam}`;
  // Stable boolean: false→true once, never reverts — safe dep without reference churn
  const hasVariations = ijewel.shankVariations.length > 0;

  const [shape,        setShape]        = useState(shapeParam);
  const [cast,         setCast]         = useState(castParam);
  const [carat,        setCarat]        = useState(startCarat);
  const [gem1,         setGem1]         = useState(null);
  const [gem1Label,    setGem1Label]    = useState(null);
  const [,             setGem2]         = useState(null);
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

  // Which models actually get opened — independent of whether the 3D finished loading.
  useEffect(() => {
    track(EVENTS.PRODUCT_OPEN, {
      category: 'ring',
      model:    shankId,
      cast:     castParam,
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
    setCast(castParam);
    setCarat(startCarat);
    setPurity('585');
    setCombinedGold(false);
    setGem1(null);    setGem1Label(null);
    setGem2(null);    setGem2Label(null);
    setMetal(null);   setMetalLabel(null);
    setCastMetal(null);
    castRef.current = castParam;

    // These two batched together: React renders once with loader shown + pendingInit set.
    // Phase 2 fires only AFTER that render, guaranteeing the loader is on screen
    // before the SDK makes any 3D changes.
    ijewel.resetConfigured();
    setPendingInit({ shapeTag: SHAPE_IJEWEL[shapeParam], castTag: CAST_IJEWEL[castParam], shankName: sv.id });
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
    ijewel.applyCarat(startCarat);

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

  // Адрес страницы следует за выбором: ссылкой можно поделиться, а «назад»
  // и обновление страницы откроют то же кольцо. Меняем адрес мимо роутера —
  // иначе он принял бы это за переход на другую модель и перезапустил 3D.
  const syncUrl = useCallback((nextCast, nextShape) => {
    const url = `/product/${shankSlug}/${nextCast}/${nextShape}${window.location.search}`;
    try { window.history.replaceState(window.history.state, '', url); } catch { /* старый браузер — адрес прежний */ }
  }, [shankSlug]);

  const shapeRef = useRef(shapeParam);
  useEffect(() => { shapeRef.current = shape; }, [shape]);

  const handleShapeChange = useCallback((newShape) => {
    setShape(newShape);
    track(EVENTS.CONFIG_CHANGE, { field: 'shape', value: newShape });
    ijewel.applyHead(SHAPE_IJEWEL[newShape], CAST_IJEWEL[castRef.current]);
    syncUrl(castRef.current, newShape);
  }, [ijewel, syncUrl]);

  const handleHalo = useCallback((on) => {
    const next = on ? 'halo' : 'classic';
    setCast(next);
    castRef.current = next;
    track(EVENTS.CONFIG_CHANGE, { field: 'halo', value: on, model: shankId });
    ijewel.applyHead(SHAPE_IJEWEL[shapeRef.current], CAST_IJEWEL[next]);
    syncUrl(next, shapeRef.current);
  }, [ijewel, shankId, syncUrl]);

  const handleShankMetal = useCallback((uuid, label) => {
    setMetal(uuid); setMetalLabel(label);
    track(EVENTS.CONFIG_CHANGE, { field: 'metal', value: label });
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
    track(EVENTS.CONFIG_CHANGE, { field: 'gem1', value: label });
    ijewel.applyGem('gem1', uuid);
  }, [ijewel]);


  // ─── Render ──────────────────────────────────────────────────────────────────
  const shapeLabel  = adminShapeLabel(productCfg, shape);
  // Админка может переименовать модель и выключить огранки — порядок огранок
  // при этом остаётся тем, что задан в config.js.
  const model       = ringName(productCfg, shankId, cast);
  const productName = [model, shapeLabel].join(' ');
  const allowed     = new Set(enabledShapes(productCfg).map(s => s.id));
  const shapes      = SHAPES.filter(s => allowed.has(s.id) || s.id === shape);

  const choices = { shankLabel: shankId, cast, castLabel: cast, carat, purity, gem1Label, gem2Label };

  // Ореол есть у всех шинок, кроме Bezel; выключенную в админке пару не предлагаем.
  const comboOn = (c) => ringOf(productCfg, shankId, c)?.enabled === true;
  const canHalo = (cast === 'classic' || cast === 'halo') && comboOn('classic') && comboOn('halo');
  const haloExtra = prices?.casts?.halo ? `+ ${formatPrice(prices.casts.halo)}` : '';
  const price = calcPrice(choices, prices);

  // Заголовок вкладки — как у страницы этой пары после пререндера: включили
  // ореол или сменили огранку — вкладка называет то кольцо, что на экране.
  const fromPrice = calcPrice({ shankLabel: shankId, cast, carat: 1 }, prices);
  useEffect(() => {
    if (fromPrice) document.title = `${productName} — помолвочное кольцо с бриллиантом ${formatPrice(fromPrice)} | Neo Diamond`;
  }, [productName, fromPrice]);

  // Надбавки показываем рядом с заголовком выбора, а не цену целиком: цена
  // уже стоит в стеклянной панели внизу.
  const caratExtra = prices?.caratPrice ? prices.caratPrice * Math.max(0, carat - 1) : 0;
  const isFancy    = gem1Label && !gem1Label.toLowerCase().includes('бел');
  const gemExtra   = isFancy && prices?.fancyColorSurcharge ? prices.fancyColorSurcharge * carat : 0;
  const plus       = (n) => (n ? `+ ${formatPrice(n)}` : '');

  const [moreOpen, setMoreOpen]     = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [hintOpen, setHintOpen]     = useState(false);
  const wa = useWhatsApp();

  // Пришёл по ссылке-намёку — над пультом плашка для него.
  const fromHint = new URLSearchParams(location.search).get('utm_medium') === 'hint';

  const ctx = { model, shape: shapeLabel, carat, metalLabel, purity, gemLabel: gem1Label };
  const utm = readUtm();
  const props = { model: shankId, cast, shape, carat, price: price ?? null };

  const hintLink = (() => {
    const q = new URLSearchParams({ utm_medium: 'hint', utm_source: sourceLatin(utm), ct: String(carat) });
    return `${window.location.origin}/product/${shankSlug}/${cast}/${shape}?${q}`;
  })();

  return (
    <div className="mp">
      {/* Имя и цена — сразу под 3D: что это за кольцо и сколько оно стоит,
          видно до любого выбора. Модель — одной строкой, огранка — мелко
          под ней: иначе длинное имя уходит на вторую строку и цену рядом
          не замечают. Цена — только здесь, меняется вместе с выбором. */}
      <div className="mp-title">
        <h1 className="mp-title__n">{model}<span className="mp-title__s">{shapeLabel}</span></h1>
        {price ? <span className="mp-title__p" aria-live="polite">{formatPrice(price)}</span> : null}
      </div>

      {fromHint && (
        <div className="mp-plaque"><b>Вам показали это кольцо.</b> Размер нам уже прислали — напишите в WhatsApp, подскажем его и обсудим детали кольца.</div>
      )}

      <div className="mp-card">
        <div className="mp-config">
          {/* Ореол — первым: это выбор самого кольца, и его видно сразу. */}
          {canHalo && <HaloPicker on={cast === 'halo'} extra={haloExtra} onChange={handleHalo} />}

          <div>
            <div className="mp-head"><span className="mp-head__t">Форма бриллианта</span></div>
            <ShapePicker shapes={shapes} value={shape} onChoose={handleShapeChange} />
          </div>


          <div>
            <div className="mp-head"><span className="mp-head__t">Каратность</span><span className="mp-head__v">{plus(caratExtra)}</span></div>
            <div className="mp-carats">
              {CARAT_OPTIONS.map(c => (
                <button key={c} type="button" className={`mp-chip${carat === c ? ' is-active' : ''}`} aria-pressed={carat === c}
                  onClick={() => { setCarat(c); track(EVENTS.CONFIG_CHANGE, { field: 'carat', value: c }); ijewel.applyCarat(c); }}>
                  {String(c).replace('.', ',')} ct
                </button>
              ))}
            </div>
          </div>

          {ijewel.shankMetalOptions?.length > 0 && (
            <div>
              <div className="mp-head"><span className="mp-head__t">Цвет золота</span><span className="mp-head__v">{String(metalLabel ?? '').replace(/\s*золото\s*/i, '')}</span></div>
              <div className="mp-dots">
                {ijewel.shankMetalOptions.map(o => (
                  <button key={o.uuid} type="button" className={`mp-dot${metal === o.uuid ? ' is-active' : ''}`} title={o.label} aria-label={o.label}
                          aria-pressed={metal === o.uuid} onClick={() => handleShankMetal(o.uuid, o.label)}>
                    <span style={{ background: LABEL_COLORS[o.label] ?? '#ccc' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: -6 }}>
            {ijewel.gem1Options?.length > 1 && (
              <div className="mp-fold">
                <button type="button" className="mp-fold__btn" aria-expanded={colorsOpen} onClick={() => setColorsOpen(v => !v)}>
                  <span>Цветные бриллианты</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {colorsOpen && <span className="mp-head__v">{plus(gemExtra)}</span>}{CHEV}
                  </span>
                </button>
                {colorsOpen && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div className="mp-stones" style={{ marginTop: 0 }}>
                      {ijewel.gem1Options.map(o => (
                        <button key={o.uuid} type="button" className={`mp-stone${gem1 === o.uuid ? ' is-active' : ''}`} aria-pressed={gem1 === o.uuid}
                                onClick={() => handleGem1(o.uuid, o.label)}>
                          <span className="mp-stone__c"><span style={{ background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${LABEL_COLORS[o.label] ?? '#E8ECF5'} 60%)` }} /></span>
                          <span className="mp-stone__l">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mp-fold">
              <button type="button" className="mp-fold__btn" aria-expanded={moreOpen} onClick={() => setMoreOpen(v => !v)}>
                <span>Проба и комбинированное золото</span>{CHEV}
              </button>
              {moreOpen && (
                <div className="mp-fold__body">
                  <div className="mp-purity">
                    {['585', '750'].map(v => (
                      <button key={v} type="button" className={purity === v ? 'is-active' : ''} aria-pressed={purity === v}
                              onClick={() => { setPurity(v); track(EVENTS.CONFIG_CHANGE, { field: 'purity', value: v }); }}>
                        <b>{v}</b>
                        <small>{v === '585' ? 'включено' : `+ ${formatPrice(prices?.purity750surcharge ?? 20000)}`}</small>
                      </button>
                    ))}
                  </div>
                  <label className="mp-toggle">
                    <input type="checkbox" checked={!!combinedGold} onChange={e => handleToggleCombined(e.target.checked)} />
                    Комбинированное золото
                  </label>
                  {combinedGold && ijewel.castMetalOptions?.length > 0 && (
                    <div>
                      <div className="mp-head"><span className="mp-head__t">Цвет золота каста</span></div>
                      <DotPicker options={ijewel.castMetalOptions} chosen={castMetal} onChoose={handleCastMetal} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Engraving />
      <div className="mp-gap" />
      <Like message={waMessage('price', ctx, utm).replace(/\s*\[[^\]]*\]\s*$/, '')}
            onWa={() => wa.open(fromHint ? 'hint' : 'price', ctx, props)} />
      <Pair
        onHint={() => { track(EVENTS.HINT_OPEN, props); setHintOpen(true); }}
        onCustom={() => wa.open('custom', ctx, props)}
      />
      <Service />
      <div className="mp-gap" />
      <Fitting model={model} onWa={() => wa.open('fitting', ctx, props)} />
      <div className="mp-gap--l" />
      <Proof />
      <Others shank={shankId} prices={prices} products={productCfg} />
      <Questions />
      <Final onWa={() => wa.open('help', ctx, props)} />

      <GlassBar onWa={() => wa.open(fromHint ? 'hint' : 'price', ctx, { ...props, place: 'sticky' })} />

      {wa.sheet}
      {hintOpen && (
        <HintSheet
          ring={[productName, `${String(carat).replace('.', ',')} ct`, String(metalLabel ?? '').toLowerCase()].filter(Boolean).join(' · ')}
          link={hintLink}
          code={leadCode('hint', { utm_medium: 'hint', utm_source: sourceLatin(utm) })}
          city={currentCity()}
          trackProps={props}
          onClose={() => setHintOpen(false)}
        />
      )}
    </div>
  );
}
