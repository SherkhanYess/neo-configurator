import { useState, useEffect, useRef } from 'react';
import { ringImage, cardName, SHAPES, CASTS, METAL_LABELS, WA_NUMBER } from '../data/config.js';
import { formatPrice } from '../data/priceCalc.js';

const TIMER_SECONDS = 600;
function pad(n) { return String(n).padStart(2, '0'); }
function useCountdown(s) {
  const [left, setLeft] = useState(s);
  const t0 = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, s - Math.floor((Date.now() - t0.current) / 1000))), 500);
    return () => clearInterval(id);
  }, [s]);
  return left;
}

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
  champ400: '#DCC29B',
  champ200: '#EFE4D2',
  studio:   'linear-gradient(150deg,#6A8EAC,#40648A,#1E3149)',
  wa:       '#25D366',
};
const eyebrow = { fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.champ700, marginBottom: 10 };
const h2style = { fontFamily: '"Unbounded",sans-serif', fontWeight: 300, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 10px', color: C.ink800 };
const lead    = { fontSize: '0.88rem', color: C.ink400, lineHeight: 1.65, margin: 0 };
const divider = { border: 'none', borderTop: `1.5px solid ${C.paper300}`, margin: 0 };
const card    = { background: '#fff', border: `1.5px solid ${C.paper300}`, borderRadius: 20, padding: '18px 20px' };

// ─── data ─────────────────────────────────────────────────────────────────────
const INCLUDED = [
  'Украшение',
  'Международный сертификат IGI',
  'Фирменный футляр',
  'Фирменный пакет',
];
const AFTER_SALE = [
  ['Ультразвуковая чистка', 'Пожизненно, бесплатно. Ваше украшение всегда будет сиять как в первый день.'],
  ['Повторное родирование', 'Бесплатно. Восстановим белоснежное покрытие в любое время.'],
  ['Ремонт и доработки', 'По себестоимости. Изготовление второй пары, изменение размера и многое другое.'],
];
const SHOW_ITEMS = [
  'Примерите украшения вживую и оцените, как они смотрятся именно на вас',
  'Посмотрите разные формы и размеры бриллиантов и выберите свой вариант',
  'Увидите сертификаты IGI и под микроскопом рассмотрите серийный номер внутри бриллианта',
  'Оцените качество наших работ вживую — посадку камней, закрепку, обработку золота',
  'Увидите готовые украшения наших клиентов и оцените результат индивидуальных заказов',
  'Получите консультацию специалиста и подберите форму, размер и дизайн под себя',
  'Примете решение не по фото, а после личного знакомства с украшениями',
];

// ─── sub-components ──────────────────────────────────────────────────────────

// Benefit card: label top-left, value prominent left, benefit text right
function BenefitCard({ label, value, benefit }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.ink400, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontFamily: '"Unbounded",sans-serif', fontWeight: 400, fontSize: '1rem', color: C.ink800, flexShrink: 0 }}>
          {value}
        </div>
        {benefit && (
          <div style={{ fontSize: '0.8rem', color: C.ink400, lineHeight: 1.55, textAlign: 'right' }}>
            {benefit}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple row card: label left, value right (for shape/carat/metal)
function RowCard({ label, value }) {
  return (
    <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '0.87rem', color: C.ink400 }}>{label}</span>
      <span style={{ fontSize: '0.87rem', fontWeight: 600, color: C.ink800 }}>{value}</span>
    </div>
  );
}

