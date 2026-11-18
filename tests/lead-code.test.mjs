// Код обращения v2 — ТЗ neo-diamond-hub/docs/tz/2026-11-11-taena-lead-code-v2.md.
// Каждая строка таблицы входов, номер объявления, примеры, хранение меток.
import { leadCode, entryCode, sourceLatin, adShort, PAGES } from '../src/catalog/lib/leadCode.js';
import { waMessage } from '../src/catalog/lib/waMessage.js';
import { captureUtm, SESSION_KEY, LAST_KEY, KEEP_MS } from '../src/catalog/lib/utmStore.js';

let ok = 0, fail = 0;
const is = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { console.log('  ok ', name); ok++; }
  else { console.log('  FAIL', name, '\n    получено:', g, '\n    ожидали :', w); fail++; }
};
const u = (source, medium, extra = {}) => ({
  ...(source ? { utm_source: source } : {}), ...(medium ? { utm_medium: medium } : {}), ...extra,
});

console.log('\nвход — таблица сверху вниз:');
is('намёк, вход отправителя', entryCode(u('ia', 'hint')), 'ia');
is('намёк, вход сторис',      entryCode(u('is', 'hint')), 'is');
is('намёк без источника',     entryCode(u(null, 'hint')), 'ht');
is('намёк, мусор в источнике',entryCode(u('zz', 'hint')), 'ht');
is('намёк старый K → ia',     entryCode(u('K', 'hint')), 'ia');
is('намёк старый P → ip',     entryCode(u('P', 'hint')), 'ip');
is('намёк старый G → dd',     entryCode(u('G', 'hint')), 'dd');
is('намёк старый S → dd',     entryCode(u('S', 'hint')), 'dd');
is('реклама instagram/performance', entryCode(u('instagram', 'performance')), 'ia');
is('реклама facebook/cpc',    entryCode(u('facebook', 'cpc')), 'ia');
is('реклама meta/paid',       entryCode(u('meta', 'paid')), 'ia');
is('реклама TikTok',          entryCode(u('tiktok', 'performance')), 'ta');
is('шапка профиля',           entryCode(u('instagram', 'bio')), 'ib');
is('сторис',                  entryCode(u('instagram', 'stories')), 'is');
is('пост',                    entryCode(u('instagram', 'post')), 'ip');
is('reels',                   entryCode(u('instagram', 'reels')), 'ip');
is('профиль TikTok',          entryCode(u('tiktok', 'bio')), 'tb');
is('2ГИС',                    entryCode(u('2gis')), 'gs');
is('менеджер в WhatsApp',     entryCode(u('whatsapp', 'manager')), 'wm');
is('поделились',              entryCode({ utm_term: 'share' }), 'sh');
is('меток нет',               entryCode({}), 'dd');
is('пустые метки = меток нет',entryCode(u('  ', ' ')), 'dd');
is('внешний гайд → другое',   entryCode(u('guide', 'page')), 'xx');
is('instagram без medium',    entryCode(u('instagram')), 'xx');
is('регистр не важен',        entryCode(u('Instagram', 'Stories')), 'is');

console.log('\nссылка-намёк несёт две буквы отправителя:');
is('из рекламы',   sourceLatin(u('instagram', 'performance', { utm_term: '120246670349460187' })), 'ia');
is('из сторис',    sourceLatin(u('instagram', 'stories')), 'is');
is('прямой заход', sourceLatin({}), 'dd');

console.log('\nномер объявления — 5 знаков:');
is('из utm_term',              adShort({ utm_term: '120246670349460187' }), '51l97');
is('utm_term не число → utm_content', adShort({ utm_term: 'share', utm_content: '120246670349460187' }), '51l97');
is('короче 6 цифр — не номер', adShort({ utm_term: '12345' }), null);
is('название креатива — не номер', adShort({ utm_content: 'Образ_видео' }), null);
is('дополняется нулями',       adShort({ utm_term: '60466176' }), '00000');

console.log('\nпримеры из ТЗ:');
is('bio, лента, стоимость', leadCode('price', u('instagram', 'bio'), PAGES.feed), '[T·ib-ОБ·f]');
is('сторис, гид',           leadCode('price', u('instagram', 'stories'), PAGES.guide), '[T·is-ОБ·g]');
is('реклама, модель, примерка',
  leadCode('fitting', u('instagram', 'performance', { utm_campaign: 'РК Образ_Таргет', utm_content: 'Образ_видео', utm_term: '120246670349460187' }), PAGES.model),
  '[T·ia:51l97-ПР·m]');
is('прямой, конец ленты, подбор', leadCode('help', {}, PAGES.feed), '[T·dd-ПД·f]');
is('намёк от рекламного',   leadCode('hint', u('ia', 'hint'), PAGES.model), '[T·ia-НМ·m]');
is('страница по умолчанию — o', leadCode('price', {}), '[T·dd-ОБ·o]');
is('неизвестная страница — o',  leadCode('price', {}, 'zz'), '[T·dd-ОБ·o]');
is('длина в пределах 19', leadCode('fitting', { utm_medium: 'performance', utm_source: 'instagram', utm_term: '120246670349460187' }, 'm').length <= 19, true);

