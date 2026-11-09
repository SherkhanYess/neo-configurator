// Из чего собирается гид: блоки и их поля.
//
// Одна схема на троих: сайт рисует блоки по типу, админка строит по ней форму
// редактирования, сервер по ней же чистит то, что прислала админка. Поэтому
// новый блок — это строка здесь и компонент в src/guides/blocks.jsx.
//
// Поля:  text — строка, area — абзац, bool, num, select, image — фото из
// админки или из assets, link — адрес внутри сайта, strings — список строк,
// list — список вложенных записей со своими полями.

const T = (label, max = 160, hint) => ({ kind: 'text', label, max, hint });
const A = (label, max = 1500, hint) => ({ kind: 'area', label, max, hint });
const B = (label, hint) => ({ kind: 'bool', label, hint });
const N = (label, min, max, hint) => ({ kind: 'num', label, min, max, hint });
const S = (label, options, hint) => ({ kind: 'select', label, options, hint });
const I = (label, hint) => ({ kind: 'image', label, hint });
const L = (label, hint) => ({ kind: 'link', label, hint });
const SL = (label, max = 400, count = 24, hint) => ({ kind: 'strings', label, max, count, hint });
const LIST = (label, fields, count = 12, hint) => ({ kind: 'list', label, fields, count, hint });

export const MARKS = [['check', 'Галочка'], ['x', 'Крестик'], ['plus', 'Плюс'], ['minus', 'Минус'], ['dot', 'Точка']];
export const ICONS = [['hand', 'Рука'], ['book', 'Закладка'], ['user', 'Человек'], ['size', 'Размер'], ['clock', 'Часы'],
  ['pin', 'Метка'], ['pen', 'Перо'], ['spark', 'Блеск'], ['phone', 'Телефон'], ['heart', 'Сердце'], ['gift', 'Подарок'], ['shield', 'Щит']];
export const SHAPE_IDS = [['round', 'Круг'], ['oval', 'Овал'], ['pear', 'Груша'], ['marquise', 'Маркиз'], ['heart', 'Сердце'],
  ['princess', 'Принцесса'], ['cushion', 'Кушон'], ['radiant', 'Радиант'], ['emerald', 'Изумруд'], ['asscher', 'Ашер']];
export const COVERS = [['secret', 'Доска «Свадьба» и подруга'], ['anatomy', 'Кольцо в разрезе'], ['tomorrow', 'Экран блокировки'], ['photo', 'Своё фото']];
const ACTIONS = [['catalog', 'Каталог'], ['page', 'Страница сайта'], ['help', 'WhatsApp — помочь с выбором'], ['price', 'WhatsApp — общий вопрос']];
const WA_TYPES = [['help', 'Помочь с выбором (ПД)'], ['price', 'Общий вопрос (ОБ)']];
const MEMES = [['none', 'Без картинки'], ['order', 'Заказ с маркетплейса'], ['tag', 'Ценник «Только для вас»'], ['same', 'Одно кольцо у троих'], ['receipt', 'Чек мастера']];

const item = (fields) => fields;

/**
 * group — в какой части меню «Добавить блок» он стоит.
 * Иллюстрации («особые блоки») рисуются по-своему, но все их тексты правятся.
 */
