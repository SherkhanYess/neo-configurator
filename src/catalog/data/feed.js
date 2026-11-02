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

// Фото кладутся в public/assets/feed/ под именем из `photo`. Пока файла нет,
// показываем студийный рендер модели с круглым камнем.
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
export const BREAKS = [
  { after: 3, photo: 'hand-1.webp', title: 'Как они выглядят на руке' },
  { after: 6, photo: 'hand-2.webp', title: 'Как они выглядят на руке' },
];

// Тон, в который уходит низ фото: считается из самого фото командой
// `npm run feed:tones` (правило — в DESIGN.md). Для рендеров и фото, которые
// ещё не посчитаны, — нейтральный тёмный.
const FALLBACK_TONE = '#3E3E3E';
export const toneOf = (src) => TONES[src] ?? FALLBACK_TONE;

export const feedPhoto = (file) => `/assets/feed/${file}`;

/**
 * Лента: модель, её текст, фото и из какой комбинации она собрана.
 *
 * Комбинация нужна, чтобы попасть на страницу модели и посчитать цену —
 * в коде кольцо описывается парой «шинка + оправа», а человеку показывается
 * одно название.
 *
 * `available` — какие файлы реально лежат в public/assets/feed/ (собирается
 * при сборке в feed-tones.json): фото, которого нет, не запрашиваем.
 */
export function feedModels() {
  const byName = new Map(
    VALID_COMBOS.map(c => [modelName(c.shank, c.cast), c])
  );

  return MODELS.flatMap(({ model, photo, text }, i) => {
    const combo = byName.get(model);
    if (!combo) return [];          // модель убрали из каталога — карточки тоже нет
    const own = feedPhoto(photo);
    const src = TONES[own] ? own : ringImage(combo.shank, combo.cast, 'round');
    return [{
      model,
      text,
      order: i,
      shank: combo.shank,
      cast: combo.cast,
      src,
      tone: toneOf(src),
    }];
  });
}

/** Паузы, для которых фото уже есть. */
export function feedBreaks() {
  return BREAKS
    .map(b => ({ ...b, src: feedPhoto(b.photo), tone: toneOf(feedPhoto(b.photo)) }))
    .filter(b => TONES[b.src]);
}