// Text benefit card: label + description paragraph
function TextCard({ label, text }) {
  return (
    <div style={{ ...card }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.ink400, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <p style={{ fontSize: '0.87rem', color: C.ink600, lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function BookingScreen({ initial, onBack }) {
  const { shape, shank, cast, carat, purity, metalLabel, gem1Label, price } = initial;
  const shapeLabel  = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const castLabel   = CASTS.find(c => c.id === cast)?.label ?? cast;
  const productName = cardName(shank, cast, shapeLabel);
  const img         = ringImage(shank, cast, shape);
  const metalPurity = METAL_LABELS[purity] ?? purity;

  const timeLeft  = useCountdown(TIMER_SECONDS);
  const mins      = Math.floor(timeLeft / 60);
  const secs      = timeLeft % 60;
  const isExpired = timeLeft === 0;

  function buildWA(withEngraving) {
    return [
      'Здравствуйте! Хочу записаться на живой показ:',
      `— ${productName}`,
      `— Форма бриллианта: ${shapeLabel}`,
      carat     && `— Каратность: ${carat} кар`,
      gem1Label && `— Бриллиант: ${gem1Label}`,
      `— Металл: ${metalPurity}${metalLabel ? `, ${metalLabel}` : ''}`,
      price     && `— Стоимость: от ${formatPrice(price)}`,
      withEngraving && !isExpired ? '\nХочу получить индивидуальную гравировку в подарок.' : '',
    ].filter(v => v !== false && v !== undefined).join('\n');
  }
  function openWA(withEngraving = false) {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWA(withEngraving))}`, '_blank');
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.paper050, color: C.ink800, fontFamily: 'Manrope, sans-serif', overflowX: 'hidden' }}>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Back */}
      <button onClick={onBack} style={{
        position: 'fixed', top: 14, left: 14, zIndex: 50,
        background: 'rgba(250,251,252,0.92)', border: `1.5px solid ${C.paper300}`,
        backdropFilter: 'blur(16px)', borderRadius: 50,
        padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', gap: 4,
        color: C.ink800, cursor: 'pointer', fontSize: '0.82rem',
        fontFamily: 'Manrope, sans-serif', fontWeight: 500,
      }}>
        &lsaquo; Назад
      </button>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 48px', maxWidth: 480, margin: '0 auto' }}>

        {img && (
          <div style={{
            width: '100%', maxWidth: 320, margin: '0 auto 28px',
            aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden',
            background: C.studio,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={img} alt={productName} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={eyebrow}>Ваш выбор</div>
          <h1 style={{ fontFamily: '"Unbounded",sans-serif', fontWeight: 300, fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 10px' }}>
            {productName}
          </h1>
          <p style={{ ...lead, marginBottom: 12 }}>
            {[shapeLabel, carat ? `${carat} кар` : null, gem1Label, metalPurity, metalLabel].filter(Boolean).join(' · ')}
          </p>
          {price && (
            <div style={{ fontFamily: '"Courier New",monospace', fontSize: '1.3rem', fontWeight: 700, color: C.champ700, letterSpacing: '0.04em' }}>
              от {formatPrice(price)}
            </div>
          )}
        </div>

        {/* Срок */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 50, background: C.paper100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.champ700} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink400, marginBottom: 3 }}>Срок изготовления</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: C.ink800 }}>5–10 рабочих дней</div>
          </div>
        </div>

        {/* В комплекте */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={eyebrow}>В комплекте</div>
          {INCLUDED.map((item, i) => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < INCLUDED.length - 1 ? `1px solid ${C.paper200}` : 'none',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: 50, background: C.champ700, flexShrink: 0 }} />
              <span style={{ fontSize: '0.87rem', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={divider} />

      {/* ── ПОСТ-ПРОДАЖНЫЙ СЕРВИС ───────────────────────────────────────── */}
      <section style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={eyebrow}>Сервис</div>
        <h2 style={h2style}>Мы заботимся о вашем украшении всю его жизнь</h2>
        <p style={{ ...lead, marginBottom: 24 }}>
          Вы получаете не просто украшение, а долгосрочные отношения со студией. Это то, чего вы лишаетесь при покупке украшений у байеров из Китая и Дубая.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AFTER_SALE.map(([label, text]) => (
            <TextCard key={label} label={label} text={text} />
          ))}
        </div>
      </section>

      <hr style={divider} />

      {/* ── ПРЕИМУЩЕСТВА ────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={eyebrow}>Преимущества</div>
        <h2 style={h2style}>С нами вы получаете нечто большее, чем просто украшение</h2>
        <p style={{ ...lead, marginBottom: 24 }}>
          Вы получаете бриллиант с характеристиками, которые редко встретишь в этой ценовой категории — и оправу, которую создают для надёжности, а не для витрины.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {carat && <RowCard label="Каратность" value={`${carat} кт`} />}
          <BenefitCard
            label="Чистота"
            value="VVS2/VS1"
            benefit="Чистый бриллиант без внутренних трещин и изъянов, видимых глазу"
          />
          <BenefitCard
            label="Цвет"
            value="D/E"
            benefit="Абсолютно белый бриллиант, без пожелтевших оттенков"
          />
          <BenefitCard
            label="Огранка"
            value="IDEAL"
            benefit="Идеальный блеск и игра света — максимум из каждого карата"
          />
          <BenefitCard
            label="Сертификат"
            value="IGI"
            benefit="Международная гарантия подлинности и характеристик"
          />
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.ink400, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Качество оправы
            </div>
            {[
              'В среднем тратим 4 г золота на украшение',
              'Не экономим на сырье — вы получаете благородное украшение, которое редко встретить на рынках Китая и Дубая',
            ].map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: 50, background: C.champ700, flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: '0.87rem', color: C.ink600, lineHeight: 1.55 }}>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={divider} />

      {/* ── ПРОГРАММА ЛОЯЛЬНОСТИ ─────────────────────────────────────────── */}
      <section style={{
        padding: '48px 24px', maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.ink800} 0%, #1a3a5c 60%, #2a4a6e 100%)`,
          borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(220,194,155,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(220,194,155,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ ...eyebrow, color: C.champ400, marginBottom: 8 }}>Программа лояльности</div>
            <h2 style={{
              fontFamily: '"Unbounded",sans-serif', fontWeight: 300, fontSize: '1.2rem',
              letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 8px', color: '#fff',
            }}>
              neo girls
            </h2>
            <div style={{
              display: 'inline-block',
              background: `linear-gradient(90deg, ${C.champ700}, ${C.champ400})`,
              borderRadius: 50, padding: '4px 14px', marginBottom: 20,
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                Пассивный доход
              </span>
            </div>
            <p style={{ fontSize: '0.87rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: '0 0 20px' }}>
              Вы становитесь частью нашего закрытого сообщества и получаете возможность зарабатывать, просто делясь впечатлениями о своём украшении.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Реферальный доход', 'Получайте вознаграждение за каждого приведённого клиента'],
                ['Закрытые события', 'Приглашения на мероприятия, недоступные широкой аудитории'],
                ['Привилегии от партнёров', 'Лимитированные предложения от наших партнёров'],
              ].map(([title, desc]) => (
                <div key={title} style={{
                  background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.champ400 }}>{title}</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr style={divider} />

      {/* ── ЖИВОЙ ПОКАЗ ─────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={eyebrow}>Живой показ</div>
        <h2 style={h2style}>Приглашаем в наш шоурум</h2>
        <p style={{ ...lead, marginBottom: 24 }}>
          Вас встретит наш главный специалист по бриллиантам, предложит напитки и проведёт консультацию.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SHOW_ITEMS.map((item, i) => (
            <div key={i} style={{ ...card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: 50, background: C.champ700, flexShrink: 0, marginTop: 6 }} />
              <span style={{ fontSize: '0.87rem', color: C.ink600, lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={divider} />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px 80px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>

        <h2 style={{
          fontFamily: '"Unbounded",sans-serif',
          fontWeight: 400, fontSize: '1.45rem',
          letterSpacing: '-0.02em', lineHeight: 1.25,
          color: C.ink800, margin: '0 0 16px',
        }}>
          Забронируйте живой показ
        </h2>

        {!isExpired ? (
          <>
            <p style={{ fontSize: '0.92rem', color: C.ink600, lineHeight: 1.6, margin: '0 0 28px' }}>
              Напишите нам прямо сейчас и получите{' '}
              <strong style={{ color: C.ink800 }}>индивидуальную гравировку на украшение в подарок</strong>
            </p>

            <button onClick={() => openWA(true)} style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 50, border: 'none', cursor: 'pointer',
              background: C.wa, color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 20,
            }}>
              <WhatsAppIcon />
              Написать в WhatsApp
            </button>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: C.paper100, borderRadius: 12, padding: '10px 18px',
            }}>
              <span style={{ fontSize: '0.75rem', color: C.ink400, fontWeight: 500 }}>Предложение истекает через</span>
              <span style={{
                fontFamily: '"JetBrains Mono","Courier New",monospace',
                fontSize: '1.15rem', fontWeight: 700, color: C.champ700, letterSpacing: '0.06em',
              }}>
                {pad(mins)}:{pad(secs)}
              </span>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.88rem', color: C.ink400, margin: '0 0 24px' }}>
              Специальное предложение истекло, но мы будем рады вас видеть.
            </p>
            <button onClick={() => openWA(false)} style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 50, border: 'none', cursor: 'pointer',
              background: C.wa, color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <WhatsAppIcon />
              Забронировать живой показ
            </button>
          </>
        )}

        <p style={{ fontSize: '0.72rem', color: C.ink200, marginTop: 20 }}>
          Нажимая кнопку, вы перейдёте в WhatsApp — мы ответим в течение нескольких минут
        </p>
      </section>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
