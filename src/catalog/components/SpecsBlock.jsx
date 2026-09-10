// Block 3 of the booking page: everything the piece is, in one place.
//
// Replaces three separate blocks that used to say overlapping things — срок
// изготовления, в комплекте, преимущества. Six cells instead of four, because
// gold and setting belong here too; the section is therefore about the piece,
// not just the stone.

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

// Deliberately overlaps with the service block below: this is the one-line fact
// for anyone who never expands it, that block is the detail.
const INCLUDED = [
  'Срок изготовления 5–10 рабочих дней',
  'Ультразвуковая чистка и родирование — бесплатно, пожизненно',
  'Сертификат IGI, фирменный футляр и пакет в комплекте',
];

export default function SpecsBlock({ eyebrowStyle }) {
  return (
    <section>
      <div style={eyebrowStyle}>Характеристики украшения</div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: C.paper300, border: `1.5px solid ${C.paper300}`,
        borderRadius: 20, overflow: 'hidden', marginBottom: 18,
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {INCLUDED.map(item => (
          <div key={item} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <div style={{
              width: 5, height: 5, borderRadius: 50, background: C.champ700,
              flexShrink: 0, marginTop: 8,
            }} />
            <span style={{ fontSize: '0.87rem', color: C.ink600, lineHeight: 1.55 }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: '0.87rem', color: C.ink400, lineHeight: 1.65 }}>
        Не экономим на сырье и остаёмся на связи после покупки — то, чего вы лишаетесь
        при покупке у байеров из Китая и Дубая.
      </p>
    </section>
  );
}