export const BLOCKS = {
  h2:      { label: 'Заголовок раздела', group: 'Текст', fields: { text: T('Текст', 140) } },
  h3:      { label: 'Подзаголовок', group: 'Текст', fields: { text: T('Текст', 140) } },
  p:       { label: 'Абзац', group: 'Текст', fields: { text: A('Текст'), muted: B('Приглушённый, мельче') } },
  quote:   { label: 'Цитата курсивом', group: 'Текст', fields: { text: A('Текст', 320) } },
  list:    { label: 'Список', group: 'Текст', fields: { kind: S('Значок', MARKS), items: SL('Пункты') } },
  note:    { label: 'Плашка', group: 'Текст', fields: { title: T('Заголовок', 140), text: A('Текст', 900) } },
  card:    { label: 'Карточка', group: 'Текст', fields: {
    title: T('Заголовок', 140), subtitle: T('Подзаголовок', 140), kind: S('Значок списка', MARKS), items: SL('Пункты'),
    quote: A('Цитата курсивом', 320), note: A('Мелкая приписка', 400), pick: B('Выделить рамкой'),
  } },
  cta:     { label: 'Кнопка', group: 'Текст', fields: { action: S('Куда ведёт', ACTIONS), text: T('Надпись', 60), to: L('Адрес страницы', 'Только для «Страница сайта», например /product/sirius/classic/round') } },
  image:   { label: 'Фото', group: 'Фото', fields: { src: I('Фото'), alt: T('Что на фото (для незрячих)', 160), caption: T('Подпись', 200) } },
  collage: { label: 'Коллаж из пяти фото', group: 'Фото', fields: { images: { kind: 'images', label: 'Фото', count: 5 } } },
  compare: { label: 'Сравнение рядом', group: 'Текст', fields: { items: LIST('Колонки', item({
    title: T('Заголовок', 80), badge: T('Пометка справа', 30), text: A('Текст', 400), kind: S('Значок списка', MARKS), list: SL('Пункты', 120, 8), pick: B('Выделить рамкой'),
  }), 3) } },

  places:    { label: 'Где взять кольцо — рейтинг', group: 'Иллюстрации', fields: { items: LIST('Места', item({
    rank: T('Место', 30), title: T('Название', 80), meme: S('Картинка-шутка', MEMES), pros: SL('Плюсы', 300, 8), cons: SL('Минусы', 300, 8), best: B('Лучший вариант (рамка и шутка про минусы)'),
  }), 8) } },
  clues:     { label: 'Подсказки с иконками', group: 'Иллюстрации', fields: { items: LIST('Подсказки', item({ icon: S('Иконка', ICONS), title: T('Заголовок', 80), text: A('Текст', 500) }), 8) } },
  matches:   { label: 'Какое кольцо какой девушке', group: 'Иллюстрации', fields: { items: LIST('Карточки', item({
    img: I('Фото кольца'), to: L('Куда ведёт'), if: T('Если она…', 120), name: T('Название', 40), what: T('Пояснение', 120),
  }), 6) } },
  sizer:     { label: 'Размер — это диаметр', group: 'Иллюстрации', fields: { value: T('Подпись в круге', 12), title: T('Заголовок', 80), text: A('Текст', 300) } },
  perk:      { label: 'Строка с иконкой', group: 'Иллюстрации', fields: { icon: S('Иконка', ICONS), title: T('Заголовок', 100), text: T('Пояснение', 160) } },
  engraving: { label: 'Гравировка внутри кольца', group: 'Иллюстрации', fields: { label: T('Надпись сверху', 40), text: T('Гравировка', 40), caption: T('Подпись снизу', 120) } },
  terms:     { label: 'Термины', group: 'Иллюстрации', fields: { items: LIST('Термины', item({ term: T('Слово', 30), def: T('Объяснение', 200) }), 8) } },
  shapes:    { label: 'Сетка из десяти огранок', group: 'Иллюстрации', fields: {} },
  facts:     { label: 'Факты об огранках', group: 'Иллюстрации', fields: { title: T('Заголовок', 80), items: LIST('Факты', item({
    shapes: { kind: 'multiselect', label: 'Огранки', options: SHAPE_IDS }, title: T('Заголовок', 100), text: A('Текст', 300),
  }), 10) } },
  equal:     { label: 'Цена не зависит от…', group: 'Иллюстрации', fields: { kind: S('Что показать', [['shapes', 'Три огранки'], ['metals', 'Три цвета золота']]), title: T('Заголовок', 100), text: T('Текст', 160) } },
  carats:    { label: 'Каратность в масштабе', group: 'Иллюстрации', fields: { items: LIST('Камни', item({
    px: N('Размер камня, px', 30, 100), ct: T('Каратность', 10), mm: T('Диаметр', 20), caption: T('Подпись', 80), glasses: B('Солнечные очки'),
  }), 4) } },
  swatches:  { label: 'Цвета золота', group: 'Иллюстрации', fields: { items: LIST('Цвета', item({ color: T('Цвет (#RRGGBB)', 7), name: T('Название', 30), text: T('Пояснение', 80) }), 4) } },
  kinds:     { label: 'Два вида рядом', group: 'Иллюстрации', fields: { items: LIST('Виды', item({ title: T('Название', 40), text: A('Текст', 200) }), 2), note: A('Под ними', 400) } },
  sameMoney: { label: 'Цены: лабораторный и природный', group: 'Иллюстрации', fields: {
    title: T('Заголовок', 80), labLabel: T('Строка 1', 40), labSub: T('Под строкой 1', 60), natLabel: T('Строка 2', 40), natSub: T('Под строкой 2', 60),
    natural: N('Природный Sirius 1 ct, ₸', 100000, 100000000, 'Лабораторные цены считаются из прайса сами'), title2: T('Второй заголовок', 80),
    natCaption: A('Подпись слева', 120), labCaption: A('Подпись справа', 120, '{model} — сюда встанет модель с камнем 5 ct, которую можно купить на эти деньги'),
  } },
  ladder:    { label: 'Лесенка: сколько вернётся', group: 'Иллюстрации', fields: { title: T('Заголовок', 80), rows: LIST('Ступени', item({
    title: T('Заголовок', 80), text: T('Текст', 200), keep: N('Длина полосы, %', 0, 100), verdict: T('Итог справа', 30), good: B('Тёмная полоса'),
  }), 5), note: A('Приписка', 300) } },
  case:      { label: 'История из практики', group: 'Иллюстрации', fields: {
    eyebrow: T('Надзаголовок', 60), title: T('Заголовок', 100), image: I('Фото (сертификат)'), imageAlt: T('Что на фото', 160),
    specs: LIST('Характеристики', item({ k: T('Что', 24), v: T('Значение', 24) }), 8), caption: T('Подпись под фото', 120),
    text: A('Рассказ', 900), bought: T('«Купил за»', 30), offer: T('«Лучшее предложение»', 30), after: A('Чем кончилось', 500), quote: A('Мораль курсивом', 320),
  } },
  stat:      { label: 'Большая цифра', group: 'Иллюстрации', fields: { value: T('Цифра', 12), text: T('Что значит', 160), source: T('Источник', 120), more: A('Ниже под чертой', 400) } },
  route:     { label: 'Маршрут: её «да» и дальше', group: 'Иллюстрации', fields: { title: T('Первая точка', 40), text: T('Под ней', 120), side: T('Переход', 80), steps: SL('Дальше по порядку', 40, 10) } },
  steps:     { label: 'Нумерованные шаги', group: 'Иллюстрации', fields: { items: LIST('Шаги', item({ title: T('Шаг', 60), text: T('Пояснение', 160) }), 10) } },
  timeline:  { label: 'Две недели до даты', group: 'Иллюстрации', fields: { title: T('Заголовок', 60), segments: LIST('Отрезки', item({ title: T('Название', 30), text: T('Под ним', 60) }), 3), from: T('Слева внизу', 20), to: T('Справа внизу', 20), note: A('Приписка', 300) } },
  cast:      { label: 'Участники', group: 'Иллюстрации', fields: { items: LIST('Участники', item({ letter: T('В кружке', 4), name: T('Кто', 30), role: T('Роль', 60) }), 4) } },
  chat:      { label: 'Чат', group: 'Иллюстрации', fields: { title: T('Название чата', 60), members: T('Участники', 80), messages: LIST('Сообщения', item({
    who: T('Кто пишет', 30), text: A('Сообщение', 300), me: B('Это вы (справа, тёмное)'), accent: B('Имя бронзой'),
  }), 12) } },
  friends:   { label: 'Правило одной подруги', group: 'Иллюстрации', fields: { items: LIST('Две схемы', item({ title: T('Подпись', 40), text: T('Под ней', 60) }), 2) } },
  checklist: { label: 'Чек-лист с галочками', group: 'Иллюстрации', fields: { items: SL('Пункты', 300, 16) } },
  final:     { label: 'Финальный тёмный блок', group: 'Иллюстрации', fields: {
    title: T('Заголовок', 100), text: A('Текст', 500), items: SL('Список с галочками', 200, 8),
    perks: LIST('Строки с иконками', item({ icon: S('Иконка', ICONS), title: T('Заголовок', 60), text: T('Пояснение', 100) }), 8),
    showrooms: B('Показать адреса шоурумов'), quote: A('Цитата курсивом', 320),
    primary: T('Кнопка в каталог', 50), wa: T('Кнопка WhatsApp', 50), waType: S('Тип обращения WhatsApp', WA_TYPES),
  } },
};

