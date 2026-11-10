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

import { entryCode } from '../catalog/lib/leadCode.js';

// Витрина taena живёт в корне своего домена, без /catalog. Ссылки для рекламы
// ведут сюда.
export const BASE = 'https://taena.neodiamond.kz';

// Реклама идёт через Ads Manager. Метки там ставятся один раз, строкой
// «Параметры URL» на объявлении: площадка и размещение — постоянные, а
// кампанию, креатив и номер объявления Meta подставляет сама. Поэтому в
// админке нет рекламных ссылок с ручной кампанией — только эта строка и
// чистый адрес посадочной страницы.
//
// Кампании называются «РК <Тема>_<Таргет|Ретаргет>» — тип рекламы едет в
// названии. Номер объявления ({{ad.id}}) — то, по чему информационный центр
// свяжет визит и заявку с креативом из Meta: он не меняется при
// переименовании.
export const ADS_URL_PARAMS =
  'utm_source=instagram&utm_medium=performance&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{ad.id}}';

// Ссылки не из рекламы: шапка профиля, сторис, рассылка — у каждой своё
// размещение, чтобы в «Источниках» они не сливались.
export const UTM_PRESETS = [
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

// Какой вход даст ссылка в коде обращения ([T·ib-…]) — подсказка в «Ссылках».
for (const p of UTM_PRESETS) p.code = entryCode(p.params);

export function buildUtmUrl(params, path = '') {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => String(v ?? '').trim()));
  const q = new URLSearchParams(clean);
  return `${BASE}${path}${q.toString() ? `?${q}` : ''}`;
}

// Подписи для разбивки «Источники» — по тому же ключу, что и сервер:
// «источник / размещение». У всей рекламы ключ общий (instagram /
// performance) — кампании и креативы различаются уже в информационном центре.
export const UTM_LABELS = (() => {
  const out = { 'instagram / performance': 'Реклама Instagram' };
  for (const p of UTM_PRESETS) {
    const key = `${p.params.utm_source} / ${p.params.utm_medium}`;
    out[key] = key in out ? p.title.split(' — ')[0] : p.title;
  }
  return out;
})();
