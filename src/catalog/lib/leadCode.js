// Код источника лида в тексте сообщения WhatsApp.
//
// Заявки с сайта уходят в WhatsApp, и до сих пор в amoCRM нельзя было
// отличить заявку из рекламы от заявки из профиля: метки UTM оставались в
// sessionStorage и в текст не попадали. Менеджер переносит код из сообщения в
// поле «Источник лида» руками, поэтому код должен быть коротким и читаться
// глазами с одного взгляда.
//
// Формат: [<источник>-<тип>·<кампания>], например [К-ПР·vitrina].
// Без кампании — [П-ОБ].

/** Тип обращения → буквы в коде. */
export const LEAD_TYPES = {
  price:   'ОБ',  // узнать стоимость и срок
  fitting: 'ПР',  // примерить в шоуруме
  help:    'ПД',  // подбор: «не знаю, какое выбрать»
  hint:    'НМ',  // пришёл по ссылке-намёку
};

// Источник по меткам входа. Буквы кириллические — их читает менеджер, а не
// программа. Латинские приходят в ссылке-намёке (`utm_source=K|P|G|S`), где
// код отправителя едет в адресе, и приводятся к кириллице здесь же.
const LATIN_TO_SOURCE = { K: 'К', P: 'П', G: 'Г', S: 'С' };
const PROFILE_MEDIUMS = new Set(['bio', 'stories', 'post']);

/**
 * Буква источника по сохранённым меткам.
 *
 * Порядок проверок важен: ссылка-намёк несёт источник того, кто её отправил, и
 * этот источник сильнее собственных меток получателя — иначе её реклама не
 * свяжется с его заявкой.
 */
export function sourceCode(utm = {}) {
  const source = String(utm.utm_source ?? '').toLowerCase();
  const medium = String(utm.utm_medium ?? '').toLowerCase();

  if (medium === 'hint') {
    const inherited = LATIN_TO_SOURCE[String(utm.utm_source ?? '').toUpperCase()];
    return inherited ?? 'С';
  }
  if (medium === 'paid')   return 'К';
  if (source === 'guide')  return 'Г';
  if (source === 'instagram' && PROFILE_MEDIUMS.has(medium)) return 'П';
  if (!source && !medium)  return 'С';
  return 'С';
}

/** Латинская буква источника — она уезжает в ссылке-намёке. */
export function sourceLatin(utm = {}) {
  const cyr = sourceCode(utm);
  return Object.keys(LATIN_TO_SOURCE).find(k => LATIN_TO_SOURCE[k] === cyr) ?? 'S';
}

/**
 * Код целиком.
 *
 * Кампания берётся из utm_campaign как есть — её ставит перформанс-менеджер в
 * ссылках объявлений, и переименовывать её здесь значило бы расходиться с тем,
 * что он видит в рекламном кабинете.
 */
export function leadCode(type, utm = {}) {
  const t = LEAD_TYPES[type];
  if (!t) throw new Error(`неизвестный тип обращения: ${type}`);
  const src = sourceCode(utm);
  const campaign = String(utm.utm_campaign ?? '').trim();
  return campaign ? `[${src}-${t}·${campaign}]` : `[${src}-${t}]`;
}
