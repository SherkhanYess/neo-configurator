// Ready-made tagged links for the places traffic actually comes from.
//
// The catalog already reads utm_* on load and attaches the source to every
// event, so a link built here shows up in «Источники» above without any further
// setup. The point of the block is that the tags are written once, correctly:
// a typo in utm_source silently creates a second source that never reconciles.
//
// Standard tagging: utm_source is the platform, utm_medium is the placement.
// «Источники» keys on source AND medium together, so instagram/bio and
// instagram/stories stay separate rows instead of collapsing into «instagram».

// Витрина taena живёт в корне своего домена, без /catalog. Ссылки для рекламы
// ведут сюда.
export const BASE = 'https://aena.neodiamond.kz';

// Реклама: площадка — instagram, размещение — performance. Тип рекламы — utm_content: target (новые люди) или retarget (кто
// уже был на сайте). Кампания подставляется перформанс-менеджером и приезжает
// в код источника внутри сообщения WhatsApp, поэтому её имя — короткое
// слово: obraz, vitrina, vybor.
export const AD = { utm_source: 'instagram', utm_medium: 'performance' };
export const AD_TYPES = [['target', 'Таргет'], ['retarget', 'Ретаргет']];

/** Метки рекламной ссылки: площадка, размещение, кампания и тип рекламы. */
export const adParams = (campaign, adType) => ({ ...AD, utm_campaign: campaign, utm_content: adType });

export const UTM_PRESETS = [
  {
    id: 'ad_obraz',
    title: 'Реклама Instagram — «Образ»',
    note: 'Основной трафик. Ведёт в ленту, можно добавить &style=halo.',
    ad: true,
    params: { ...AD, utm_campaign: 'obraz' },
  },
  {
    id: 'ad_vitrina',
    title: 'Реклама Instagram — «Витрина»',
    note: 'Тест. Ведёт сразу на страницу модели: /product/sirius/halo/oval.',
    ad: true,
    params: { ...AD, utm_campaign: 'vitrina' },
  },
  {
    id: 'ad_vybor',
    title: 'Реклама Instagram — «Выбор»',
    note: 'Кампания vybor.',
    ad: true,
    params: { ...AD, utm_campaign: 'vybor' },
  },
  {
    id: 'guide',
    title: 'Внешний гайд (PDF, статья не на сайте)',
    note: 'Кнопка «Посмотреть модели» в гайде, который живёт не на этом сайте. Для гидов сайта — блок «Гиды» выше.',
    params: { utm_source: 'guide', utm_medium: 'page' },
  },
  {
    id: 'instagram_bio',
    title: 'Instagram — шапка профиля',
    note: 'Ссылка в био. Основной источник трафика.',
    params: { utm_source: 'instagram', utm_medium: 'bio' },
  },
  {
    id: 'instagram_stories',
    title: 'Instagram — сторис',
    note: 'Свайп-ап или стикер-ссылка в сторис.',
    params: { utm_source: 'instagram', utm_medium: 'stories' },
  },
  {
    id: 'instagram_post',
    title: 'Instagram — пост или Reels',
    note: 'Ссылка из описания публикации.',
    params: { utm_source: 'instagram', utm_medium: 'post' },
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp — рассылка',
    note: 'Когда менеджер отправляет каталог в чате.',
    params: { utm_source: 'whatsapp', utm_medium: 'manager' },
  },
];

export function buildUtmUrl(params, path = '') {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => String(v ?? '').trim()));
  const q = new URLSearchParams(clean);
  return `${BASE}${path}${q.toString() ? `?${q}` : ''}`;
}

/** Метки готовой ссылки; у рекламной — ещё тип рекламы. */
export const presetParams = (p, adType) => (p.ad ? { ...p.params, utm_content: adType } : p.params);

// Подписи для разбивки «Источники» — по тому же ключу, что и сервер:
// «источник / размещение». У рекламных кампаний ключ общий
// (instagram / performance), поэтому для него — общее название без имени
// кампании.
export const UTM_LABELS = (() => {
  const out = {};
  for (const p of UTM_PRESETS) {
    const key = `${p.params.utm_source} / ${p.params.utm_medium}`;
    out[key] = key in out ? p.title.split(' — ')[0] : p.title;
  }
  return out;
})();
