import { api, getToken } from './api.js';
import { saveProducts } from '../catalog/data/products.js';
import { savePrices } from '../catalog/data/prices.js';
import { guideList } from '../catalog/data/guides.js';
import { addModel, keyOf, mergeProducts, modelShanks, prunePrices, pruneFeed, removeModel, shankSlug } from '../catalog/data/models.js';

// Добавление и удаление моделей из админки («Модели и цены»).
//
// Модель живёт в нескольких документах: список моделей (/api/set-products),
// цены, лента (текст и фото) и гиды (ссылки на её страницу). Удаление
// стирает её отовсюду за раз — чтобы на сайте и в хранилище не оставалось
// мёртвых хвостов: цены без модели, фото без карточки, ссылок в никуда.
//
// Всё читается свежим с сервера (мимо кэша), а не из черновика на экране:
// удаление не должно заодно сохранить чужие несохранённые правки.

const MEDIA = /^\/api\/media\/([a-z0-9-]+\.(?:webp|jpg|png|avif))$/;

async function loadDocs() {
  const [products, prices, feed, guides] = await Promise.all([
    api('/api/get-products?fresh'),
    api('/api/get-prices'),
    api('/api/content/feed?fresh'),
    api('/api/content/guides?fresh'),
  ]);
  return { raw: products, products: mergeProducts(products), prices, feed, guides };
}

/** Ссылка ведёт на страницу этой модели (любая оправа, любая огранка; и
 *  старый вид адреса с /catalog — такие могли остаться в сохранённых гидах). */
const linksTo = (slug) => (v) => typeof v === 'string'
  && new RegExp(`^(/catalog)?/product/${slug.replace(/[-]/g, '\\-')}(/|$)`).test(v);

/**
 * Блок гида без ссылок на модель: пункт списка со ссылкой на неё уходит
 * целиком (карточка кольца, которого нет, хуже пустого места), одиночная
 * ссылка становится пустой — и кнопка ведёт в каталог. Сами блоки и гиды не
 * удаляются никогда.
 */
function stripLinks(value, isDead) {
  if (Array.isArray(value)) {
    return value
      .filter(x => !(x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).some(isDead)))
      .map(x => stripLinks(x, isDead));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, isDead(v) ? '' : stripLinks(v, isDead)]));
  }
  return value;
}

const guideLinks = (g, isDead) => JSON.stringify(g.blocks ?? []).split('"').some(isDead);

function stripGuides(guides, isDead) {
  return { version: 1, items: guides.map(g => ({ ...g, blocks: (g.blocks ?? []).map(b => stripLinks(b, isDead)) })) };
}

/** Фото, на которые ещё что-то ссылается после удаления. */
function stillUsed(url, docs) {
  return docs.some(d => d && JSON.stringify(d).includes(url));
}

/**
 * Что удаление затронет — для окна подтверждения. Ничего не меняет.
 */
export async function planRemoval(shank) {
  const docs = await loadDocs();
  const rings = docs.products.rings.filter(r => r.shank === shank);
  const keys = new Set(rings.map(r => keyOf(r.shank, r.cast)));
  const slug = shankSlug(shank);
  const isDead = linksTo(slug);

  const feedItems = (docs.feed?.models ?? []).filter(m => keys.has(m.key));
  const photos = feedItems.map(m => m.photo).filter(p => MEDIA.test(p ?? ''));

  // Гиды — сохранённые в админке, а если их ещё не правили, то из кода:
  // ссылки на модель могут быть и там.
  const guides = guideList(docs.guides, { withHidden: true });
  const names = rings.map(r => r.name);
  const linked = guides.filter(g => guideLinks(g, isDead)).map(g => g.title);
  const mentioned = guides
    .filter(g => !linked.includes(g.title) && names.some(n => JSON.stringify(g).includes(n)))
    .map(g => g.title);

  const shapes = docs.products.shapes.filter(s => s.enabled).length;
  return {
    shank,
    names,
    lastOne: modelShanks(docs.products).length <= 1,
    price: docs.prices?.baseByShank?.[shank] != null,
    feedText: feedItems.some(m => m.text),
    photos: photos.length,
    pages: rings.filter(r => r.enabled).length * shapes,
    linked,
    mentioned,
  };
}

