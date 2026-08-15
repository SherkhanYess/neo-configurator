import { useState, useEffect, useRef } from 'react';
import { ringImage, cardName, SHAPES, CASTS, METAL_LABELS, WA_NUMBER } from '../data/config.js';
import { formatPrice } from '../data/priceCalc.js';

const TIMER_SECONDS = 600; // 10 minutes

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      setLeft(Math.max(0, seconds - elapsed));
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [seconds]);
  return left;
}

const SHOW_ITEMS = [
  'Примерите украшения вживую и оцените, как они смотрятся именно на Вас',
  'Посмотрите разные формы и размеры бриллиантов и выберите свой вариант',
  'Увидите сертификаты IGI на бриллианты',
  'Под микроскопом рассмотрите серийный номер внутри бриллианта и убедитесь в его соответствии сертификату',
  'Оцените качество наших работ вживую — посадку камней, закрепку, обработку золота',
  'Увидите готовые украшения наших клиентов и оцените результат индивидуальных заказов',
  'Получите консультацию специалиста и подберите форму, размер и дизайн под себя',
  'Примете решение не по фото, а после личного знакомства с украшениями',
];

const INCLUDED = [
  { icon: '💍', label: 'Украшение' },
  { icon: '📜', label: 'Сертификат IGI' },
  { icon: '🎁', label: 'Футляр' },
  { icon: '🛍', label: 'Фирменный пакет' },
];

const DIAMOND_SPECS = {
  round:    { cut: 'Превосходная (Excellent)', clarity: 'VS1–VS2', color: 'D–F' },
  princess: { cut: 'Отличная (Very Good)',      clarity: 'VS1–VS2', color: 'E–G' },
  radiant:  { cut: 'Отличная (Very Good)',      clarity: 'VS1–VS2', color: 'E–G' },
  cushion:  { cut: 'Отличная (Very Good)',      clarity: 'VS1–VS2', color: 'E–G' },
  oval:     { cut: 'Превосходная (Excellent)',  clarity: 'VS1–VS2', color: 'D–F' },
  pear:     { cut: 'Превосходная (Excellent)',  clarity: 'VS1–VS2', color: 'D–F' },
  heart:    { cut: 'Отличная (Very Good)',      clarity: 'VS1–VS2', color: 'E–G' },
  marquise: { cut: 'Превосходная (Excellent)',  clarity: 'VS1–VS2', color: 'D–F' },
  emerald:  { cut: 'Ступенчатая (Step cut)',    clarity: 'VVS2–VS1', color: 'D–F' },
  asscher:  { cut: 'Ступенчатая (Step cut)',    clarity: 'VVS2–VS1', color: 'D–F' },
};

