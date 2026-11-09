import { ringImage } from './config.js';
import { defaultProducts, keyOf } from './models.js';
import TONES from './feed-tones.json';

// Содержание ленты: модели, по карточке на каждую.
//
// Лента — не каталог, а обложки линеек: на фото одна шинка с разными
// огранками. Огранка в ленте не упоминается, её выбирают на странице модели.
//
// Какие модели стоят в ленте — решает список моделей (models.js, админка
// «Модели и цены»): у каждой пары «шинка + оправа» есть признак feed. Ореол —
// выбор на странице модели, а не отдельная карточка: Halo и Neo Halo в ленте
// не стоят. Исключение — Halo Luxe: у него своя карточка, а на странице ореол
// включён с самого начала (решение владельца, 09.11.2026).
//
// Текст — до ~75 знаков, ровно две строки на телефоне. Говорит, как устроено
// кольцо, и ничего не обещает: «не выходит из моды» — слова продавца, а не
// свойство изделия.
//
// Всё это правится в админке (раздел «Лента») и приходит с сервера
// документом /api/content/feed. Здесь — то, что показывается, пока его нет:
// тексты и фото из public/assets/feed/, а без фото — студийный рендер с
// круглым камнем. У модели, добавленной в админке, нет ни того ни другого:
// её карточка появляется, когда в «Ленте» загрузят фото.

const SEED = {
  'Sirius|classic':      { photo: 'sirius.webp',      text: 'Один бриллиант на четырёх лапках. Свет проходит сквозь камень со всех сторон.' },
  'Neo|classic':         { photo: 'neo.webp',         text: 'Один бриллиант на четырёх лапках. Свет проходит сквозь камень со всех сторон.' },
  'Sirius Luxe|classic': { photo: 'sirius-luxe.webp', text: 'Бриллианты продолжаются по шинке. Кольцо собирает свет и сверху, и сбоку.' },
  'Neo Luxe|classic':    { photo: 'neo-luxe.webp',    text: 'Бриллианты продолжаются по шинке. Кольцо собирает свет и сверху, и сбоку.' },
  'Sirius Luxe|halo':    { photo: 'halo-luxe.webp',   text: 'Ореол вокруг камня и дорожка по шинке. Свет идёт со всех сторон.' },
  'Bezel|bezel':         { photo: 'bezel.webp',       text: 'Камень в сплошном золотом ободке. Ничего не выступает и не цепляется.' },
};

// Кадр «на руке» — пауза в ленте после указанной по счёту модели. Без фото не
// показывается: пустая пауза хуже никакой.
const BREAKS = [
  { id: 'hand-1', after: 3, photo: 'hand-1.webp', title: 'Как они выглядят на руке' },
  { id: 'hand-2', after: 6, photo: 'hand-2.webp', title: 'Как они выглядят на руке' },
];

export const DEFAULT_TITLE = 'То, что между вами, — в одном кольце';

// Обложка бренда — первое, что видит человек: знак taena, обещание бренда и
// чёрно-белое фото рук двоих (брендбук taena: «герой — двое, а не кольцо»).
// Фото загружают в админке; сайт сам делает его чёрно-белым. Пока своего
// нет — кольцо с овалом в пальцах (выбор владельца, 09.11.2026; фото из
// Pinterest — до своей съёмки).
export const DEFAULT_HERO = {
  // Позиционирование из брендбука: «не бренд помолвочных колец, а бренд
  // материальных символов отношений». С заглавной — решение владельца
  // (09.11.2026): в начале фразы, хотя брендбук пишет имя строчными.
  title: 'Taena — бренд материальных символов отношений',
  sub: '',
  cta: 'Смотреть каталог',
  cta2: 'Обсудить свой дизайн',
  photo: '/assets/taena/hero-oval.webp',
  focus: { x: 50, y: 38 },
};

/** Обложка: что сохранено в админке, а пустое — по умолчанию. */
export function feedHero(content) {
  const h = content?.hero ?? {};
  return {
    title: h.title || DEFAULT_HERO.title,
    sub: h.sub || DEFAULT_HERO.sub,
    cta: h.cta || DEFAULT_HERO.cta,
    cta2: h.cta2 || DEFAULT_HERO.cta2,
    photo: h.photo || DEFAULT_HERO.photo,
    position: position(h.photo ? h.focus : DEFAULT_HERO.focus),
  };
}

/** Тире не начинает строку: пробел перед ним — неразрывный. */
export const typo = (text) => String(text ?? '').replace(/ +([—–])/g, '\u00A0$1');