/** Удалить модель со всеми хвостами. Возвращает, что сделано. */
export async function removeModelEverywhere(shank) {
  const docs = await loadDocs();
  const products = removeModel(docs.products, shank);
  if (!products.rings.length) throw new Error('Последнюю модель удалить нельзя — на сайте должно остаться хотя бы одно кольцо');

  const slug = shankSlug(shank);
  const isDead = linksTo(slug);
  const goneKeys = new Set(docs.products.rings.filter(r => r.shank === shank).map(r => keyOf(r.shank, r.cast)));
  const photos = (docs.feed?.models ?? []).filter(m => goneKeys.has(m.key)).map(m => m.photo).filter(p => MEDIA.test(p ?? ''));

  // 1. Список моделей — с этого момента модели нет на сайте.
  await saveProducts(products, getToken());

  // 2. Цена.
  if (docs.prices) await savePrices(prunePrices(docs.prices, products), getToken());

  // 3. Лента: текст, фото, место в порядке.
  const feed = docs.feed ? pruneFeed(docs.feed, products) : null;
  if (docs.feed && feed.models.length !== docs.feed.models.length) await api('/api/content/feed', { method: 'PUT', body: feed });

  // 4. Гиды: ссылки на страницу модели. Не правленные в админке гиды живут в
  //    коде — если ссылка есть и там, сохраняем их уже без неё.
  const guides = guideList(docs.guides, { withHidden: true });
  let guidesFixed = 0;
  if (guides.some(g => guideLinks(g, isDead))) {
    guidesFixed = guides.filter(g => guideLinks(g, isDead)).length;
    await api('/api/content/guides', { method: 'PUT', body: stripGuides(guides, isDead) });
  }

  // 5. Фото из хранилища — если больше нигде не используются.
  let photosDeleted = 0;
  for (const url of photos) {
    if (stillUsed(url, [feed, docs.guides])) continue;
    try {
      await api(`/api/media/${url.match(MEDIA)[1]}`, { method: 'DELETE' });
      photosDeleted++;
    } catch { /* не удалилось — останется лежать, на сайте его всё равно нет */ }
  }

  return { photosDeleted, guidesFixed };
}

/**
 * Хвосты моделей, которых уже нет в списке: цены, тексты и фото ленты,
 * старая версия документа моделей. Остаются после удаления в коде.
 */
export async function findLeftovers() {
  const docs = await loadDocs();
  const shanks = new Set(modelShanks(docs.products));
  const keys = new Set(docs.products.rings.map(r => keyOf(r.shank, r.cast)));
  const prices = Object.keys(docs.prices?.baseByShank ?? {}).filter(k => !shanks.has(k));
  const feed = (docs.feed?.models ?? []).filter(m => !keys.has(m.key)).map(m => m.key.split('|')[0]);
  const rings = (docs.raw?.rings ?? []).filter(r => !keys.has(keyOf(r.shank, r.cast))).map(r => r.shank);
  const names = [...new Set([...prices, ...feed, ...rings])];
  return names.length ? { names, docs } : null;
}

/** Стереть хвосты, найденные findLeftovers. */
export async function clearLeftovers({ docs }) {
  await saveProducts(docs.products, getToken());
  if (docs.prices) await savePrices(prunePrices(docs.prices, docs.products), getToken());
  if (docs.feed) {
    const feed = pruneFeed(docs.feed, docs.products);
    const gone = docs.feed.models.filter(m => !feed.models.includes(m)).map(m => m.photo).filter(p => MEDIA.test(p ?? ''));
    if (gone.length || feed.models.length !== docs.feed.models.length) await api('/api/content/feed', { method: 'PUT', body: feed });
    for (const url of gone) {
      if (stillUsed(url, [feed, docs.guides])) continue;
      await api(`/api/media/${url.match(MEDIA)[1]}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

/** Новая модель: в список моделей и в цены. Фото и текст — в «Ленте». */
export async function addModelToSite(form) {
  const docs = await loadDocs();
  const products = addModel(docs.products, form);
  const shank = products.rings[products.rings.length - 1].shank;
  await saveProducts(products, getToken());
  const prices = docs.prices ?? {};
  await savePrices({ ...prices, baseByShank: { ...(prices.baseByShank ?? {}), [shank]: Number(form.price) || 0 } }, getToken());
  return shank;
}