/** Поля самого гида. */
export const GUIDE_FIELDS = {
  title: T('Заголовок', 140),
  teaser: A('Что узнает — для карточки в ленте', 240),
  minutes: N('Минут чтения', 1, 30),
  lead: A('Вступление', 700),
  cover: S('Обложка', COVERS),
  coverPhoto: I('Фото обложки', 'Только для обложки «Своё фото»'),
  description: A('Описание для поиска и превью ссылки', 300),
};

// ─── Чистка на сервере ──────────────────────────────────────────────────────

const IMAGE_RE = /^\/(api\/media\/[a-z0-9-]+\.(webp|jpg|png|avif)|assets\/[\w./-]+\.(webp|jpg|jpeg|png|svg))$/;
// Только адреса этого сайта: «/product/…», «/guides/…», «/». Чужой сайт и
// «//домен» не пройдут.
const LINK_RE = /^\/(?!\/)[\w./?=&%-]*$/;

function cleanValue(f, v) {
  switch (f.kind) {
    case 'text': case 'area': return typeof v === 'string' ? v.replace(/\r/g, '').trim().slice(0, f.max) : '';
    case 'bool': return v === true;
    case 'num': return Number.isFinite(v) ? Math.min(f.max, Math.max(f.min, v)) : undefined;
    case 'select': return f.options.some(([o]) => o === v) ? v : f.options[0][0];
    case 'multiselect': return (Array.isArray(v) ? v : []).filter(x => f.options.some(([o]) => o === x)).slice(0, 4);
    case 'image': return typeof v === 'string' && IMAGE_RE.test(v) ? v : '';
    case 'link': return typeof v === 'string' && LINK_RE.test(v) ? v : '';
    case 'images': return (Array.isArray(v) ? v : []).map(x => (typeof x === 'string' && IMAGE_RE.test(x) ? x : '')).slice(0, f.count);
    case 'strings': return (Array.isArray(v) ? v : []).filter(x => typeof x === 'string').map(x => x.trim().slice(0, f.max)).filter(Boolean).slice(0, f.count);
    case 'list': return (Array.isArray(v) ? v : []).slice(0, f.count).map(x => cleanFields(f.fields, x));
    default: return undefined;
  }
}

