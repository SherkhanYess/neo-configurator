import { ORG, SHOWROOMS, HOURS_NOTE, FACTS } from '../data/org.js';

// Футер решает две задачи сразу.
//
// Для человека — это место, где в конце страницы находятся адреса и телефоны,
// не заставляя писать в WhatsApp ради вопроса «а вы вообще где».
//
// Для поисковика и ИИ-ассистента — это единственное место на сайте, где адреса,
// телефоны и условия написаны обычным текстом на каждой странице. Разметка
// schema.org говорит машине то же самое формально, но текстом ассистенты
// пользуются охотнее, а совпадение текста с разметкой повышает доверие к обоим.

const C = {
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink200:   '#C2D1DE',
  paper050: '#FAFBFC',
  paper300: '#DBE2EB',
  champ700: '#7C6035',
  champ400: '#C9A961',
};

const LABEL = {
  fontSize: '0.64rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: C.champ400,
  marginBottom: 10,
};

const LINK = {
  color: C.paper050,
  textDecoration: 'none',
  borderBottom: `1px solid ${C.champ700}`,
  paddingBottom: 1,
};

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.champ400}
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
         style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer
      style={{
        background: C.ink800,
        color: C.paper300,
        fontFamily: 'var(--font-body, Manrope, sans-serif)',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        padding: '38px 20px 28px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'grid', gap: 30 }}>

        <div>
          <div style={{
            fontFamily: 'var(--font-display, Unbounded, sans-serif)',
            fontSize: '1.05rem', fontWeight: 600, color: C.paper050, letterSpacing: '0.01em',
          }}>
            {ORG.name}
          </div>
          <div style={{ color: C.ink200, marginTop: 5 }}>{ORG.tagline}</div>
        </div>

        <div>
          <div style={LABEL}>Шоурумы</div>
          <div style={{ display: 'grid', gap: 16 }}>
            {SHOWROOMS.map((s) => (
              <div key={s.city} style={{ display: 'flex', gap: 9 }}>
                <PinIcon />
                <div>
                  <div style={{ color: C.paper050, fontWeight: 600 }}>{s.city}</div>
                  <div style={{ color: C.paper300 }}>{s.streetAddress}</div>
                  <a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`} style={{ ...LINK, display: 'inline-block', marginTop: 3 }}>
                    {s.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: C.ink200, marginTop: 14, fontSize: '0.8rem' }}>{HOURS_NOTE}</div>
        </div>

        <div>
          <div style={LABEL}>Условия</div>
          <dl style={{ margin: 0, display: 'grid', gap: 9 }}>
            {FACTS.map(([term, value]) => (
              <div key={term} style={{ display: 'grid', gap: 1 }}>
                <dt style={{ color: C.ink200, fontSize: '0.78rem' }}>{term}</dt>
                <dd style={{ margin: 0, color: C.paper050 }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div style={{
          borderTop: `1px solid ${C.ink600}`, paddingTop: 16,
          display: 'flex', flexWrap: 'wrap', gap: '10px 18px',
          alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.78rem', color: C.ink200,
        }}>
          <span>Доставка по всему Казахстану и за рубеж</span>
          {ORG.instagram && (
            <a href={ORG.instagram} target="_blank" rel="noopener noreferrer" style={LINK}>
              Instagram
            </a>
          )}
        </div>

      </div>
    </footer>
  );
}
