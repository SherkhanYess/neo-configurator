import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cardName, SHAPES, METAL_LABELS, WA_NUMBER, pusetyCardName } from '../data/config.js';
import { calcPrice, calcPusetyPrice, formatPrice } from '../data/priceCalc.js';
import { usePrices } from '../data/prices.js';
import { track, EVENTS } from '../lib/track.js';
import { decodeBooking, encodeBooking } from '../lib/bookingUrl.js';
import SpecsBlock from '../components/SpecsBlock.jsx';
import Faq from '../components/Faq.jsx';

// ─── tokens ──────────────────────────────────────────────────────────────────
const C = {
  paper050: '#FAFBFC',
  paper100: '#F2F5F9',
  paper200: '#E9EDF3',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  ink200:   '#C2D1DE',
  champ700: '#7C6035',
  wa:       '#25D366',
};
const eyebrow = { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.champ700, marginBottom: 14 };
const h2style = { fontFamily: '"Unbounded",sans-serif', fontWeight: 300, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 10px', color: C.ink800 };
const lead    = { fontSize: '0.88rem', color: C.ink400, lineHeight: 1.65, margin: 0 };
const divider = { border: 'none', borderTop: `1.5px solid ${C.paper300}`, margin: 0 };
const card    = { background: '#fff', border: `1.5px solid ${C.paper300}`, borderRadius: 20, padding: '18px 20px' };
const section = { padding: '44px 24px', maxWidth: 480, margin: '0 auto' };

const AFTER_SALE = [
  { name: 'Ультразвуковая чистка', price: 'Бесплатно',        detail: 'Пожизненно и бесплатно. Украшение сияет точно так же, как в день первого надевания — спустя год, пять, десять лет.' },
  { name: 'Повторное родирование', price: 'Бесплатно',        detail: 'Бесплатно и в любое время. Белое золото всегда остаётся по-настоящему белым — мы следим за этим вместе с вами.' },
  { name: 'Ремонт и доработки',    price: 'По себестоимости', detail: 'По себестоимости материалов. Подгоним размер, создадим пару, изменим форму. Мы рядом — не только в момент покупки.' },
];

// ─── sub-components ──────────────────────────────────────────────────────────

function AfterSaleCard({ name, price, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.ink800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            {name}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.champ700, marginTop: 3, letterSpacing: '0.02em' }}>
            {price}
          </div>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={open ? 'Скрыть' : 'Подробнее'}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${C.paper300}`,
            background: open ? C.ink800 : '#fff', color: open ? '#fff' : C.ink400,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, fontSize: '1.2rem', lineHeight: 1,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {open ? '−' : '+'}
        </button>
      </div>
      {open && (
        <p style={{ margin: '12px 0 0', fontSize: '0.84rem', color: C.ink400, lineHeight: 1.6 }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// Outlined on purpose. A second green button would compete with the main CTA
// and pull taps away from it.
const secondaryBtn = {
  width: '100%', minHeight: 52, padding: '14px 20px',
  borderRadius: 50, border: `1.5px solid ${C.paper300}`,
  background: '#fff', color: C.ink800, cursor: 'pointer',
  fontSize: '0.9rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxSizing: 'border-box',
};

// ─── main ─────────────────────────────────────────────────────────────────────
export default function BookingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef  = useRef(null);
  const prices   = usePrices();
  const [toast, setToast] = useState('');

  // The address wins over sessionStorage, so a shared link opens what the
  // sender saw rather than whatever this browser last configured.
  const cfg = useMemo(() => {
    const fromUrl = decodeBooking(location.search);
    if (fromUrl) return fromUrl;
    try {
      const s = JSON.parse(sessionStorage.getItem('nd_booking') ?? 'null');
      if (!s) return null;
      return { ...s, type: String(s.shank ?? '').startsWith('Пусеты') ? 'pusety' : 'ring' };
    } catch (_) { return null; }
  }, [location.search]);

  useEffect(() => {
    if (!cfg) navigate('/catalog', { replace: true });
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the configuration in the address at all times, so whatever the visitor
  // copies from the address bar is already a working link.
  useEffect(() => {
    if (!cfg || location.search) return;
    const q = encodeBooking(cfg);
    if (q) window.history.replaceState(null, '', `${location.pathname}?${q}`);
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cfg) return;
    track(EVENTS.BOOKING_OPEN, {
      model: cfg.shank, cast: cfg.cast, shape: cfg.shape, carat: cfg.carat ?? null,
    });
  }, [cfg?.shank, cfg?.cast, cfg?.shape]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!heroRef.current) return;
    const t = setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, []);

  if (!cfg) return null;

  const { shape, shank, cast, carat, purity, metalLabel, gem1Label, type } = cfg;
  const shapeLabel  = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const productName = type === 'pusety'
    ? pusetyCardName(cast, shapeLabel)
    : cardName(shank, cast, shapeLabel);
  const metalPurity = METAL_LABELS[purity] ?? purity;

  // Recomputed from today's prices rather than carried in the link.
  const price = type === 'pusety'
    ? calcPusetyPrice({ cast, carat, purity, gem1Label }, prices)
    : calcPrice({ shankLabel: shank, cast, castLabel: cast, carat, purity, gem1Label, gem2Label: cfg.gem2Label }, prices);

  const specLine = [
    `Форма: ${shapeLabel}`,
    carat && `Каратность: ${carat} кар`,
    gem1Label && `Бриллиант: ${gem1Label}`,
    `Металл: ${metalPurity}${metalLabel ? `, ${metalLabel}` : ''}`,
    price && `Стоимость: от ${formatPrice(price)}`,
  ].filter(Boolean).join('\n');

  const shareUrl = `${window.location.origin}/catalog/booking?${encodeBooking(cfg)}`;

  function buildWA() {
    return [
      'Здравствуйте! Хочу узнать подробнее об украшении:',
      `— ${productName}`,
      ...specLine.split('\n').map(l => `— ${l}`),
      '\nХочу получить индивидуальную гравировку в подарок.',
    ].join('\n');
  }
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWA())}`;

  const eventProps = { model: shank, cast, shape, carat: carat ?? null, price: price ?? null };

  async function handleShare() {
    track(EVENTS.SHARE_CLICK, eventProps);
    const payload = {
      title: `${productName} — Neo Diamond`,
      text:  `${productName}\n${specLine}`,
      url:   shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        track(EVENTS.SHARE_SUCCESS, { ...eventProps, method: 'share' });
      } catch (_) {
        // Cancelling the system sheet is not a failure worth reporting.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast('Ссылка скопирована');
      setTimeout(() => setToast(''), 2200);
      track(EVENTS.SHARE_SUCCESS, { ...eventProps, method: 'clipboard' });
    } catch (_) {
      setToast('Не удалось скопировать ссылку');
      setTimeout(() => setToast(''), 2200);
    }
  }

  function handleOtherModels() {
    track(EVENTS.OTHER_MODELS, eventProps);
    // The shape is already chosen — sending them back to pick it again is a loss.
    navigate(`/catalog/list?shapes=${shape}`);
  }

  return (
    <div style={{ background: C.paper050, color: C.ink800, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden', flex: 1 }}>

      <style>{`
        @keyframes wa-shimmer {
          0%   { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .wa-btn-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
          animation: wa-shimmer 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-btn-shimmer::after { animation: none; }
        }
      `}</style>

      {/* ── 2. Ваш выбор ─────────────────────────────────────────────────── */}
      <section style={{ ...section, paddingTop: 32 }}>
        <div ref={heroRef} style={{ textAlign: 'center' }}>
          <div style={eyebrow}>Ваш выбор</div>
          <h1 style={{ fontFamily: '"Unbounded",sans-serif', fontWeight: 300, fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 10px' }}>
            {productName}
          </h1>
          <p style={{ ...lead, marginBottom: 12 }}>
            {[`${purity} проба`, carat ? `${carat} кар` : null].filter(Boolean).join(' · ')}
          </p>
          {price && (
            <div style={{ fontFamily: '"JetBrains Mono","Courier New",monospace', fontSize: '1.3rem', fontWeight: 700, color: C.champ700, letterSpacing: '0.04em' }}>
              {formatPrice(price)}
            </div>
          )}
        </div>

        {/* Отдельным блоком — сюда же встанет наличие, когда появится. */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, textAlign: 'left' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 50, background: C.paper100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.champ700} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink400, marginBottom: 3 }}>
              Срок изготовления
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: C.ink800 }}>
              5–10 рабочих дней
            </div>
          </div>
        </div>
      </section>

      <hr style={divider} />

      {/* ── 3. Характеристики украшения ──────────────────────────────────── */}
      <div style={section}>
        <SpecsBlock eyebrowStyle={eyebrow} />
      </div>

      <hr style={divider} />

      {/* ── 4. Наш сервис ────────────────────────────────────────────────── */}
      <section style={section}>
        <div style={eyebrow}>Сервис</div>
        <h2 style={h2style}>Мы заботимся о вашем украшении всю его жизнь</h2>
        <p style={{ ...lead, marginBottom: 22 }}>
          Вы получаете не просто украшение, а долгосрочные отношения со студией.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AFTER_SALE.map(s => <AfterSaleCard key={s.name} {...s} />)}
        </div>

        <p style={{ margin: '22px 0 0', fontSize: '0.88rem', color: C.ink600, lineHeight: 1.7 }}>
          Байер из Китая или Дубая привезёт камень и исчезнет. Дальше вы остаётесь с украшением
          один на один: почистить, восстановить покрытие, подогнать размер — всё за свой счёт
          и не у того, кто его делал. Мы не экономим на сырье и остаёмся на связи ровно столько,
          сколько украшение живёт.
        </p>
      </section>

      <hr style={divider} />

      {/* ── 5–7. Оффер, CTA и дополнительные действия ────────────────────── */}
      <section style={{ ...section, textAlign: 'center' }}>
        {/* Это оффер, а не подпись к кнопке — отсюда и уровень заголовка.
            h1 на странице уже занят названием украшения. */}
        <h2 style={{
          fontFamily: '"Unbounded",sans-serif', fontWeight: 400,
          fontSize: '1.35rem', letterSpacing: '-0.02em', lineHeight: 1.3,
          color: C.ink800, margin: '0 0 24px', textWrap: 'balance',
        }}>
          Оставьте заявку прямо сейчас и получите{' '}
          <span style={{ color: C.champ700 }}>индивидуальную гравировку в подарок</span>
        </h2>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.BOOKING_WA, eventProps)}
          className="wa-btn-shimmer"
          style={{
            width: '100%', minHeight: 56, padding: '16px 24px',
            borderRadius: 50, border: 'none', cursor: 'pointer',
            background: C.wa, color: '#fff', textDecoration: 'none',
            fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 22px rgba(37,211,102,0.42)',
            position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
          }}
        >
          <WhatsAppIcon />
          Написать в WhatsApp
        </a>

        <p style={{ fontSize: '0.75rem', color: C.ink400, margin: '14px 0 24px', lineHeight: 1.5 }}>
          Нажимая кнопку, вы перейдёте в WhatsApp — мы ответим в течение нескольких минут
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" onClick={handleShare} style={secondaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Отправить себе или партнёру
          </button>

          <button
            type="button"
            onClick={handleOtherModels}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.87rem', color: C.ink400, fontFamily: 'Manrope, sans-serif',
              textDecoration: 'underline', textUnderlineOffset: 3, padding: '6px 0',
            }}
          >
            Посмотреть другие модели
          </button>
        </div>

        {toast && (
          <div role="status" style={{
            marginTop: 16, display: 'inline-block',
            background: C.ink800, color: '#fff', borderRadius: 50,
            padding: '9px 18px', fontSize: '0.82rem', fontWeight: 500,
          }}>
            {toast}
          </div>
        )}
      </section>

      <hr style={divider} />

      {/* ── 8. Вопросы и ответы ──────────────────────────────────────────── */}
      <div style={{ ...section, paddingBottom: 72 }}>
        <Faq eyebrowStyle={eyebrow} />
      </div>
    </div>
  );
}
