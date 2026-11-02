import { leadCode } from './leadCode.js';

// Тексты сообщений, с которыми человек приходит в WhatsApp.
//
// Короткий живой текст от первого лица: менеджер читает его как начало
// разговора, а не как заявку из формы. В конце — код источника, который
// менеджер переносит в amoCRM.
//
// Гравировку в текст не добавляем: она в подарок к каждой заявке, и менеджер
// упоминает её сам — в сообщении от клиента это выглядело бы как требование.

const SHORT_METAL = (label) => String(label ?? '').replace(/\s*золото\s*/i, '').trim();

// «в шоуруме в Астане», а не «в Астана». Алматы не склоняется, но писать
// исключение в коде честнее, чем оставлять ошибку в сообщении, которое клиент
// отправляет от своего имени.
const CITY_IN = { 'Алматы': 'Алматы', 'Астана': 'Астане' };
const cityIn = (city) => CITY_IN[city] ?? city ?? 'Алматы';

/** Описание украшения одной строкой: «Sirius Овал, 1 ct, Белое золото 585». */
function piece({ model, shape, carat, metalLabel, purity }) {
  return [
    [model, shape].filter(Boolean).join(' '),
    carat ? `${String(carat).replace('.', ',')} ct` : null,
    metalLabel ? `${SHORT_METAL(metalLabel)} золото ${purity ?? '585'}` : null,
  ].filter(Boolean).join(', ');
}

/**
 * Собирает текст по типу обращения.
 *
 * @param {'price'|'fitting'|'help'|'hint'} type
 * @param {object} ctx  модель, форма, карат, металл, проба, город
 * @param {object} utm  метки входа, из которых берётся код
 */
export function waMessage(type, ctx = {}, utm = {}) {
  const code = leadCode(type, utm);

  switch (type) {
    case 'price':
      return `Здравствуйте! Понравилось кольцо ${piece(ctx)}. Подскажите стоимость и срок? ${code}`;
    case 'fitting':
      return `Здравствуйте! Хотим примерить ${[ctx.model, ctx.shape].filter(Boolean).join(' ')} в шоуруме в ${cityIn(ctx.city)}. Когда можно приехать? ${code}`;
    case 'help':
      return `Здравствуйте! Хочу сделать предложение и не знаю, какое кольцо выбрать. Поможете? ${code}`;
    case 'hint':
      return `Здравствуйте! Мне показали кольцо ${[ctx.model, ctx.shape].filter(Boolean).join(' ')}. Подскажите стоимость и как узнать размер? ${code}`;
    default:
      throw new Error(`неизвестный тип обращения: ${type}`);
  }
}