export default function BookingScreen({ initial, onBack }) {
  const { shape, shank, cast, carat, purity, metalLabel, gem1Label, price } = initial;

  const shapeLabel = SHAPES.find(s => s.id === shape)?.label ?? shape;
  const castLabel  = CASTS.find(c => c.id === cast)?.label ?? cast;
  const productName = cardName(shank, cast, shapeLabel);
  const img = ringImage(shank, cast, shape);
  const metalPurity = METAL_LABELS[purity] ?? purity;
  const diamondSpec = DIAMOND_SPECS[shape] ?? DIAMOND_SPECS.round;
  const timeLeft = useCountdown(TIMER_SECONDS);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isExpired = timeLeft === 0;

  function buildWAMessage(withEngraving = false) {
    const lines = [
      '👋 Здравствуйте! Хочу забронировать живой показ украшения Neo Diamond:',
      `💍 ${productName}`,
      `✦ Форма бриллианта: ${shapeLabel}`,
      carat      && `✦ Каратность: ${carat} кар`,
      gem1Label  && `✦ Бриллиант: ${gem1Label}`,
      `✦ Металл: ${metalPurity}${metalLabel ? `, ${metalLabel}` : ''}`,
      price      && `✦ Стоимость: от ${formatPrice(price)}`,
      withEngraving && !isExpired && '',
      withEngraving && !isExpired && '🎁 Хочу получить индивидуальную гравировку в подарок!',
    ].filter(v => v !== false && v !== undefined).join('\n');
    return lines;
  }

  function openWA(withEngraving = false) {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWAMessage(withEngraving))}`, '_blank');
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0b1f35',
      color: '#fff',
      fontFamily: 'Manrope, sans-serif',
      overflowX: 'hidden',
    }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 50,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)', borderRadius: 20,
          padding: '0 14px', height: 34, display: 'flex', alignItems: 'center', gap: 4,
          color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: '0.82rem',
          fontFamily: 'Manrope, sans-serif', fontWeight: 500,
        }}
      >
        ‹ Назад
      </button>

      {/* ── HERO ── */}
      <section style={{ padding: '72px 24px 48px', maxWidth: 480, margin: '0 auto' }}>

        {/* Ring image */}
        {img && (
          <div style={{
            width: '100%', aspectRatio: '1/1', maxWidth: 320,
            margin: '0 auto 28px',
            borderRadius: 20,
            overflow: 'hidden',
            background: 'linear-gradient(135deg,#1a3252,#0d243a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={img} alt={productName} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
          </div>
        )}

        {/* Name + params */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: '#c9a96e', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
            Ваш выбор
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {productName}
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            {[
              shapeLabel,
              carat ? `${carat} карат` : null,
              gem1Label,
              metalPurity,
              metalLabel,
            ].filter(Boolean).join(' · ')}
          </div>
          {price && (
            <div style={{ marginTop: 10, fontSize: '1.25rem', fontWeight: 700, color: '#c9a96e' }}>
              от {formatPrice(price)}
            </div>
          )}
        </div>

        {/* Production time */}
        <div style={{
          background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.4rem' }}>⏱</span>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#c9a96e', fontWeight: 600, letterSpacing: '0.05em' }}>СРОК ИЗГОТОВЛЕНИЯ</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: 2 }}>5–10 рабочих дней</div>
          </div>
        </div>

        {/* Included */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 14 }}>
            В комплекте
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {INCLUDED.map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 12,
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARACTERISTICS ── */}
      <section style={{
        background: 'rgba(255,255,255,0.04)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: '#c9a96e', textTransform: 'uppercase', fontWeight: 600, marginBottom: 24 }}>
            Характеристики
          </div>

          {/* Diamond */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
              💎 Бриллиант
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 12, overflow: 'hidden' }}>
              {[
                ['Форма огранки', shapeLabel],
                ['Огранка', diamondSpec.cut],
                carat && ['Каратность', `${carat} кт`],
                ['Чистота', diamondSpec.clarity],
                ['Цвет', diamondSpec.color],
                ['Сертификат', 'IGI International'],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)', padding: '11px 16px',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Setting */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ Оправа
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 12, overflow: 'hidden' }}>
              {[
                ['Дизайн шинки', shank],
                ['Каст', castLabel],
                ['Металл', metalPurity],
                metalLabel && ['Цвет золота', metalLabel],
                ['Проба', purity === '750' ? '750 (18к)' : '585 (14к)'],
                ['Покрытие', 'Родирование'],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)', padding: '11px 16px',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE SHOWING ── */}
      <section style={{ padding: '40px 24px 32px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: '#c9a96e', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
          Живой показ
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          Приглашаем в наш шоурум
        </h2>
        <p style={{ fontSize: '0.87rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 24px' }}>
          Вас встретит наш главный специалист по бриллиантам, предложит напитки и проведёт консультацию 🤗
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {SHOW_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#c9a96e', fontSize: '0.9rem', marginTop: 2, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: '0.87rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.06))',
          border: '1px solid rgba(201,169,110,0.4)',
          borderRadius: 20, padding: '24px 20px', marginBottom: 16,
        }}>
          {/* Timer */}
          {!isExpired ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: '#c9a96e', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                  🎁 Специальное предложение
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, marginBottom: 16 }}>
                  Напишите нам прямо сейчас и получите<br />
                  <strong style={{ color: '#fff' }}>индивидуальную гравировку на украшение в подарок</strong>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '8px 16px',
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Предложение истекает через</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c9a96e', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
                    {pad(mins)}:{pad(secs)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openWA(true)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: '#25D366', color: '#fff',
                  fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  letterSpacing: '-0.01em',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Написать в WhatsApp
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Специальное предложение истекло</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>Но мы всё равно будем рады видеть вас!</div>
              </div>
              <button
                onClick={() => openWA(false)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: '#25D366', color: '#fff',
                  fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Забронировать живой показ
              </button>
            </>
          )}
        </div>

        {/* Secondary CTA */}
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: 48 }}>
          Нажимая кнопку, вы перейдёте в WhatsApp — мы ответим в течение нескольких минут
        </p>
      </section>
    </div>
  );
}
