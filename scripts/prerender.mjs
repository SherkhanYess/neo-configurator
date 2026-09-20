// Writes real HTML for the catalog's pages after the Vite build.
//
// The catalog is a single-page app: without JavaScript the server returns an
// empty shell, so every crawler — Google's, and the ones behind AI assistants —
// sees a blank page with a title. Ninety products and their prices effectively
// do not exist on the open web.
//
// This emits a static file per route with the facts already in the HTML: the
// name, the price, the specification, and JSON-LD. React clears #root when it
// mounts, so a visitor with JavaScript still gets the app and never sees this
// copy; a crawler without it gets something to read.
//
// Prices are fetched from the live API at build time so the static copy matches
// what the admin last set, falling back to the defaults compiled into the app.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Адреса, телефоны и условия берутся из того же файла, что и видимый футер, —
// чтобы текст на странице и разметка для машин не разошлись.
import { ORG, SHOWROOMS, HOURS_NOTE, INSTAGRAM_HANDLE, showroomLine, organizationJsonLd } from '../src/catalog/data/org.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Canonical origin. Change this in one place when the catalog moves onto the
// main domain — it drives canonical links, Open Graph and the sitemap.
const SITE = (process.env.SITE_URL || 'https://con.neodiamond.kz').replace(/\/$/, '');

// ─── data (mirrors src/catalog/data/config.js) ───────────────────────────────
const SHAPES = [
  ['round','Круглый'], ['princess','Принцесса'], ['radiant','Радиант'], ['cushion','Кушон'],
  ['oval','Овал'], ['pear','Груша'], ['heart','Сердце'], ['marquise','Маркиз'],
  ['emerald','Изумруд'], ['asscher','Ашер'],
];
const COMBOS = [
  ['Neo','classic','Neo'], ['Neo','halo','Neo Halo'],
  ['Neo Luxe','classic','Neo Luxe'], ['Neo Luxe','halo','Neo Halo Luxe'],
  ['Sirius','classic','Sirius'], ['Sirius','halo','Halo'],
  ['Sirius Luxe','classic','Sirius Luxe'], ['Sirius Luxe','halo','Halo Luxe'],
  ['Bezel','bezel','Bezel'],
];
const MODEL_SLUG = {
  'Neo':'neo','Neo Halo':'neo-halo','Neo Luxe':'neo-luxe','Neo Halo Luxe':'neo-halo-luxe',
  'Sirius':'sirius','Sirius Luxe':'sirius-luxe','Halo':'halo','Halo Luxe':'halo-luxe','Bezel':'bezel',
};
const PRICE_FALLBACK = {
  baseByShank: { 'Neo':800000,'Neo Luxe':900000,'Sirius':550000,'Sirius Luxe':650000,'Bezel':550000 },
  casts: { halo:150000, bezel:100000 },
};

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
const money = (n) => `${n.toLocaleString('ru-KZ')} ₸`;

