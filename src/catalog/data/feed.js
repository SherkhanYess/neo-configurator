import { VALID_COMBOS, modelName, ringImage } from './config.js';
import TONES from './feed-tones.json';

// Содержание ленты: девять моделей, по карточке на каждую.
//
// Лента — не каталог, а обложки линеек: на фото одна шинка с разными
// огранками. Огранка в ленте не упоминается, её выбирают на странице модели.
//
// Текст — до ~75 знаков, ровно две строки на телефоне. Говорит, как устроено
// кольцо, и ничего не обещает: «не выходит из моды» — слова продавца, а не
// свойство изделия.
//
// Всё это правится в админке (раздел «Лента») и приходит с сервера
// документом /api/content/feed. Здесь — то, что показывается, пока его нет:
// порядок, тексты и фото из public/assets/feed/, а без фото — студийный
// рендер с круглым камнем.

const MODELS = [
  { model: 'Sirius',        photo: 'sirius.webp',        text: 'Один бриллиант на четырёх лапках. Свет проходит сквозь камень со всех сторон.' },
  { model: 'Neo',           photo: 'neo.webp',           text: 'Один бриллиант на четырёх лапках. Свет проходит сквозь камень со всех сторон.' },
  { model: 'Halo',          photo: 'halo.webp',          text: 'Камень в ореоле из мелких бриллиантов. На руке читается крупнее своего веса.' },
  { model: 'Neo Halo',      photo: 'neo-halo.webp',      text: 'Камень в ореоле из мелких бриллиантов. На руке читается крупнее своего веса.' },
  { model: 'Sirius Luxe',   photo: 'sirius-luxe.webp',   text: 'Бриллианты продолжаются по шинке. Кольцо собирает свет и сверху, и сбоку.' },
  { model: 'Neo Luxe',      photo: 'neo-luxe.webp',      text: 'Бриллианты продолжаются по шинке. Кольцо собирает свет и сверху, и сбоку.' },
  { model: 'Halo Luxe',     photo: 'halo-luxe.webp',     text: 'Ореол вокруг камня и дорожка по шинке. Свет идёт со всех сторон.' },
  { model: 'Neo Halo Luxe', photo: 'neo-halo-luxe.webp', text: 'Ореол вокруг камня и дорожка по шинке. Свет идёт со всех сторон.' },
  { model: 'Bezel',         photo: 'bezel.webp',         text: 'Камень в сплошном золотом ободке. Ничего не выступает и не цепляется.' },
];

// Кадр «на руке» — пауза в ленте после указанной по счёту модели. Без фото не
// показывается: пустая пауза хуже никакой.
const BREAKS = [
  { id: 'hand-1', after: 3, photo: 'hand-1.webp', title: 'Как они выглядят на руке' },
  { id: 'hand-2', after: 6, photo: 'hand-2.webp', title: 'Как они выглядят на руке' },
];

export const DEFAULT_TITLE = 'То, что между вами, — в одном кольце';

/** Тире не начинает строку: пробел перед ним — неразрывный. */
export const typo = (text) => String(text ?? '').replace(/ +([—–])/g, '\u00A0$1');

const WORDS = ['', 'Одно', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять', 'Десять', 'Одиннадцать', 'Двенадцать'];
const plural = (n, one, few, many) => {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
};

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

const keyOf = (shank, cast) => `${shank}|${cast}`;
const comboByName = new Map(VALID_COMBOS.map(c => [modelName(c.shank, c.cast), c]));

/** Модели в порядке по умолчанию, с ключом «шинка|оправа». */
export const DEFAULT_MODELS = MODELS.flatMap(m => {
  const c = comboByName.get(m.model);
  if (!c) return [];
  const own = feedPhoto(m.photo);
  return [{ key: keyOf(c.shank, c.cast), model: m.model, shank: c.shank, cast: c.cast, text: m.text, staticPhoto: TONES[own] ? own : null }];
});

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
  const ring = (c) => products?.rings?.find(r => r.shank === c.shank && r.cast === c.cast);
  const edits = new Map((content?.models ?? []).map(m => [m.key, m]));

  // Порядок из админки; модель, появившаяся в коде позже, встаёт в конец.
  const order = [
    ...(content?.models ?? []).map(m => m.key),
    ...DEFAULT_MODELS.map(m => m.key),
  ].filter((k, i, all) => all.indexOf(k) === i);

  const byKey = new Map(DEFAULT_MODELS.map(m => [m.key, m]));

  return order.flatMap((key, i) => {
    const base = byKey.get(key);
    if (!base) return [];             // модель убрали из каталога — карточки тоже нет
    const admin = ring(base);
    if (admin && admin.enabled === false) return [];
    const edit = edits.get(key);

    let src, tone;
    if (edit?.photo) {
      src = edit.photo;
      tone = edit.tone ?? edit.toneAuto ?? FALLBACK_TONE;
    } else {
      src = base.staticPhoto ?? renderPhoto(base.shank, base.cast);
      tone = toneOf(src);
    }

    return [{
      key,
      model: admin?.name || base.model,
      text: edit?.text || base.text,
      order: i,
      shank: base.shank,
      cast: base.cast,
      src,
      tone,
      position: position(edit?.focus),
    }];
  });
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
