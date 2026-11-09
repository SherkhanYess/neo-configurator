import { SHAPES, VALID_COMBOS, PUSETЫ_SHAPES_BY_CAST, PUSETЫ_CASTS, modelName } from './config.js';

// Какие модели есть на сайте — документ /api/get-products, который правится в
// админке («Модели и цены»): там модели добавляют, удаляют, переименовывают и
// прячут. Здесь — общие правила для сайта, админки и сборки (без React).
//
// Модель — это шинка из 3D-сцены iJewel (её точное имя) и оправа: classic
// (лапки), halo (ореол — выбор на странице модели) или bezel (ободок). Одна
// пара «шинка + оправа» — одна строка в rings.
//
// Документ версии 2 — полный список: чего в нём нет, того нет на сайте.
// Версия 1 (до 10.11.2026) хранила только имена и видимость поверх списка из
// кода — её читаем по-старому, а сохранение из админки переводит во вторую.

export const keyOf = (shank, cast) => `${shank}|${cast}`;
export const shankSlug = (shank) => String(shank).toLowerCase().replace(/\s+/g, '-');

/** Имя шинки в iJewel: латиница, цифры и пробелы — оно же ключ цен и ленты. */
export const SHANK_RE = /^[A-Za-z][A-Za-z0-9 ]{1,29}$/;
export const CASTS_ALL = ['classic', 'halo', 'bezel'];

// Ореол у моделей — выбор на странице, своей карточки в ленте у него нет.
// Исключение — Halo Luxe (решение владельца, 09.11.2026).
const FEED_HALO = new Set(['Sirius Luxe|halo']);
const feedByDefault = (shank, cast) => cast !== 'halo' || FEED_HALO.has(keyOf(shank, cast));

export function defaultProducts() {
  return {
    version: 2,
    shapes: SHAPES.map(s => ({ id: s.id, label: s.label, enabled: true })),
    rings: VALID_COMBOS.map(({ shank, cast }) => ({
      shank, cast,
      name: modelName(shank, cast),
      enabled: true,
      feed: feedByDefault(shank, cast),
    })),
    pusety: PUSETЫ_CASTS.flatMap(c =>
      (PUSETЫ_SHAPES_BY_CAST[c.id] ?? []).map(shape => ({ cast: c.id, shape, enabled: true }))
    ),
  };
}

const validRing = (r) => SHANK_RE.test(r?.shank ?? '') && CASTS_ALL.includes(r?.cast);

/** Сохранённый документ + то, чего в нём не хватает. */
export function mergeProducts(saved) {
  const base = defaultProducts();
  if (!saved || typeof saved !== 'object') return base;

  const shapeById = new Map((saved.shapes ?? []).map(s => [s.id, s]));
  const pusetByKey = new Map((saved.pusety ?? []).map(p => [`${p.cast}|${p.shape}`, p]));

  let rings;
  if (saved.version >= 2 && Array.isArray(saved.rings)) {
    const seen = new Set();
    rings = saved.rings
      .filter(r => validRing(r) && !seen.has(keyOf(r.shank, r.cast)) && seen.add(keyOf(r.shank, r.cast)))
      .map(r => ({
        shank: r.shank,
        cast: r.cast,
        name: (r.name ?? '').trim() || modelName(r.shank, r.cast),
        enabled: r.enabled !== false,
        feed: typeof r.feed === 'boolean' ? r.feed : feedByDefault(r.shank, r.cast),
      }));
  } else {
    // Версия 1: список — из кода, из документа — только имена и видимость.
    const ringByKey = new Map((saved.rings ?? []).map(r => [keyOf(r.shank, r.cast), r]));
    rings = base.rings.map(r => {
      const o = ringByKey.get(keyOf(r.shank, r.cast));
      return o ? { ...r, name: o.name || r.name, enabled: o.enabled !== false } : r;
    });
  }

  return {
    version: 2,
    shapes: base.shapes.map(s => {
      const o = shapeById.get(s.id);
      return o ? { ...s, label: o.label || s.label, enabled: o.enabled !== false } : s;
    }),
    rings,
    pusety: base.pusety.map(p => {
      const o = pusetByKey.get(`${p.cast}|${p.shape}`);
      return o ? { ...p, enabled: o.enabled !== false } : p;
    }),
  };
}

// ─── Чтение ────────────────────────────────────────────────────────────────

export const ringOf = (products, shank, cast) =>
  products?.rings?.find(r => r.shank === shank && r.cast === cast) ?? null;

/** Шинки по порядку — по одной на модель, со всеми её оправами. */
export function modelShanks(products) {
  return [...new Set((products?.rings ?? []).map(r => r.shank))];
}

/** Шинка по куску адреса (/product/sirius-luxe/…). */
export function shankFromSlug(products, slug) {
  return modelShanks(products).find(s => shankSlug(s) === slug) ?? null;
}

// ─── Правка в админке ──────────────────────────────────────────────────────

/**
 * Новая модель. mount: 'prongs' — на лапках (тогда halo — есть ли вариант с
 * ореолом), 'bezel' — в ободке.
 */
export function addModel(products, { shank, name, mount = 'prongs', halo = false, haloName = '' }) {
  const s = String(shank ?? '').trim().replace(/\s+/g, ' ');
  if (!SHANK_RE.test(s)) throw new Error('Имя шинки — латиницей, как в iJewel: например «Aurora» или «Neo 2»');
  if (modelShanks(products).some(x => x.toLowerCase() === s.toLowerCase())) throw new Error(`Модель с шинкой «${s}» уже есть`);
  const title = String(name ?? '').trim() || s;
  const rings = mount === 'bezel'
    ? [{ shank: s, cast: 'bezel', name: title, enabled: true, feed: true }]
    : [
      { shank: s, cast: 'classic', name: title, enabled: true, feed: true },
      ...(halo ? [{ shank: s, cast: 'halo', name: String(haloName ?? '').trim() || `${title} Halo`, enabled: true, feed: false }] : []),
    ];
  return { ...products, version: 2, rings: [...products.rings, ...rings] };
}

/** Модель целиком — со всеми оправами. */
export function removeModel(products, shank) {
  return { ...products, version: 2, rings: products.rings.filter(r => r.shank !== shank) };
}

/** Цены только тех моделей, что остались. */
export function prunePrices(prices, products) {
  const keep = new Set(modelShanks(products));
  const baseByShank = Object.fromEntries(Object.entries(prices?.baseByShank ?? {}).filter(([k]) => keep.has(k)));
  return { ...prices, baseByShank };
}

/** Лента только тех моделей, что остались. */
export function pruneFeed(feed, products) {
  if (!feed) return feed;
  const keep = new Set((products?.rings ?? []).map(r => keyOf(r.shank, r.cast)));
  return { ...feed, models: (feed.models ?? []).filter(m => keep.has(m.key)) };
}