async function loadPrices() {
  try {
    const res = await fetch(`${SITE}/api/get-prices`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(String(res.status));
    const p = await res.json();
    if (!p?.baseByShank) throw new Error('пустой ответ');
    console.log('  цены: получены с', SITE);
    return { ...PRICE_FALLBACK, ...p };
  } catch (e) {
    console.log('  цены: взяты из кода —', e.message);
    return PRICE_FALLBACK;
  }
}

const basePrice = (prices, shank, cast) =>
  (prices.baseByShank?.[shank] ?? 0) + (cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0);

// Каратность, из которой собран прайс. Базовая цена уже включает 1 карат,
// доплата идёт только сверх него — те же правила, что в src/catalog/data/priceCalc.js.
const CARAT_OPTIONS = [1, 1.5, 2, 3, 4, 5];

const configuredPrice = (prices, shank, cast, carat) =>
  basePrice(prices, shank, cast) + (prices.caratPrice ?? 0) * Math.max(0, carat - 1);

const caratLabel = (c) => `${String(c).replace('.', ',')} ct`;

const GEM_COLORS = [
  ['white', 'Белый'], ['green', 'Зелёный'], ['yellow', 'Жёлтый'], ['pink', 'Розовый'],
  ['blue', 'Синий'], ['ruby', 'Рубин'], ['red', 'Красный'], ['purple', 'Фиолетовый'],
  ['black', 'Чёрный'], ['orange', 'Оранжевый'],
];
const METAL_COLORS = [['white', 'Белое золото'], ['yellow', 'Жёлтое золото'], ['rose', 'Розовое золото']];

/**
 * Ссылка, открывающая украшение с уже выбранными параметрами.
 *
 * Тот же разбор параметров, что делает src/catalog/lib/bookingUrl.js, — это
 * адрес, который ассистент может собрать сам и отдать человеку.
 */
function configuredUrl({ shank, cast, shape, carat, purity = '585', color = 'white', goldColor = 'white' }) {
  const p = new URLSearchParams({
    line: slug(shank), style: cast, shape,
    ct: String(carat), gold: purity, color, goldColor,
  });
  return `${SITE}/catalog/booking?${p}`;
}

// ─── page assembly ───────────────────────────────────────────────────────────
function page(shell, { path, title, description, bodyHtml, jsonLd }) {
  const url = `${SITE}${path}`;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Neo Diamond" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:locale" content="ru_KZ" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ');

  return shell
    .replace(/<title>.*?<\/title>/s, head)
    // React clears #root on mount, so this copy is for crawlers only.
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
}

const organization = organizationJsonLd(SITE);

// Тот же футер, что видит человек, — только разметкой без стилей. Адреса и
// телефоны попадают на каждую страницу обычным текстом: ассистенты читают его
// охотнее, чем разметку, а совпадение одного с другим повышает доверие к обоим.
const FOOTER_HTML = `
      <hr />
      <h2>Контакты</h2>
      <p>${esc(ORG.name)} — ${esc(ORG.tagline)}.</p>
      <ul>
        ${SHOWROOMS.map(s => [
          `<li>${esc(showroomLine(s))}`,
          `— <a href="tel:${esc(s.phone.replace(/[^+\d]/g, ''))}">${esc(s.phone)}</a>`,
          `(<a href="${esc(s.twogis)}">2ГИС</a>)</li>`,
        ].join(' ')).join('\n        ')}
      </ul>
      <p>${esc(HOURS_NOTE)}.</p>
      <p><a href="${esc(ORG.instagram)}">Instagram ${esc(INSTAGRAM_HANDLE)}</a></p>`;

function productJsonLd({ name, price, shapeLabel, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: `${SITE}${path}`,
    category: 'Помолвочные кольца',
    brand: { '@type': 'Brand', name: 'Neo Diamond' },
    material: 'Золото 585/750, лабораторный бриллиант',
    description: `${name} — кольцо с лабораторным бриллиантом огранки «${shapeLabel}», чистота VVS2/VS1, цвет D/E, огранка IDEAL, сертификат IGI. Золото 585 или 750 пробы. Изготовление 5–10 календарных дней.`,
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: 'KZT',
      availability: 'https://schema.org/InStock',
      url: `${SITE}${path}`,
      priceValidUntil: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
      seller: { '@type': 'Organization', name: 'Neo Diamond' },
    },
  };
}

/** Список товаров разметкой: машина получает каталог целиком, а не по одной карточке. */
function itemListJsonLd(prices) {
  const items = [];
  for (const [shank, cast, model] of COMBOS) {
    for (const [shapeId, shapeLabel] of SHAPES) {
      const path = `/catalog/product/${slug(shank)}/${cast}/${shapeId}`;
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        item: {
          '@type': 'Product',
          name: `${model} ${shapeLabel}`,
          url: `${SITE}${path}`,
          offers: {
            '@type': 'Offer',
            price: String(basePrice(prices, shank, cast)),
            priceCurrency: 'KZT',
            availability: 'https://schema.org/InStock',
          },
        },
      });
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Каталог помолвочных колец Neo Diamond',
    numberOfItems: items.length,
    itemListElement: items,
  };
}

/**
 * Машиночитаемый каталог.
 *
 * Страница с таблицей отвечает на вопрос «сколько стоит вот это». Файл ниже
 * отвечает на вопрос «сколько будет стоить любая конфигурация»: он отдаёт
 * правила расчёта, а не только готовые числа, и описывает, как собрать ссылку
 * на конкретное украшение. Ассистенту этого достаточно, чтобы назвать цену и
 * сразу дать человеку адрес, по которому она открывается.
 */
