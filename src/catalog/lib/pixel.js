// События для Meta Pixel — чтобы реклама училась на заявках, а не на заходах.
//
// Пиксель подключён в index.html и сам шлёт PageView. Здесь — шаги, ради
// которых крутится реклама:
//   открыл модель        → ViewContent
//   ушёл в WhatsApp      → Contact
//   отправила намёк      → Lead
//
// Шлём только с боевых адресов. Песочница и локальная разработка иначе
// подмешали бы тестовые клики в обучение рекламы.

const LIVE_HOSTS = new Set(['neodiamond.kz', 'www.neodiamond.kz', 'con.neodiamond.kz']);

const MAP = {
  product_open: (p) => ['ViewContent', {
    content_type: 'product',
    content_ids: [`${p.model}|${p.cast}`],
    content_name: p.model,
    content_category: 'Помолвочные кольца',
  }],
  wa_click: (p) => ['Contact', {
    content_name: p.model,
    content_category: p.type,
    ...(p.price ? { value: p.price, currency: 'KZT' } : {}),
  }],
  hint_submit: (p) => ['Lead', {
    content_name: p.model,
    content_category: 'hint',
    ...(p.price ? { value: p.price, currency: 'KZT' } : {}),
  }],
};

export function mirrorToPixel(event, props = {}) {
  const build = MAP[event];
  if (!build || typeof window === 'undefined') return;
  const [name, params] = build(props);
  if (!LIVE_HOSTS.has(window.location.hostname)) {
    if (import.meta.env?.DEV || window.location.hostname.endsWith('netlify.app') || window.location.hostname.startsWith('lenta.')) {
      console.debug('[pixel, не отправлено — не боевой адрес]', name, params);
    }
    return;
  }
  try { window.fbq?.('track', name, params); } catch { /* реклама не должна ломать страницу */ }
}