const WORDS = ['', 'Одно', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять', 'Десять', 'Одиннадцать', 'Двенадцать'];
const plural = (n, one, few, many) => {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
};

/** Строка над моделями по умолчанию. */
export const DEFAULT_LIST_TITLE = 'Каталог помолвочных колец';

/** Подзаголовок по умолчанию считает модели сам: скрыли одну — «Восемь колец». */
export function defaultSub(count) {
  const n = WORDS[count] ?? String(count);
  const word = plural(count, 'кольцо', 'кольца', 'колец');
  // «Одна кольцо» — нельзя: у одного кольца свой вариант.
  if (count === 1) return 'Одно кольцо. Листайте — может, оно её.';
  return `${n} ${word}. Листайте — одно из них её.`;
}

// Тон, в который уходит низ фото: для фото из админки он считается при
// загрузке, для файлов в public/assets/feed/ — командой `npm run feed:tones`
// (правило — в DESIGN.md). Для того, что ещё не посчитано, — нейтральный тёмный.
export const FALLBACK_TONE = '#3E3E3E';
export const toneOf = (src) => TONES[src] ?? FALLBACK_TONE;

export const feedPhoto = (file) => `/assets/feed/${file}`;

/**
 * Модели ленты в порядке списка моделей: ключ «шинка|оправа», имя, текст и
 * фото по умолчанию. Скрытые тоже здесь — админке они нужны, сайт их убирает.
 */
export function feedBase(products) {
  return (products?.rings ?? defaultProducts().rings)
    .filter(r => r.feed)
    .map(r => {
      const key = keyOf(r.shank, r.cast);
      const seed = SEED[key];
      const own = seed ? feedPhoto(seed.photo) : null;
      return {
        key, model: r.name, shank: r.shank, cast: r.cast, enabled: r.enabled !== false,
        text: seed?.text ?? '',
        staticPhoto: own && TONES[own] ? own : null,
      };
    });
}

/** Студийный рендер — фото по умолчанию, пока своего нет. */
export const renderPhoto = (shank, cast) => ringImage(shank, cast, 'round');

const position = (focus, fallbackY = 50) =>
  `${focus?.x ?? 50}% ${focus?.y ?? fallbackY}%`;

/**
 * Лента: модель, её текст, фото, тон и из какой комбинации она собрана.
 *
 * Комбинация нужна, чтобы попасть на страницу модели и посчитать цену —
 * в коде кольцо описывается парой «шинка + оправа», а человеку показывается
 * одно название.
 *
 * @param products  настройки моделей (видимость и имена) — /api/get-products
 * @param content   документ ленты из админки или null
 */
export function feedModels(products, content) {
  const edits = new Map((content?.models ?? []).map(m => [m.key, m]));
  const base = feedBase(products);
  const byKey = new Map(base.map(m => [m.key, m]));

  // Порядок из админки; модель, которой в нём ещё нет (новая), — в конец.
  const order = [...(content?.models ?? []).map(m => m.key), ...base.map(m => m.key)]
    .filter((k, i, all) => all.indexOf(k) === i);

  return order.flatMap((key) => {
    const m = byKey.get(key);
    if (!m || !m.enabled) return [];  // модели нет или она скрыта — карточки тоже нет
    const edit = edits.get(key);

    let src, tone;
    if (edit?.photo) {
      src = edit.photo;
      tone = edit.tone ?? edit.toneAuto ?? FALLBACK_TONE;
    } else {
      src = m.staticPhoto ?? renderPhoto(m.shank, m.cast);
      tone = src ? toneOf(src) : FALLBACK_TONE;
    }
    if (!src) return [];              // новая модель без фото — пустая карточка хуже никакой

    return [{
      key,
      model: m.model,
      text: edit?.text || m.text,
      shank: m.shank,
      cast: m.cast,
      src,
      tone,
      position: position(edit?.focus),
    }];
  }).map((m, i) => ({ ...m, order: i }));
}

/** Паузы «на руке», для которых фото уже есть. */
export function feedBreaks(content) {
  if (Array.isArray(content?.breaks)) {
    return content.breaks
      .filter(b => b.photo && !b.hidden)
      .map(b => ({
        id: b.id,
        after: b.after,
        title: b.title,
        src: b.photo,
        tone: b.tone ?? b.toneAuto ?? FALLBACK_TONE,
        position: position(b.focus, 30),
      }));
  }
  return BREAKS
    .map(b => ({ ...b, src: feedPhoto(b.photo), tone: toneOf(feedPhoto(b.photo)), position: '50% 30%' }))
    .filter(b => TONES[b.src]);
}

/** Шаблоны пауз по умолчанию — для админки, когда своих ещё нет. */
export const DEFAULT_BREAKS = BREAKS.map(b => {
  const src = feedPhoto(b.photo);
  return { id: b.id, after: b.after, title: b.title, photo: TONES[src] ? src : null, tone: null, toneAuto: TONES[src] ?? null, focus: { x: 50, y: 30 }, hidden: false };
});
