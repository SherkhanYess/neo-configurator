import { useState } from 'react';
import { track, EVENTS } from '../lib/track.js';

// Block 8: the objections that stop a purchase, answered on the page.
//
// Order matters — the first two are the most common reasons people walk away
// from a lab-grown stone, so they are answered before anything else.
//
// Answers are placeholders until the studio supplies the real copy. They are
// visibly marked so nobody ships them by accident.

const C = {
  paper100: '#F2F5F9',
  paper200: '#E9EDF3',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
};

export const FAQ_ITEMS = [
  { q: 'Чем лабораторный бриллиант отличается от природного?' },
  { q: 'Отличит ли ювелир или экспертиза?' },
  { q: 'Что подтверждает сертификат IGI и где находится серийный номер?' },
  { q: 'Можно ли изменить размер после изготовления?' },
  { q: 'Что если украшение не подойдёт?' },
  { q: 'Как можно оплатить?' },
  { q: 'Я не в Алматы — как получить украшение?' },
];

const PLACEHOLDER = 'Текст ответа готовит студия.';

function Item({ index, question, answer, open, onToggle }) {
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.paper300}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '15px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif',
        }}
      >
        <span style={{
          flex: 1, fontSize: '0.89rem', fontWeight: 600,
          color: C.ink800, lineHeight: 1.45,
        }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
          border: `1.5px solid ${open ? C.ink800 : C.paper300}`,
          background: open ? C.ink800 : '#fff',
          color: open ? '#fff' : C.ink400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.05rem', lineHeight: 1, marginTop: 1,
          transition: 'background 0.18s, border-color 0.18s',
        }}>
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px' }}>
          <p style={{
            margin: 0, fontSize: '0.86rem', lineHeight: 1.6,
            color: answer ? C.ink600 : C.ink400,
            fontStyle: answer ? 'normal' : 'italic',
          }}>
            {answer ?? PLACEHOLDER}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Faq({ eyebrowStyle }) {
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    const next = openIndex === i ? null : i;
    setOpenIndex(next);
    if (next !== null) track(EVENTS.FAQ_OPEN, { question: i + 1 });
  }

  return (
    <section>
      <div style={eyebrowStyle}>Вопросы и ответы</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ_ITEMS.map((item, i) => (
          <Item
            key={item.q}
            index={i}
            question={item.q}
            answer={item.a}
            open={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </section>
  );
}
