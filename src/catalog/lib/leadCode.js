// Код обращения в конце сообщения WhatsApp — v2.
//
// Код читает не менеджер, а инфоцентр: Salesbot amoCRM кладёт первое
// сообщение клиента в поле сделки «Код обращения», вебхук вырезает код и по
// нему ставит источник спроса и конвертер. Поэтому код машиночитаемый и
// однозначный (ТЗ: neo-diamond-hub/docs/tz/2026-11-11-taena-lead-code-v2.md).
//
// Формат: [T·<вход>[:<объявление>]-<тип>·<страница>]
//   T            бренд taena (N — за Neo Diamond)
//   вход         две латинские буквы — откуда пришёл на сайт (entryCode)
//   объявление   5 знаков base36 из номера объявления Meta, если он есть
//   тип          ОБ, ПР, ПД, НМ, ИД
//   страница     f — лента, m — модель, g — гид, o — остальное
// Например [T·ia:51l97-ПР·m], [T·ib-ОБ·f].

export const BRAND = 'T';

/** Тип обращения → буквы в коде. */
export const LEAD_TYPES = {
  price:   'ОБ',  // узнать стоимость и срок
  fitting: 'ПР',  // примерить в шоуруме
  help:    'ПД',  // подбор: «не знаю, какое выбрать»
  hint:    'НМ',  // пришёл по ссылке-намёку
  custom:  'ИД',  // кольцо по своему дизайну
};

/** Страница, с которой нажали WhatsApp. */
export const PAGES = { feed: 'f', model: 'm', guide: 'g', other: 'o' };
const PAGE_LETTERS = new Set(Object.values(PAGES));

// Все входы. Двухбуквенный код из ссылки-намёка принимается, только если он
// отсюда — иначе в код попал бы любой мусор из адреса.
export const ENTRIES = {
  ia: 'реклама Meta',
  ta: 'реклама TikTok',
  ib: 'шапка профиля Instagram',
  is: 'сторис Instagram',
  ip: 'пост или Reels Instagram',
  tb: 'профиль TikTok',
  gs: 'карточка 2ГИС',
  wm: 'ссылка от менеджера в WhatsApp',
  sh: 'поделились ссылкой',
  ht: 'намёк',
  dd: 'прямой заход',
  xx: 'другое',
};

// Старые ссылки-намёки несли одну латинскую букву отправителя.
const LEGACY_HINT = { k: 'ia', p: 'ip', g: 'dd', s: 'dd' };
const PAID = new Set(['performance', 'cpc', 'paid']);
const META = new Set(['instagram', 'facebook', 'meta']);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

const val = (utm, k) => String(utm?.[k] ?? '').trim().toLowerCase();

/**
 * Вход — две буквы по меткам. Порядок проверок важен: первое совпадение
 * побеждает. Ссылка-намёк несёт вход отправителя, и он сильнее всего
 * остального — иначе реклама, с которой пришёл отправитель, не свяжется с
 * заявкой получателя.
 */
export function entryCode(utm = {}) {
  const source = val(utm, 'utm_source');
  const medium = val(utm, 'utm_medium');

  if (medium === 'hint') {
    if (source in ENTRIES) return source;
    return LEGACY_HINT[source] ?? 'ht';
  }
  if (PAID.has(medium) && META.has(source)) return 'ia';
  if (PAID.has(medium) && source === 'tiktok') return 'ta';
  if (source === 'instagram' && medium === 'bio') return 'ib';
  if (source === 'instagram' && medium === 'stories') return 'is';
  if (source === 'instagram' && (medium === 'post' || medium === 'reels')) return 'ip';
  if (source === 'tiktok') return 'tb';
  if (source === '2gis') return 'gs';
  if (source === 'whatsapp' && medium === 'manager') return 'wm';
  if (val(utm, 'utm_term') === 'share') return 'sh';
  if (!UTM_KEYS.some(k => val(utm, k))) return 'dd';
  return 'xx';
}

/** Вход для ссылки-намёка: те же две буквы, что в коде отправителя. */
export const sourceLatin = entryCode;

const AD_ID = /^\d{6,}$/;
const AD_SPACE = 60466176n; // 36^5

/**
 * Номер объявления, сжатый до 5 знаков base36. Берётся из utm_term
 * ({{ad.id}}), а если там не число — из utm_content. Полный номер инфоцентр
 * восстанавливает по списку объявлений из Meta.
 */
export function adShort(utm = {}) {
  const id = [utm?.utm_term, utm?.utm_content].map(v => String(v ?? '').trim()).find(v => AD_ID.test(v));
  return id ? (BigInt(id) % AD_SPACE).toString(36).padStart(5, '0') : null;
}

/**
 * Код целиком.
 * @param {keyof LEAD_TYPES} type
 * @param {object} utm   метки входа
 * @param {'f'|'m'|'g'|'o'} page
 */
export function leadCode(type, utm = {}, page = PAGES.other) {
  const t = LEAD_TYPES[type];
  if (!t) throw new Error(`неизвестный тип обращения: ${type}`);
  const ad = adShort(utm);
  const p = PAGE_LETTERS.has(page) ? page : PAGES.other;
  return `[${BRAND}·${entryCode(utm)}${ad ? `:${ad}` : ''}-${t}·${p}]`;
}
