import { useState, useEffect, useRef } from 'react';
import { ringImage, cardName, SHAPES, CASTS, METAL_LABELS, WA_NUMBER } from '../data/config.js';
import { formatPrice } from '../data/priceCalc.js';

const TIMER_SECONDS = 600;

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setLeft(Math.max(0, seconds - Math.floor((Date.now() - startRef.current) / 1000)));
    }, 500);
    return () => clearInterval(id);
  }, [seconds]);
  return left;
}

const SHOW_ITEMS = [
  'Примерите украшения вживую и оцените, как они смотрятся именно на вас',
  'Посмотрите разные формы и размеры бриллиантов и выберите свой вариант',
  'Увидите сертификаты IGI на бриллианты',
  'Под микроскопом рассмотрите серийный номер внутри бриллианта и убедитесь в его соответствии сертификату',
  'Оцените качество наших работ вживую — посадку камней, закрепку, обработку золота',
  'Увидите готовые украшения наших клиентов и оцените результат индивидуальных заказов',
  'Получите консультацию специалиста и подберите форму, размер и дизайн под себя',
  'Примете решение не по фото, а после личного знакомства с украшениями',
];

const INCLUDED = [
  ['Украшение'],
  ['Международный сертификат IGI'],
  ['Фирменный футляр'],
  ['Фирменный пакет'],
];

const DIAMOND_CHARS = [
  ['Чистота', 'VVS2/VS1', 'Без внутренних трещин и изъянов, видимых глазу'],
  ['Цвет', 'D/E', 'Абсолютно белый бриллиант, без пожелтевших оттенков'],
  ['Огранка', 'IDEAL', 'Идеальный блеск и игра света'],
  ['Сертификат', 'IGI', 'На каждый бриллиант весом 0.50 ct и выше'],
];

const SETTING_CHARS = [
  ['Золото', '4 г', 'Отсутствие экономий — стандарт на 1 украшение'],
  ['Проба', null, null],
  ['Конструкция', 'Надёжность', 'Спроектировано для длительной эксплуатации'],
  ['Дизайн', 'Изящество', 'Создано в собственной студии Neo Diamond'],
  ['Покрытие', 'Родирование', 'Бесплатное повторное родирование на весь срок'],
];

// ─── styles (inline, brandbook-compliant) ────────────────────────────────────

const S = {
  root: {
    minHeight: '100dvh',
    background: '#FAFBFC',        // paper-050
    color: '#0B2040',             // ink-800
    fontFamily: 'Manrope, sans-serif',
    overflowX: 'hidden',
  },
  inner: { maxWidth: 480, margin: '0 auto', padding: '0 24px' },
  eyebrow: {
    fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: '#7C6035',             // champagne-700
    marginBottom: 12,
  },
  h1: {
    fontFamily: '"Unbounded", sans-serif',
    fontWeight: 300, fontSize: '1.55rem',
    letterSpacing: '-0.02em', lineHeight: 1.25,
    margin: '0 0 8px', color: '#0B2040',
  },
  h2: {
    fontFamily: '"Unbounded", sans-serif',
    fontWeight: 400, fontSize: '1.1rem',
    letterSpacing: '-0.02em',
    margin: '0 0 8px', color: '#0B2040',
  },
  lead: { fontSize: '0.9rem', color: '#5B81A1', lineHeight: 1.65, margin: 0 },
  divider: { border: 'none', borderTop: '1.5px solid #DBE2EB', margin: '0' },
  card: {
    background: '#FFFFFF',
    border: '1.5px solid #DBE2EB',
    borderRadius: 24,
    padding: '20px 20px',
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 16,
    padding: '13px 0',
    borderBottom: '1px solid #E9EDF3',
  },
  rowLabel: { fontSize: '0.82rem', color: '#5B81A1', flexShrink: 0 },
  rowValue: { fontSize: '0.82rem', fontWeight: 600, color: '#0B2040', textAlign: 'right' },
  rowNote: { fontSize: '0.75rem', color: '#5B81A1', marginTop: 2, textAlign: 'right' },
  backBtn: {
    position: 'fixed', top: 14, left: 14, zIndex: 50,
    background: 'rgba(250,251,252,0.92)',
    border: '1.5px solid #DBE2EB',
    backdropFilter: 'blur(16px)', borderRadius: 50,
    padding: '0 16px', height: 36,
    display: 'flex', alignItems: 'center', gap: 4,
    color: '#0B2040', cursor: 'pointer',
    fontSize: '0.82rem', fontFamily: 'Manrope, sans-serif', fontWeight: 500,
  },
};

