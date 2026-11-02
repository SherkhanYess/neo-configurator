import { leadCode, sourceCode, sourceLatin } from '../src/catalog/lib/leadCode.js';
import { waMessage } from '../src/catalog/lib/waMessage.js';

let ok = 0, fail = 0;
const is = (name, got, want) => {
  if (got === want) { console.log('  ok ', name); ok++; }
  else { console.log('  FAIL', name, '\n    получено:', got, '\n    ожидали :', want); fail++; }
};

console.log('\nкод источника:');
is('реклама Meta',        sourceCode({ utm_medium: 'paid', utm_source: 'meta' }), 'К');
is('профиль, шапка',      sourceCode({ utm_source: 'instagram', utm_medium: 'bio' }), 'П');
is('профиль, сторис',     sourceCode({ utm_source: 'instagram', utm_medium: 'stories' }), 'П');
is('страница-гайд',       sourceCode({ utm_source: 'guide' }), 'Г');
is('без меток',           sourceCode({}), 'С');
is('instagram без medium',sourceCode({ utm_source: 'instagram' }), 'С');

console.log('\nнамёк наследует источник отправителя:');
is('от рекламы',   sourceCode({ utm_medium: 'hint', utm_source: 'K' }), 'К');
is('от профиля',   sourceCode({ utm_medium: 'hint', utm_source: 'P' }), 'П');
is('от гайда',     sourceCode({ utm_medium: 'hint', utm_source: 'G' }), 'Г');
is('без источника',sourceCode({ utm_medium: 'hint' }), 'С');

console.log('\nобратное преобразование для ссылки-намёка:');
is('реклама → K', sourceLatin({ utm_medium: 'paid' }), 'K');
is('профиль → P', sourceLatin({ utm_source: 'instagram', utm_medium: 'post' }), 'P');

console.log('\nкод целиком:');
is('с кампанией',  leadCode('fitting', { utm_medium: 'paid', utm_campaign: 'vitrina' }), '[К-ПР·vitrina]');
is('без кампании', leadCode('price',   { utm_source: 'instagram', utm_medium: 'bio' }), '[П-ОБ]');
is('подбор',       leadCode('help',    {}), '[С-ПД]');

console.log('\nтексты сообщений:');
is('стоимость',
  waMessage('price', { model: 'Sirius', shape: 'Овал', carat: 1, metalLabel: 'Белое золото', purity: '585' },
            { utm_medium: 'paid', utm_campaign: 'obraz' }),
  'Здравствуйте! Понравилось кольцо Sirius Овал, 1 ct, Белое золото 585. Подскажите стоимость и срок? [К-ОБ·obraz]');
is('примерка',
  waMessage('fitting', { model: 'Neo Halo', shape: 'Круглый', city: 'Астана' }, {}),
  'Здравствуйте! Хотим примерить Neo Halo Круглый в шоуруме в Астане. Когда можно приехать? [С-ПР]');
is('по намёку',
  waMessage('hint', { model: 'Halo', shape: 'Груша' }, { utm_medium: 'hint', utm_source: 'K' }),
  'Здравствуйте! Мне показали кольцо Halo Груша. Подскажите стоимость и как узнать размер? [К-НМ]');

console.log(`\nитого: ${ok} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
