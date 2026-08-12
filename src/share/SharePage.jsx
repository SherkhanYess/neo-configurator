import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIjewel, LABEL_COLORS } from '../configurator/useIjewel.js';
import { DIAMOND_SHAPES, CAST_DESIGNS } from '../configurator/config.js';
import { parseConfigUrl, parseSenderUtm } from '../configurator/config.js';
import { ViewerPanel } from '../configurator/components/ViewerPanel.jsx';
import { LeadModal } from '../configurator/steps/LeadModal.jsx';
import { buildBreakdown } from '../configurator/priceBreakdown.js';
import { calcPrice, formatPrice } from '../configurator/priceCalc.js';

function ColorSwatch({ label }) {
  if (!label) return null;
  const color = LABEL_COLORS[label];
  if (!color) return <span>{label}</span>;
  return (
    <span className="cfg-summary-color">
      <span className="cfg-summary-color-dot" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

const WA_BY_CITY = {
  'Алматы':       '77766708505',
  'Астана':       '77776908505',
  'Другой город': '77766708505',
};
const CITIES = ['Алматы', 'Астана', 'Другой город'];

function CityModal({ onSelect, onClose }) {
  return (
    <div className="lead-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lead-modal">
        <button type="button" className="lead-modal-close" onClick={onClose}>✕</button>
        <div className="lead-modal-header">
          <span className="nd-eyebrow">Перейти на WhatsApp</span>
          <h3 className="lead-modal-title">Ваш город?</h3>
          <p className="lead-modal-subtitle">Выберите — подберём нужного менеджера</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {CITIES.map((city) => (
            <button key={city} type="button" className="lead-pill"
              style={{ padding: '14px 20px', fontSize: 16, textAlign: 'center', borderRadius: 14 }}
              onClick={() => onSelect(city)}>
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  const ijewel = useIjewel();
  const choicesRef = useRef(null);
  const [choices, setChoices] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showCity, setShowCity] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [preselectedCity, setPreselectedCity] = useState('');
  const [prices, setPrices] = useState(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    const defaults = {
      baseByShank: { 'Neo': 200000, 'Neo Luxe': 250000, 'Sirius': 220000, 'Sirius Luxe': 280000, 'Bezel': 230000 },
      casts: { halo: 30000, bezel: 20000 },
      caratPrice: 200000,
      purity750surcharge: 20000,
      fancyColorSurcharge: 100000,
      scatterFancySurcharge: 150000,
    };
    fetch('/api/get-prices')
      .then(r => r.ok ? r.json() : defaults)
      .then(setPrices)
      .catch(() => setPrices(defaults));
  }, []);

  // On mount: parse URL, save sender UTM, set recipient UTM
  useEffect(() => {
    const parsed = parseConfigUrl();
    choicesRef.current = parsed;
    setChoices(parsed);

    const senderUtm = parseSenderUtm();
    if (senderUtm) {
      try { sessionStorage.setItem('nd_sender_utm', JSON.stringify(senderUtm)); } catch (_) {}
    }
    try { sessionStorage.setItem('nd_utm', JSON.stringify({ utm_term: 'share' })); } catch (_) {}
  }, []);

  // Remove overlay after 6s (enough for all variations to settle)
  useEffect(() => {
    if (!ijewel.isReady) return;
    const t = setTimeout(() => setShowOverlay(false), 6000);
    return () => clearTimeout(t);
  }, [ijewel.isReady]);

  // Main restore — fires once when ring components are ready (shankVariations populated)
  // Step 1: apply structure (shape/cast/shank/carat)
  // Step 2: after 1.5s, apply colors via restoreFromLabels (sequential, with full logging)
  useEffect(() => {
    if (!ijewel.isReady || !ijewel.shankVariations.length || !choicesRef.current) return;
    if (restoredRef.current) return;
    restoredRef.current = true;

    const c = choicesRef.current;
    // Step 1 — structure
    const s = DIAMOND_SHAPES.find((x) => x.id === c.shape);
    const k = CAST_DESIGNS.find((x) => x.id === c.cast);
    if (s || k) ijewel.applyHead(s?.ijewelTag ?? null, k?.ijewelTag ?? null);
    if (c.shank) ijewel.applyShank(c.shank);
    if (c.carat) ijewel.applyCarat(c.carat);

    // Step 2 — colors after delay (iJewel needs time to process structure changes
    //          before material groups are updated for the new cast/shape)
    setTimeout(() => {
      ijewel.restoreFromLabels({
        gem1Label:      c.gem1Label,
        gem2Label:      c.gem2Label,
        metalLabel:     c.metalLabel,
        castMetalLabel: c.castMetalLabel,
      });
    }, 1500);

  }, [ijewel.shankVariations]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInit = useCallback((el) => { ijewel.init(el); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isColorKey = { metal: true, gem1: true, gem2: true };
  const lines = buildBreakdown(choices ?? {}, null);
  const livePrice = choices ? calcPrice(choices, prices) : null;

  return (
    <div className="cfg-root nd-bg" style={{ position: 'relative' }}>
      <ViewerPanel onInit={handleInit} isReady={ijewel.isReady} hidden={false} />

      {showOverlay && (
        <div className="share-overlay">
          <span className="cfg-loader-gem">💎</span>
          <p className="cfg-viewer-loader-text">Загрузка украшения...</p>
        </div>
      )}

      {!showOverlay && (
        <div className="cfg-panel cfg-panel--light">
          <div className="cfg-step-content cfg-summary">

            {/* Price block */}
            {livePrice && (
              <div className="share-price-block">
                <span className="share-price-label">Стоимость украшения</span>
                <span className="share-price-value">{formatPrice(livePrice)}</span>
              </div>
            )}

            {/* Summary list */}
            {lines.length > 0 && (
              <>
                <div className="cfg-summary-header">
                  <span className="nd-eyebrow">Украшение</span>
                  <h2 className="cfg-step-title">Конфигурация кольца</h2>
                </div>
                <div className="cfg-summary-list">
                  {lines.map((line) => (
                    <div key={line.key} className="cfg-summary-row">
                      <span className="cfg-summary-key">{line.label}</span>
                      <span className="cfg-summary-val">
                        {line.value
                          ? (isColorKey[line.key]
                              ? <ColorSwatch label={line.value} />
                              : <span>{line.value}</span>)
                          : null
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CTA */}
            <div className="cfg-summary-actions">
              <p className="cfg-summary-wa-pitch">
                Перейдя на WhatsApp вам ответит ваш персональный менеджер. Вы сможете{' '}
                <u>записаться на живой показ</u> или <u>задать свои вопросы</u>.
              </p>
              <button
                type="button"
                className="cfg-wa-cta cfg-wa-cta--primary"
                onClick={() => setShowCity(true)}
              >
                <WhatsAppIcon />
                Перейти на WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

      {showCity && (
        <CityModal
          onSelect={(city) => {
            setShowCity(false);
            setPreselectedCity(city);
            setShowLead(true);
          }}
          onClose={() => setShowCity(false)}
        />
      )}

      {showLead && choices && (
        <LeadModal
          choices={choices}
          waUrl={`https://wa.me/${WA_BY_CITY[preselectedCity] || WA_BY_CITY['Алматы']}?text=${encodeURIComponent('Здравствуйте, собрал(-а) украшение на конструкторе, хочу узнать подробности и на живой показ!')}`}
          preselectedCity={preselectedCity}
          onClose={() => setShowLead(false)}
        />
      )}
    </div>
  );
}
