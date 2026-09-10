import { SHANKS, SHAPES } from '../data/config.js';

// Puts the chosen configuration into the booking URL, and reads it back.
//
// The booking screen used to live only in sessionStorage, so opening
// /catalog/booking directly bounced you to the catalog. That made sharing
// pointless: the recipient would land on an empty catalog. Now the address
// carries the configuration, so a shared link opens exactly what the sender saw.
//
// Price is deliberately NOT in the URL. It is recomputed from the current
// server prices, so a link shared today cannot quote yesterday's figure.

export function shankToSlug(id) {
  return String(id ?? '').toLowerCase().replace(/\s+/g, '-');
}

export function slugToShank(slug) {
  return SHANKS.find(s => shankToSlug(s.id) === slug)?.id ?? null;
}

// Gem and metal are stored as Russian labels everywhere else, but a URL reads
// better in latin. These are the only two places the mapping is needed.
const GEM_SLUG = {
  'Белый': 'white', 'Зелёный': 'green', 'Жёлтый': 'yellow', 'Розовый': 'pink',
  'Синий': 'blue', 'Рубин': 'ruby', 'Красный': 'red', 'Фиолетовый': 'purple',
  'Чёрный': 'black', 'Оранжевый': 'orange',
};
const METAL_SLUG = {
  'Белое золото': 'white', 'Жёлтое золото': 'yellow', 'Розовое золото': 'rose',
  'Белое': 'white', 'Жёлтое': 'yellow', 'Розовое': 'rose',
};

const invert = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));

// Decoding picks the canonical long form, so «Белое» and «Белое золото» both
// come back as the label the rest of the app uses.
const SLUG_GEM   = invert(GEM_SLUG);
const SLUG_METAL = { white: 'Белое золото', yellow: 'Жёлтое золото', rose: 'Розовое золото' };

const PURITIES = ['585', '750'];
const CASTS    = ['classic', 'halo', 'bezel'];

export function encodeBooking(cfg = {}) {
  const p = new URLSearchParams();

  if (cfg.type === 'pusety') p.set('type', 'pusety');
  else if (cfg.shank)        p.set('line', shankToSlug(cfg.shank));

  if (cfg.cast)   p.set('style', cfg.cast);
  if (cfg.shape)  p.set('shape', cfg.shape);
  if (cfg.carat)  p.set('ct', String(cfg.carat));
  if (cfg.purity) p.set('gold', cfg.purity);

  const gem = GEM_SLUG[cfg.gem1Label];
  if (gem) p.set('color', gem);

  const metal = METAL_SLUG[cfg.metalLabel];
  if (metal) p.set('goldColor', metal);

  return p.toString();
}

// Returns null when the address carries nothing usable, so the caller can fall
// back to sessionStorage instead of rendering an empty page.
export function decodeBooking(search) {
  const p = new URLSearchParams(search ?? '');

  const shape = p.get('shape');
  if (!shape || !SHAPES.some(s => s.id === shape)) return null;

  const isPusety = p.get('type') === 'pusety';
  const shank = isPusety ? null : slugToShank(p.get('line') ?? '');
  if (!isPusety && !shank) return null;

  const cast = CASTS.includes(p.get('style')) ? p.get('style') : 'classic';

  const rawCt = Number(p.get('ct'));
  const carat = Number.isFinite(rawCt) && rawCt > 0 && rawCt <= 10 ? rawCt : null;

  const purity = PURITIES.includes(p.get('gold')) ? p.get('gold') : '585';

  return {
    type:  isPusety ? 'pusety' : 'ring',
    shank: isPusety ? `Пусеты ${cast === 'halo' ? 'Halo' : 'Classic'}` : shank,
    cast,
    shape,
    carat,
    purity,
    gem1Label:  SLUG_GEM[p.get('color')] ?? null,
    metalLabel: SLUG_METAL[p.get('goldColor')] ?? null,
  };
}

export function bookingPath(cfg) {
  const q = encodeBooking(cfg);
  return q ? `/catalog/booking?${q}` : '/catalog/booking';
}