export function cleanFields(fields, obj) {
  const out = {};
  for (const [k, f] of Object.entries(fields)) {
    const v = cleanValue(f, obj?.[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function cleanGuides(body) {
  const seen = new Set();
  const items = (Array.isArray(body?.items) ? body.items : [])
    .slice(0, 20)
    .map(g => {
      const slug = String(g?.slug ?? '').toLowerCase().slice(0, 60);
      if (!SLUG_RE.test(slug) || seen.has(slug)) return null;
      seen.add(slug);
      const blocks = (Array.isArray(g?.blocks) ? g.blocks : [])
        .slice(0, 150)
        .filter(b => BLOCKS[b?.type])
        .map(b => ({ id: String(b.id ?? '').replace(/[^\w-]/g, '').slice(0, 24) || Math.random().toString(36).slice(2, 10), type: b.type, ...cleanFields(BLOCKS[b.type].fields, b) }));
      return { slug, hidden: g?.hidden === true, ...cleanFields(GUIDE_FIELDS, g), blocks };
    })
    .filter(g => g && g.title);
  return { version: 1, items };
}

/** Пустая запись для нового блока: пустые строки, первые варианты выбора. */
export function emptyBlock(type) {
  const fill = (fields) => Object.fromEntries(Object.entries(fields).map(([k, f]) => [k,
    f.kind === 'bool' ? false
      : f.kind === 'num' ? f.min
        : f.kind === 'select' ? f.options[0][0]
          : ['strings', 'list', 'images', 'multiselect'].includes(f.kind) ? []
            : '']));
  return { id: Math.random().toString(36).slice(2, 10), type, ...fill(BLOCKS[type].fields) };
}
