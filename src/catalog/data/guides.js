import { DEFAULT_GUIDES } from './guidesDefault.js';

// Гиды для мужчин — статьи для стадий 3–5 CJM мужчины: «где взять кольцо»,
// «из чего оно состоит», «как всё организовать».
//
// Каждый гид — отдельная страница со своим адресом: на неё ведёт реклама, у
// неё свой заголовок вкладки и своя картинка в превью ссылки. В ленте гиды
// стоят карточками после моделей, перед «Не знаете, какое выбрать?».
//
// Тексты правятся в админке (раздел «Гиды») и приходят документом
// /api/content/guides. Пока его нет — показываем DEFAULT_GUIDES из кода.
// Этот модуль без React: его читает и scripts/prerender.mjs.

export const GUIDES = DEFAULT_GUIDES;

export const guidePath = (slug) => `/guides/${slug}`;

/** Гиды из документа админки, а без него — из кода. Скрытые не показываем. */
export function guideList(doc, { withHidden = false } = {}) {
  const list = Array.isArray(doc?.items) && doc.items.length ? doc.items : DEFAULT_GUIDES;
  return withHidden ? list : list.filter(g => !g.hidden);
}

export const guideBySlug = (list, slug) => list.find(g => g.slug === slug) ?? null;

/** Заголовки разделов — оглавление для поисковика. */
export const outlineOf = (guide) => (guide.blocks ?? []).filter(b => b.type === 'h2').map(b => b.text);

/** «4 минуты», «5 минут» — для карточек и шапки статьи. */
export function minutesLabel(n) {
  const d = n % 10, h = n % 100;
  const word = d === 1 && h !== 11 ? 'минута' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'минуты' : 'минут';
  return `${n} ${word}`;
}
