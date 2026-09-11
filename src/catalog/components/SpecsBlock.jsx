// Block 3 of the booking page: the grid of specifications, nothing else.
//
// Six cells instead of four, because gold and setting belong here too — hence
// «украшения», not «бриллианта».
//
// Everything that used to sit under the grid has moved to where it belongs:
// lead time is its own block next to the price (it will carry stock status
// later), and the service promises live in the service block below. Repeating
// them here only made the page longer.

const C = {
  paper050: '#FAFBFC',
  paper200: '#E9EDF3',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
};

const SPECS = [
  ['Чистота',    'VVS2/VS1', 'без изъянов, видимых глазу'],
  ['Цвет',       'D/E',      'абсолютно белый'],
  ['Огранка',    'IDEAL',    'максимум блеска из карата'],
  ['Сертификат', 'IGI',      'международная гарантия'],
  ['Золото',     '585 / 750','на выбор'],
  ['Оправа',     '4 г',      'в среднем на украшение'],
];

export default function SpecsBlock({ eyebrowStyle }) {
  return (
    <section>
      <div style={eyebrowStyle}>Характеристики украшения</div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: C.paper300, border: `1.5px solid ${C.paper300}`,
        borderRadius: 20, overflow: 'hidden',
      }}>
        {SPECS.map(([label, value, note]) => (
          <div key={label} style={{ background: '#fff', padding: '14px 16px' }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.13em',
              textTransform: 'uppercase', color: C.ink400, marginBottom: 5,
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: '"Unbounded", sans-serif', fontWeight: 400,
              fontSize: '1rem', color: C.ink800, letterSpacing: '-0.01em',
              marginBottom: 4, lineHeight: 1.2,
            }}>
              {value}
            </div>
            <div style={{ fontSize: '0.72rem', color: C.ink400, lineHeight: 1.4 }}>
              {note}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
