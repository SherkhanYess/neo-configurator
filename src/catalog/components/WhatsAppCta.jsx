import { useEffect, useState } from 'react';
import { WA_BY_CITY, WA_CITIES, WA_NUMBER } from '../data/config.js';

// Переход в WhatsApp с выбором города.
//
// Раньше это жило внутри страницы заявки. В песочнице страницы заявки нет —
// карточка ведёт в WhatsApp напрямую, — поэтому выбор города переехал сюда и
// используется обеими страницами, а не копируется.
//
// Каждый шоурум отвечает со своего номера, поэтому город приходится спросить
// до передачи разговора.
//
// Варианты города — это ссылки <a href>, а не кнопки с window.open: переход,
// который уводит со страницы, должен быть обычной ссылкой, иначе встроенный
// браузер Instagram его проглатывает.

const C = {
  paper050: '#FAFBFC',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink400:   '#5B81A1',
  wa:       '#25D366',
};

const eyebrow = {
  fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: C.ink400,
};

export function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function CityModal({ hrefFor, onPick, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Выберите город"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(11,32,64,0.42)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        background: C.paper050, borderRadius: '28px 28px 0 0',
        width: '100%', maxWidth: 480,
        padding: '28px 24px calc(24px + env(safe-area-inset-bottom))',
        fontFamily: 'Manrope, sans-serif', textAlign: 'left',
      }}>
        <div style={{ ...eyebrow, marginBottom: 8 }}>Ваш город</div>
        <h3 style={{
          fontFamily: '"Unbounded",sans-serif', fontWeight: 300,
          fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1.3,
          margin: '0 0 6px', color: C.ink800,
        }}>
          Куда написать?
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: C.ink400, lineHeight: 1.55 }}>
          Ответит тот шоурум, который вам ближе.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WA_CITIES.map(city => (
            <a
              key={city} href={hrefFor(city)} target="_blank" rel="noopener noreferrer"
              onClick={() => onPick(city)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 56, padding: '14px 20px', borderRadius: 50,
                border: `1.5px solid ${C.paper300}`, background: '#fff',
                color: C.ink800, textDecoration: 'none',
                fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box',
              }}
            >
              {city}
              <span style={{ color: C.wa, display: 'flex' }}><WhatsAppIcon /></span>
            </a>
          ))}
        </div>

        <button
          type="button" onClick={onClose}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', color: C.ink400, fontFamily: 'Manrope, sans-serif',
            padding: '14px 0 4px',
          }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

/**
 * Кнопка перехода в WhatsApp.
 *
 * `message` — текст, который увидит менеджер. `onHandover` вызывается в момент,
 * когда человек выбрал город и уходит: это и есть точка выхода из воронки.
 */
export default function WhatsAppCta({ label, message, onHandover, children }) {
  const [picking, setPicking] = useState(false);

  const hrefFor = (city) =>
    `https://wa.me/${WA_BY_CITY[city] ?? WA_NUMBER}?text=${encodeURIComponent(message(city))}`;

  return (
    <>
      {children
        ? children(() => setPicking(true))
        : (
          <button type="button" className="detail-cta-book" onClick={() => setPicking(true)}>
            {label}
          </button>
        )}

      {picking && (
        <CityModal
          hrefFor={hrefFor}
          onPick={(city) => { onHandover?.(city); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
