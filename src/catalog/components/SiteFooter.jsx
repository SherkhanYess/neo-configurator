import { useEffect, useState } from 'react';
import { ORG, SHOWROOMS, INSTAGRAM_HANDLE } from '../data/org.js';

// Футер решает две задачи сразу.
//
// Для человека — это конец страницы, где написано, куда приходить и как
// написать, без необходимости спрашивать это в переписке.
//
// Для поисковика и ИИ-ассистента — единственное место на сайте, где адреса и
// телефоны стоят обычным текстом на каждой странице. Разметка schema.org
// говорит машине то же самое формально; совпадение текста с разметкой повышает
// доверие к обоим.
//
// Шоурумы выложены колонками, а не строками: на широком экране они встают
// рядом, на узком — друг под другом, без табличной сетки.

const C = {
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink200:   '#C2D1DE',
  paper050: '#FAFBFC',
  paper300: '#DBE2EB',
  champ700: '#7C6035',
  champ400: '#C9A961',
  wa:       '#25D366',
};

const BTN = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  flex: '1 1 0', minWidth: 0,
  height: 38, padding: '0 10px',
  border: `1px solid ${C.ink600}`, borderRadius: 9,
  background: 'transparent', color: C.paper050,
  fontFamily: 'var(--font-body, Manrope, sans-serif)',
  fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.01em',
  textDecoration: 'none', whiteSpace: 'nowrap',
};

function TwoGisIcon() {
  // Не логотип 2ГИС, а метка на карте: воспроизводить чужой знак по памяти
  // рискованно, а подпись рядом и так называет сервис.
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.champ400}
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.wa} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.champ400}
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill={C.champ400} stroke="none" />
    </svg>
  );
}

function Showroom({ s }) {
  const waHref =
    `https://wa.me/${s.wa}?text=${encodeURIComponent(
      `Здравствуйте! Пишу с сайта, интересует украшение. Шоурум ${s.city}.`
    )}`;

  return (
    <div style={{ display: 'grid', gap: 9, alignContent: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-display, Unbounded, sans-serif)',
          fontSize: '0.95rem', fontWeight: 600, color: C.paper050,
        }}>
          {s.city}
        </span>
        <a
          href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}
          style={{
            color: C.paper050, textDecoration: 'none',
            borderBottom: `1px solid ${C.champ700}`, paddingBottom: 1,
            fontSize: '0.84rem', whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {s.phone}
        </a>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', fontSize: '0.82rem' }}>
        <span style={{ color: C.ink200 }}>{s.place}</span>
        <span style={{ color: C.paper300 }}>{s.streetAddress}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a href={s.twogis} target="_blank" rel="noopener noreferrer" style={BTN}>
          <TwoGisIcon />Открыть в 2ГИС
        </a>
        <a href={waHref} target="_blank" rel="noopener noreferrer" style={BTN}>
          <WhatsAppIcon />WhatsApp
        </a>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.champ400} aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

/**
 * Рейтинг из 2ГИС.
 *
 * Цифру собирает scripts/prerender.mjs при сборке и кладёт рядом файлом: она
 * меняется, а вшитая в код цифра однажды разойдётся с действительностью. Если
 * файла нет или запрос к 2ГИС не удался, строка просто не появляется.
 */
function Reputation() {
  const [rep, setRep] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/catalog/reputation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.line) setRep(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!rep) return null;

  return (
    <a
      href={rep.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        color: C.paper300, textDecoration: 'none', fontSize: '0.8rem',
      }}
    >
      <StarIcon />
      <span>
        <span style={{ color: C.paper050, fontWeight: 600 }}>{rep.rating}</span> из 5 в 2ГИС —{' '}
        {rep.ratings} оценок{rep.reviews ? `, ${rep.reviews} отзывов` : ''}
      </span>
    </a>
  );
}

export default function SiteFooter() {
  return (
    <footer
      style={{
        background: C.ink800,
        color: C.paper300,
        fontFamily: 'var(--font-body, Manrope, sans-serif)',
        lineHeight: 1.55,
        padding: '34px 20px 28px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 26 }}>

        <div>
          <div style={{
            fontFamily: 'var(--font-display, Unbounded, sans-serif)',
            fontSize: '1.05rem', fontWeight: 600, color: C.paper050, letterSpacing: '0.01em',
          }}>
            {ORG.name}
          </div>
          <div style={{ color: C.ink200, marginTop: 4, fontSize: '0.84rem' }}>{ORG.tagline}</div>
          <div style={{ marginTop: 10 }}><Reputation /></div>
        </div>

        <div style={{
          display: 'grid', gap: '24px 32px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}>
          {SHOWROOMS.map((s) => <Showroom key={s.city} s={s} />)}
        </div>

        {ORG.instagram && (
          <a
            href={ORG.instagram}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              height: 46, borderRadius: 10,
              border: `1px solid ${C.champ700}`, background: 'transparent',
              color: C.paper050, textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.01em',
            }}
          >
            <InstagramIcon />
            <span>Посмотреть Instagram</span>
            <span style={{ color: C.champ400 }}>{INSTAGRAM_HANDLE}</span>
          </a>
        )}

      </div>
    </footer>
  );
}
