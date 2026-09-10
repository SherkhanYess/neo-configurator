// Proof shown on the product card, before the visitor is asked to commit.
//
// All of this used to live only on the booking screen — behind «Подтвердить
// выбор». Anyone who left on the card had seen the price and nothing else:
// no stone grade, no certificate, no service. The ask came before the reasons.
// This is the short version; the booking screen keeps the full story.

const C = {
  paper100: '#F2F5F9',
  paper200: '#E9EDF3',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
};

const SPECS = [
  ['Чистота',    'VVS2/VS1'],
  ['Цвет',       'D/E'],
  ['Огранка',    'IDEAL'],
  ['Сертификат', 'IGI'],
];

const INCLUDED = [
  'Срок изготовления 5–10 рабочих дней',
  'Ультразвуковая чистка и родирование — бесплатно, пожизненно',
  'Сертификат IGI, фирменный футляр и пакет в комплекте',
];

export default function TrustBlock() {
  return (
    <div className="cfg-section">
      <div className="cfg-section-label">Характеристики бриллианта</div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: C.paper300, border: `1px solid ${C.paper300}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 12,
      }}>
        {SPECS.map(([label, value]) => (
          <div key={label} style={{ background: '#fff', padding: '12px 14px' }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: C.ink400, marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: '"Unbounded", sans-serif', fontWeight: 400,
              fontSize: '0.95rem', color: C.ink800, letterSpacing: '-0.01em',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INCLUDED.map(item => (
          <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 5, height: 5, borderRadius: 50, background: C.champ700,
              flexShrink: 0, marginTop: 7,
            }} />
            <span style={{ fontSize: '0.82rem', color: C.ink600, lineHeight: 1.5 }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