// ─── component ────────────────────────────────────────────────────────────────

export default function BookingScreen({ initial, onBack }) {
  const { shape, shank, cast, carat, purity, metalLabel, gem1Label, price } = initial;

  const shapeLabel  = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const castLabel   = CASTS.find(c => c.id === cast)?.label ?? cast;
  const productName = cardName(shank, cast, shapeLabel);
  const img         = ringImage(shank, cast, shape);
  const metalPurity = METAL_LABELS[purity] ?? purity;

  const timeLeft = useCountdown(TIMER_SECONDS);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
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
    <div style={S.root}>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />

      <button style={S.backBtn} onClick={onBack}>
        &lsaquo; Назад
      </button>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div style={S.inner}>

          {img && (
            <div style={{
              width: '100%', maxWidth: 320, margin: '0 auto 32px',
              aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden',
              background: 'linear-gradient(150deg,#6A8EAC,#40648A,#1E3149)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={img} alt={productName} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={S.eyebrow}>Ваш выбор</div>
            <h1 style={S.h1}>{productName}</h1>
            <p style={{ ...S.lead, marginTop: 6 }}>
              {[shapeLabel, carat ? `${carat} кар` : null, gem1Label, metalPurity, metalLabel]
                .filter(Boolean).join(' · ')}
            </p>
            {price && (
              <div style={{
                marginTop: 14, fontFamily: '"Courier New", monospace',
                fontSize: '1.3rem', fontWeight: 700, color: '#7C6035',
                letterSpacing: '0.04em',
              }}>
                от {formatPrice(price)}
              </div>
            )}
          </div>

          {/* Production time */}
          <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 50,
              background: '#F2F5F9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C6035" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5B81A1', marginBottom: 3 }}>
                Срок изготовления
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0B2040' }}>5–10 рабочих дней</div>
            </div>
          </div>

          {/* Included */}
          <div style={S.card}>
            <div style={{ ...S.eyebrow, marginBottom: 16 }}>В комплекте</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {INCLUDED.map(([label], i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 0',
                  borderBottom: i < INCLUDED.length - 1 ? '1px solid #E9EDF3' : 'none',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: 50,
                    background: '#7C6035', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.87rem', fontWeight: 500, color: '#0B2040' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr style={S.divider} />

      {/* ── CHARACTERISTICS ── */}
      <section style={{ padding: '56px 0' }}>
        <div style={S.inner}>
          <div style={S.eyebrow}>Характеристики</div>
          <h2 style={S.h2}>Ваш бриллиант</h2>
          <p style={{ ...S.lead, marginBottom: 24 }}>
            Мы используем бриллианты с высокими характеристиками — каждый подтверждён международным сертификатом IGI.
          </p>

          <div style={{ ...S.card, marginBottom: 24 }}>
            {[
              ['Форма огранки', shapeLabel, null],
              carat ? ['Каратность', `${carat} кт`, null] : null,
              ...DIAMOND_CHARS,
            ].filter(Boolean).map(([label, value, note], i, arr) => (
              <div key={label} style={{ ...S.row, borderBottom: i < arr.length - 1 ? '1px solid #E9EDF3' : 'none' }}>
                <span style={S.rowLabel}>{label}</span>
                <div>
                  <div style={S.rowValue}>{value}</div>
                  {note && <div style={S.rowNote}>{note}</div>}
                </div>
              </div>
            ))}
          </div>

          <h2 style={S.h2}>Оправа</h2>
          <p style={{ ...S.lead, marginBottom: 24 }}>
            При создании украшений мы придерживаемся двух принципов — надёжность в эксплуатации и изящность дизайна.
          </p>

          <div style={S.card}>
            {[
              ['Дизайн шинки', shank, null],
              ['Каст', castLabel, null],
              ['Металл', metalPurity, null],
              metalLabel ? ['Цвет золота', metalLabel, null] : null,
              ['Проба', purity === '750' ? '750 (18к)' : '585 (14к)', null],
              ['Золото', '4 г', 'Отсутствие экономий — стандарт на 1 украшение'],
              ['Покрытие', 'Родирование', 'Бесплатное повторное родирование на весь срок'],
            ].filter(Boolean).map(([label, value, note], i, arr) => (
              <div key={label} style={{ ...S.row, borderBottom: i < arr.length - 1 ? '1px solid #E9EDF3' : 'none' }}>
                <span style={S.rowLabel}>{label}</span>
                <div>
                  <div style={S.rowValue}>{value}</div>
                  {note && <div style={S.rowNote}>{note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr style={S.divider} />

      {/* ── LIVE SHOWING ── */}
      <section style={{ padding: '56px 0 24px' }}>
        <div style={S.inner}>
          <div style={S.eyebrow}>Живой показ</div>
          <h2 style={{ ...S.h2, fontSize: '1.25rem', marginBottom: 6 }}>
            Приглашаем в наш шоурум
          </h2>
          <p style={{ ...S.lead, marginBottom: 32 }}>
            Вас встретит наш главный специалист по бриллиантам, предложит напитки и проведёт консультацию.
          </p>

          <div style={{ ...S.card, marginBottom: 32 }}>
            {SHOW_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < SHOW_ITEMS.length - 1 ? '1px solid #E9EDF3' : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: 50,
                  background: '#7C6035', flexShrink: 0, marginTop: 7,
                }} />
                <span style={{ fontSize: '0.87rem', color: '#1E3149', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            ...S.card,
            borderColor: '#DCC29B',     // champagne-400 border
            marginBottom: 16,
          }}>
            {!isExpired ? (
              <>
                <div style={S.eyebrow}>Специальное предложение</div>
                <p style={{ fontSize: '0.92rem', color: '#0B2040', lineHeight: 1.6, margin: '0 0 16px' }}>
                  Напишите нам прямо сейчас и получите{' '}
                  <strong>индивидуальную гравировку на украшение в подарок</strong>.
                  Предложение действует только в течение:
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: '#F2F5F9', borderRadius: 12,
                  padding: '10px 16px', marginBottom: 20,
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#5B81A1', fontWeight: 500 }}>Осталось</span>
                  <span style={{
                    fontFamily: '"JetBrains Mono", "Courier New", monospace',
                    fontSize: '1.2rem', fontWeight: 700, color: '#7C6035',
                    letterSpacing: '0.06em',
                  }}>
                    {pad(mins)}:{pad(secs)}
                  </span>
                </div>
                <button onClick={() => openWA(true)} style={{
                  width: '100%', padding: '15px 24px',
                  borderRadius: 50, border: 'none', cursor: 'pointer',
                  background: '#25D366', color: '#fff',
                  fontSize: '0.95rem', fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <WhatsAppIcon />
                  Написать в WhatsApp
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.87rem', color: '#5B81A1', margin: '0 0 16px' }}>
                  Специальное предложение истекло, но мы всё равно будем рады вас видеть.
                </p>
                <button onClick={() => openWA(false)} style={{
                  width: '100%', padding: '15px 24px',
                  borderRadius: 50, border: 'none', cursor: 'pointer',
                  background: '#25D366', color: '#fff',
                  fontSize: '0.95rem', fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <WhatsAppIcon />
                  Забронировать живой показ
                </button>
              </>
            )}
          </div>

          <p style={{ fontSize: '0.75rem', color: '#C2D1DE', textAlign: 'center', marginBottom: 64 }}>
            Нажимая кнопку, вы перейдёте в WhatsApp — мы ответим в течение нескольких минут
          </p>
        </div>
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
