import { useState } from 'react';
import { track, EVENTS } from '../lib/track.js';

// Block 8: the objections that stop a purchase, answered on the page.
//
// Two groups. Buying questions come first — they are the practical blockers a
// ready buyer hits. The diamond questions follow, because they decide whether
// someone believes in a lab-grown stone at all.
//
// faq_open reports the question's number as written below (1–13, continuous
// across both groups), so the analytics line up with the source document.

const C = {
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
};

export const FAQ_GROUPS = [
  {
    title: 'Покупка',
    items: [
      {
        q: 'Как можно вживую примерить украшение?',
        a: [
          'У нас два шоурума: Алматы, ЖК Esentai City, и Астана, ЖК Atlant. Живые показы проходят по записи.',
          'Напишите нам в WhatsApp — ответим на вопросы и подберём удобное время. На показе вы примерите разные формы и каратности на своей руке, рассмотрите сертификат IGI и серийный номер внутри камня под микроскопом и оцените качество работы вживую, а не по фотографии.',
        ],
      },
      {
        q: 'Есть ли украшения в наличии?',
        a: ['Да, часть моделей есть в наличии. Напишите нам в WhatsApp — уточним по конкретной конфигурации.'],
      },
      {
        q: 'Есть ли скидки?',
        a: ['Да. 2% при оплате наличными или переводом и 5% при покупке нескольких украшений. Дополнительные условия обсуждаем индивидуально на живом показе.'],
      },
      {
        q: 'Как можно оплатить?',
        a: ['Напишите нам в WhatsApp — подберём удобный способ. Работаем по договору: 50% после его заключения, оставшиеся 50% — при получении украшения.'],
      },
      {
        q: 'Что если украшение не подойдёт?',
        a: [
          'До начала работы мы согласовываем с вами 3D-модель будущего украшения. Вы заранее видите пропорции, посадку камня и форму оправы — и вносите правки на этом этапе, пока ювелир ещё не приступил.',
          'Поэтому к моменту изготовления сюрпризов не остаётся: вы получаете ровно то украшение, которое утвердили.',
        ],
      },
      {
        q: 'Я не в Алматы и не в Астане — как получить украшение?',
        a: [
          'У нас два шоурума: Алматы, ЖК Esentai City, и Астана, ЖК Atlant.',
          'Если вы в другом городе, доставим украшение бесплатно по всему Казахстану за 2–5 дней. Также отправляем в любую страну мира — напишите нам в WhatsApp, рассчитаем сроки и условия под ваш адрес.',
        ],
      },
    ],
  },
  {
    title: 'О бриллиантах',
    items: [
      {
        q: 'Чем лабораторный бриллиант отличается от природного?',
        a: [
          'Только происхождением. Природный формировался миллиарды лет под землёй, лабораторный выращивают в реакторе, воспроизводя тот же процесс значительно быстрее.',
          'Кристаллическая структура, химический состав, твёрдость, блеск и игра света — идентичны. GIA, одна из самых авторитетных геммологических организаций в мире, признаёт оба вида настоящими бриллиантами.',
          'Разница в цене объясняется не качеством камня, а тем, как устроен рынок природных бриллиантов. Подробнее об этом вы можете узнать, написав нам в WhatsApp.',
        ],
      },
      {
        q: 'Что такое сертификат IGI?',
        a: [
          'IGI — International Gemological Institute, международная геммологическая лаборатория. Сертификат — это независимое подтверждение характеристик камня: каратности, чистоты, цвета, огранки и происхождения.',
          'На рундист камня лазером нанесён серийный номер — его видно под микроскопом, и по нему сертификат проверяется в базе IGI.',
          'Нет сертификата — нет гарантии, всё остальное просто слова продавца. Каждый наш камень от 0,5 карат идёт с сертификатом IGI, и вы получаете его вместе с украшением.',
        ],
      },
      {
        q: 'Как убедиться, что это настоящий бриллиант, а не имитация?',
        a: [
          'Самая частая подмена на рынке — муассанит. Внешне он очень похож на бриллиант, даёт красивую игру света и на обычном даймонд-тестере показывает положительный результат. Именно поэтому его иногда продают под видом «выращенного бриллианта» или «лабораторного камня».',
          'Но муассанит — камень уровня бижутерии: другой состав, другие характеристики, другая ценность.',
          'Защита одна — сертификат независимой лаборатории. Для лабораторного бриллианта это IGI, для природного — GIA.',
        ],
      },
      {
        q: 'Какая страна происхождения ваших бриллиантов?',
        a: [
          'На качество камня страна не влияет. За него отвечают 4C — карат, чистота, цвет и огранка. Именно эти четыре параметра указаны в сертификате IGI, и именно по ним бриллианты сравнивают во всём мире.',
          'Камень с одинаковыми характеристиками будет одинаковым и из Сингапура, и из США, и из любой другой страны. Бриллиант везде бриллиант.',
          'Наши бриллианты происходят из Индии — сегодня это страна номер один в мире по объёму выращивания и огранки бриллиантов.',
        ],
      },
      {
        q: 'Бриллиант — это инвестиция?',
        a: [
          'Честный ответ: за редким исключением нет.',
          'Инвестиционную ценность имеют фантазийные цветные бриллианты больших каратностей — розовые, голубые, красные. Они уходят на аукционах Christie’s и Sotheby’s, и стоимость таких камней начинается от миллиона долларов.',
          'Всё остальное при перепродаже теряет значительную часть стоимости. Розничная цена включает маркетинг, дистрибуцию, аренду и наценку на каждом этапе, а продать камень частному лицу практически некому: ломбарды бриллианты не принимают, нужен доступ к бирже или знакомый дилер.',
          'Бриллиант покупают не ради доходности. Единственная инвестиция здесь — в собственную красоту, эмоции и статус. В этой роли лабораторный бриллиант справляется полностью.',
        ],
      },
      {
        q: 'Почему природные бриллианты стоят дороже?',
        a: [
          'Не из-за редкости — алмазов на планете достаточно.',
          'Цену сформировала De Beers: в начале XX века компания контролировала до 90% мировой добычи и намеренно выпускала камни на рынок ограниченно, создавая дефицит. Слоган «A Diamond Is Forever» (1947) и правило «две-три зарплаты на кольцо» — не народная традиция, а рекламные кампании той же компании.',
          'Переплата идёт не за камень, а за маркетинг столетней давности.',
        ],
      },
      {
        q: 'Делаете ли вы украшения с природными бриллиантами?',
        a: [
          'Да. Если вы всё же решили, что вам нужен природный бриллиант, мы без проблем работаем и с ними — с официальными сертификатами GIA.',
          'На сроки и остальные условия это не влияет. Влияет только на цену.',
          'Чтобы получить расчёт этого же украшения с природным бриллиантом и полную консультацию, напишите нам в WhatsApp.',
        ],
      },
    ],
  },
];