function catalogFeed(prices) {
  return {
    организация: {
      название: ORG.name,
      сайт: SITE,
      описание: ORG.description,
      шоурумы: SHOWROOMS.map(s => ({
        город: s.city, адрес: s.streetAddress, ориентир: s.place,
        телефон: s.phone, whatsapp: `https://wa.me/${s.wa}`, карта_2gis: s.twogis,
      })),
      часы: HOURS_NOTE,
      instagram: ORG.instagram,
    },
    валюта: 'KZT',
    обновлено: new Date().toISOString().slice(0, 10),

    правила_расчёта: {
      описание:
        'Базовая цена модели уже включает бриллиант 1 карат и золото 585 пробы. ' +
        'Огранка на цену не влияет. Итог = база модели + доплата за караты сверх одного + надбавки.',
      доплата_за_карат: prices.caratPrice ?? 0,
      формула: 'итог = база + доплата_за_карат * max(0, караты - 1) + надбавки',
      надбавки: {
        золото_750: prices.purity750surcharge ?? 0,
        цветной_центральный_бриллиант_за_карат: prices.fancyColorSurcharge ?? 0,
        цветная_россыпь: prices.scatterFancySurcharge ?? 0,
      },
    },

    опции: {
      караты: CARAT_OPTIONS,
      проба: ['585', '750'],
      цвет_золота: METAL_COLORS.map(([id, label]) => ({ id, название: label })),
      цвет_камня: GEM_COLORS.map(([id, label]) => ({ id, название: label })),
      огранки: SHAPES.map(([id, label]) => ({ id, название: label })),
    },

    модели: COMBOS.map(([shank, cast, model]) => ({
      название: model,
      линия: slug(shank),
      оправа: cast,
      база: basePrice(prices, shank, cast),
      цены_по_каратам: Object.fromEntries(
        CARAT_OPTIONS.map(ct => [String(ct), configuredPrice(prices, shank, cast, ct)])
      ),
      страницы: SHAPES.map(([shapeId, shapeLabel]) => ({
        огранка: shapeLabel,
        адрес: `${SITE}/catalog/product/${slug(shank)}/${cast}/${shapeId}`,
      })),
      пример_ссылки_с_параметрами: configuredUrl({ shank, cast, shape: 'round', carat: 1 }),
    })),

    как_собрать_ссылку: {
      шаблон: `${SITE}/catalog/booking?line=<линия>&style=<оправа>&shape=<огранка>&ct=<караты>&gold=<585|750>&color=<цвет_камня>&goldColor=<цвет_золота>`,
      пояснение:
        'Адрес открывает страницу украшения с этими параметрами: 3D-просмотр, ' +
        'актуальная цена и кнопка перехода в WhatsApp. Цена в ссылку не ' +
        'записывается — она считается заново по текущему прайсу, поэтому ' +
        'ссылка не может показать устаревшую сумму.',
    },

    условия: {
      изготовление: '5–10 календарных дней',
      сертификат: 'IGI на каждый камень от 0,5 карата',
      доставка: 'По Казахстану бесплатно, 2–5 дней; отправка за рубеж по запросу',
      оплата: 'По договору: 50% при заключении, 50% при получении',
      обслуживание: 'Ультразвуковая чистка и родирование — бесплатно, пожизненно',
      примерка: 'Образцы в наличии в обоих шоурумах, показы по записи',
    },
  };
}