console.log('\nтексты сообщений не изменились, меняется только код:');
is('стоимость',
  waMessage('price', { model: 'Sirius', shape: 'Овал', carat: 1, metalLabel: 'Белое золото', purity: '585' },
            u('instagram', 'performance', { utm_term: '120246670349460187' }), PAGES.model),
  'Здравствуйте! Понравилось кольцо Sirius Овал, 1 ct, Белое золото 585. Подскажите по наличию и деталям?\n\nИндивидуальный код: [T·ia:51l97-ОБ·m]');
is('цветной камень',
  waMessage('price', { model: 'Neo', shape: 'Груша', carat: 1.5, gemLabel: 'Розовый', metalLabel: 'Белое золото', purity: '585' }, {}, PAGES.model),
  'Здравствуйте! Понравилось кольцо Neo Груша, 1,5 ct, розовый бриллиант, Белое золото 585. Подскажите по наличию и деталям?\n\nИндивидуальный код: [T·dd-ОБ·m]');
is('свой дизайн',
  waMessage('custom', {}, {}, PAGES.feed),
  'Здравствуйте! Хочу кольцо по своему дизайну. Можно обсудить идею?\n\nИндивидуальный код: [T·dd-ИД·f]');
is('примерка',
  waMessage('fitting', { model: 'Neo Halo', shape: 'Круглый', city: 'Астана' }, {}, PAGES.model),
  'Здравствуйте! Хотим примерить Neo Halo Круглый в шоуруме в Астане. Когда можно приехать?\n\nИндивидуальный код: [T·dd-ПР·m]');
is('примерка из ленты, без модели',
  waMessage('fitting', { city: 'Алматы' }, u('instagram', 'stories'), PAGES.feed),
  'Здравствуйте! Хотим примерить кольца в шоуруме в Алматы. Когда можно приехать?\n\nИндивидуальный код: [T·is-ПР·f]');
is('подвал',
  waMessage('price', { city: 'Алматы' }, {}, PAGES.other),
  'Здравствуйте! Хочу узнать про помолвочные кольца. Шоурум Алматы.\n\nИндивидуальный код: [T·dd-ОБ·o]');
is('по намёку',
  waMessage('hint', { model: 'Halo', shape: 'Груша' }, u('ia', 'hint'), PAGES.model),
  'Здравствуйте! Мне показали кольцо Halo Груша. Подскажите стоимость и как узнать размер?\n\nИндивидуальный код: [T·ia-НМ·m]');

console.log('\nметки живут 30 дней:');
const store = () => {
  const m = new Map();
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), map: m };
};
const AD = '?utm_source=instagram&utm_medium=performance&utm_term=120246670349460187';
const T0 = Date.UTC(2026, 10, 11);
{
  const s = store(), l = store();
  captureUtm({ search: AD, session: s, local: l, now: T0 });
  is('метки визита записаны', JSON.parse(s.getItem(SESSION_KEY)).utm_medium, 'performance');
  is('метки на 30 дней записаны', JSON.parse(l.getItem(LAST_KEY)).at, T0);

  // Вкладку закрыли: sessionStorage пуст. Вернулся через 3 дня без меток.
  const s2 = store();
  const back = captureUtm({ search: '', session: s2, local: l, now: T0 + 3 * 86400000 });
  is('через 3 дня — вход прежний', entryCode(back), 'ia');
  is('и код с объявлением', leadCode('price', back, PAGES.feed), '[T·ia:51l97-ОБ·f]');
  is('метки визита восстановлены', JSON.parse(s2.getItem(SESSION_KEY)).utm_term, '120246670349460187');
  is('заход без меток не стёр сохранённое', JSON.parse(l.getItem(LAST_KEY)).utm.utm_source, 'instagram');

  const late = captureUtm({ search: '', session: store(), local: l, now: T0 + KEEP_MS + 1 });
  is('через 31 день — прямой заход', entryCode(late), 'dd');

  const s3 = store();
  captureUtm({ search: '?utm_source=instagram&utm_medium=stories', session: s3, local: l, now: T0 + 86400000 });
  is('новые метки перезаписывают', JSON.parse(l.getItem(LAST_KEY)).utm, { utm_source: 'instagram', utm_medium: 'stories' });
  is('и метки визита тоже', entryCode(JSON.parse(s3.getItem(SESSION_KEY))), 'is');

  const s4 = store();
  s4.setItem(SESSION_KEY, JSON.stringify({ utm_source: 'whatsapp', utm_medium: 'manager' }));
  is('метки этого визита сильнее сохранённых', entryCode(captureUtm({ search: '', session: s4, local: l, now: T0 })), 'wm');

  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  is('хранилище недоступно — не падает', entryCode(captureUtm({ search: AD, session: broken, local: broken, now: T0 })), 'ia');
}

console.log(`\nитого: ${ok} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