// Answers mention WhatsApp repeatedly, and each mention is a live exit — the
// person is already reading the reason they would write. Rendered as a real
// <a href>, like the main CTA: in-app browsers swallow scripted opens.
//
// The link carries the same configured message, so the manager sees the piece
// being asked about rather than a bare "здравствуйте".
function withWhatsAppLinks(text, href, onClick) {
  const parts = text.split('WhatsApp');
  if (parts.length === 1) return text;

  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            style={{ color: C.ink800, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            WhatsApp
          </a>,
          part,
        ]
  );
}

function Item({ question, answer, open, onToggle, waHref, onWaClick }) {
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
        <span style={{ flex: 1, fontSize: '0.89rem', fontWeight: 600, color: C.ink800, lineHeight: 1.45 }}>
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
        <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {answer.map((para, i) => (
            <p key={i} style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.65, color: C.ink600 }}>
              {waHref ? withWhatsAppLinks(para, waHref, onWaClick) : para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Numbered once, outside render — counting during render means mutating while
// React is drawing, which is the sort of thing that quietly doubles up.
const NUMBERED = (() => {
  let n = 0;
  return FAQ_GROUPS.map(group => ({
    title: group.title,
    items: group.items.map(item => ({ ...item, n: ++n, key: `${group.title}|${item.q}` })),
  }));
})();

export default function Faq({ eyebrowStyle, waHref, onWaClick }) {
  const [openKey, setOpenKey] = useState(null);

  function toggle(key, number) {
    const next = openKey === key ? null : key;
    setOpenKey(next);
    if (next !== null) track(EVENTS.FAQ_OPEN, { question: number });
  }

  return (
    <section>
      <div style={eyebrowStyle}>Вопросы и ответы</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {NUMBERED.map(group => (
          <div key={group.title}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: C.champ700, margin: '0 0 12px 2px',
            }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map(item => (
                <Item
                  key={item.key}
                  question={item.q}
                  answer={item.a}
                  open={openKey === item.key}
                  onToggle={() => toggle(item.key, item.n)}
                  waHref={waHref}
                  onWaClick={() => onWaClick?.(item.n)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