/** llms.txt — договорённость, по которой ассистенты читают краткую справку о сайте. */
function llmsTxt(prices) {
  const cheapest = Math.min(...COMBOS.map(([s, c]) => basePrice(prices, s, c)));
  return `# Neo Diamond

> ${ORG.tagline}. Помолвочные кольца и украшения с лабораторными бриллиантами,
> собственное производство, шоурумы в Алматы и Астане.

## Коротко

- Кольца с бриллиантом — от ${money(cheapest)}. Базовая цена включает камень 1 карат и золото 585 пробы.
- Доплата за каждый карат сверх первого — ${money(prices.caratPrice ?? 0)}.
- Огранка на цену не влияет, доступно ${SHAPES.length} огранок.
- Каждый камень от 0,5 карата — с сертификатом IGI и серийным номером внутри камня.
- Изготовление 5–10 календарных дней. Доставка по Казахстану бесплатно, 2–5 дней.

## Шоурумы

${SHOWROOMS.map(s => `- ${s.city}, ${s.streetAddress} (${s.place}) — ${s.phone}, WhatsApp https://wa.me/${s.wa}, 2ГИС ${s.twogis}`).join('\n')}

${HOURS_NOTE}.

## Данные

- [Каталог и правила расчёта в JSON](${SITE}/catalog/catalog.json) — модели, цены по каратам, надбавки, адреса страниц.
- [Каталог с ценами](${SITE}/catalog/list) — та же матрица цен обычным текстом.
- [Карта сайта](${SITE}/sitemap.xml)

## Ссылка на украшение с выбранными параметрами

${SITE}/catalog/booking?line=<линия>&style=<оправа>&shape=<огранка>&ct=<караты>&gold=<585|750>&color=<цвет камня>&goldColor=<цвет золота>

Линии: ${[...new Set(COMBOS.map(([s]) => slug(s)))].join(', ')}.
Оправы: classic, halo, bezel (bezel только для линии bezel).
Огранки: ${SHAPES.map(s => s[0]).join(', ')}.
Караты: ${CARAT_OPTIONS.join(', ')}.
Цвет золота: ${METAL_COLORS.map(m => m[0]).join(', ')}.
Цвет камня: ${GEM_COLORS.map(g => g[0]).join(', ')}.

Пример: ${configuredUrl({ shank: 'Sirius', cast: 'classic', shape: 'oval', carat: 1.5 })}

Такая ссылка открывает украшение в 3D с этими параметрами, показывает текущую
цену и ведёт в WhatsApp. Цена в адресе не хранится и считается заново, поэтому
ссылка не может показать устаревшую сумму.
`;
}

const SPECS_HTML = `
      <h2>Характеристики</h2>
      <ul>
        <li>Чистота: VVS2/VS1 — без изъянов, видимых глазу</li>
        <li>Цвет: D/E — абсолютно белый</li>
        <li>Огранка: IDEAL</li>
        <li>Сертификат: IGI, с серийным номером на рундисте</li>
        <li>Золото: 585 или 750 пробы, белое, жёлтое или розовое</li>
        <li>Срок изготовления: 5–10 календарных дней</li>
        <li>Ультразвуковая чистка и родирование — бесплатно, пожизненно</li>
      </ul>
      <h2>Примерка</h2>
      <p>Шоурумы в Алматы (ЖК Esentai City) и Астане (ЖК Atlant). Образцы в наличии —
      формы и каратности можно посмотреть на своей руке. Доставка по Казахстану бесплатно, 2–5 дней.</p>`;

async function main() {
  const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
  const prices = await loadPrices();
  const pages = [];

  // Каждое сочетание модели и огранки — своя страница с ценой.
  for (const [shapeId, shapeLabel] of SHAPES) {
    for (const [shank, cast, model] of COMBOS) {
      const price = basePrice(prices, shank, cast);
      const name = `${model} ${shapeLabel}`;
      const path = `/catalog/product/${slug(shank)}/${cast}/${shapeId}`;
      pages.push({
        path,
        title: `${name} — помолвочное кольцо с бриллиантом ${money(price)} | Neo Diamond`,
        description: `${name}: кольцо с лабораторным бриллиантом огранки «${shapeLabel}», от ${money(price)}. Чистота VVS2/VS1, цвет D/E, сертификат IGI. Примерка в Алматы и Астане.`,
        jsonLd: productJsonLd({ name, price, shapeLabel, path }),
        bodyHtml: `
      <h1>${esc(name)}</h1>
      <p><strong>Цена: от ${esc(money(price))}</strong> — за кольцо с бриллиантом 1 карат, золото 585 пробы.</p>
      <p>Помолвочное кольцо ${esc(model)} с лабораторным бриллиантом огранки «${esc(shapeLabel)}».</p>
      ${SPECS_HTML}`,
      });
    }
  }

  // Витрина. Раньше здесь стояли девять цен «от» — по ним нельзя было назвать
  // стоимость конкретного украшения, и ассистент честно отвечал, что цен на
  // сайте нет. Теперь страница содержит всю матрицу: каждая модель на каждой
  // каратности, надбавки и ссылка, по которой конфигурацию можно открыть.
  const priceRows = COMBOS.map(([shank, cast, model]) => {
    const cells = CARAT_OPTIONS
      .map(ct => `<td>${esc(money(configuredPrice(prices, shank, cast, ct)))}</td>`).join('');
    return `<tr><td><a href="/catalog/product/${slug(shank)}/${cast}/round">${esc(model)}</a></td>${cells}</tr>`;
  }).join('\n        ');

  pages.push({
    path: '/catalog/list',
    title: 'Каталог помолвочных колец с ценами | Neo Diamond, Алматы и Астана',
    description: `Каталог колец с лабораторными бриллиантами: ${COMBOS.length} моделей, ${SHAPES.length} огранок, цены от ${money(Math.min(...COMBOS.map(([s, c]) => basePrice(prices, s, c))))}. Сертификат IGI, примерка в Алматы и Астане.`,
    jsonLd: [organization, itemListJsonLd(prices)],
    bodyHtml: `
      <h1>Каталог помолвочных колец с ценами</h1>
      <p>Neo Diamond — ювелирная студия в Алматы и Астане. Кольца с лабораторными
      бриллиантами: сертификат IGI, чистота VVS2/VS1, цвет D/E, огранка IDEAL.</p>

      <h2>Цены по моделям и каратности</h2>
      <p>Золото 585 пробы, белый бриллиант. Огранка на цену не влияет — цена
      одинакова для всех ${SHAPES.length} огранок.</p>
      <table>
        <thead><tr><th>Модель</th>${CARAT_OPTIONS.map(c => `<th>${esc(caratLabel(c))}</th>`).join('')}</tr></thead>
        <tbody>
        ${priceRows}
        </tbody>
      </table>

      <h2>Надбавки</h2>
      <ul>
        <li>Золото 750 пробы: +${esc(money(prices.purity750surcharge ?? 0))}</li>
        <li>Цветной центральный бриллиант: +${esc(money(prices.fancyColorSurcharge ?? 0))} за карат</li>
        <li>Цветная россыпь: +${esc(money(prices.scatterFancySurcharge ?? 0))}</li>
      </ul>

      <h2>Огранки</h2>
      <p>${SHAPES.map(s => s[1]).join(', ')}.</p>

      <h2>Данные каталога</h2>
      <p>Полный каталог с ценами и правилами расчёта в машиночитаемом виде:
      <a href="/catalog/catalog.json">catalog.json</a>. Описание для ассистентов:
      <a href="/llms.txt">llms.txt</a>.</p>
      ${SPECS_HTML}`,
  });

  pages.push({
    path: '/catalog',
    title: 'Neo Diamond — кольца с лабораторными бриллиантами в Алматы и Астане',
    description: 'Помолвочные кольца и украшения с лабораторными бриллиантами. Сертификат IGI, 10 огранок, золото 585/750. Примерка в шоурумах Алматы и Астаны, изготовление 5–10 дней.',
    jsonLd: organization,
    bodyHtml: `
      <h1>Кольца с лабораторными бриллиантами — Neo Diamond</h1>
      <p>Ювелирная студия в Алматы и Астане. Каждый камень от 0,5 карат — с сертификатом IGI.</p>
      <h2>Огранки</h2>
      <ul>${SHAPES.map(([, l]) => `<li>${esc(l)}</li>`).join('')}</ul>
      ${SPECS_HTML}
      <p><a href="/catalog/list">Смотреть каталог с ценами</a></p>`,
  });

  // Контакты идут на каждую страницу — и текстом, и разметкой. На карточке
  // товара к описанию организации добавляется описание самого товара: ассистент,
  // попавший сразу на карточку, должен узнать и цену, и куда за ней приходить.
  for (const p of pages) {
    const dir = join(DIST, p.path);
    mkdirSync(dir, { recursive: true });
    const withContacts = {
      ...p,
      bodyHtml: p.bodyHtml + FOOTER_HTML,
      jsonLd: p.jsonLd === organization ? organization : [organization, p.jsonLd],
    };
    writeFileSync(join(dir, 'index.html'), page(shell, withContacts));
  }

  // Sitemap and robots — both currently return the SPA shell, so crawlers get
  // no map of the site at all.
  const today = new Date().toISOString().slice(0, 10);
  // Карта сайта описывает весь домен, а не только каталог: главная страница
  // отдаётся с другого сайта Netlify, но для поисковика это один адрес.
  const urls = ['/', '/catalog', '/catalog/list', ...pages.filter(p => p.path.startsWith('/catalog/product')).map(p => p.path)];
  writeFileSync(join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...new Set(urls)].map(u =>
      `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq>` +
      `<priority>${u === '/' ? '1.0' : u === '/catalog' ? '0.9' : u === '/catalog/list' ? '0.9' : '0.7'}</priority></url>`
    ).join('\n') + `\n</urlset>\n`);

  // Машиночитаемый каталог и справка для ассистентов.
  mkdirSync(join(DIST, 'catalog'), { recursive: true });
  writeFileSync(join(DIST, 'catalog', 'catalog.json'), JSON.stringify(catalogFeed(prices), null, 2));
  writeFileSync(join(DIST, 'llms.txt'), llmsTxt(prices));

  writeFileSync(join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\n` +
    `# Ассистентам: каталог и цены открыты для чтения.\n` +
    ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User','Claude-SearchBot',
     'PerplexityBot','Perplexity-User','Google-Extended','Applebot-Extended','CCBot','Bingbot','YandexBot']
      .map(a => `User-agent: ${a}\nAllow: /`).join('\n\n') +
    `\n\nSitemap: ${SITE}/sitemap.xml\n` +
    `\n# Справка для ассистентов и машиночитаемый каталог с ценами:\n` +
    `# ${SITE}/llms.txt\n# ${SITE}/catalog/catalog.json\n`);

  console.log(`  страниц: ${pages.length}, sitemap: ${new Set(urls).size} адресов`);
}

main().catch(e => { console.error('prerender failed:', e); process.exit(1); });
