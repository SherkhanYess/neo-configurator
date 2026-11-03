// Содержимое витрины, которое правится в админке без пересборки сайта.
//
// GET /api/content/feed     — лента: порядок моделей, фото, цвет плашки, тексты,
//                             кадры «на руке», заголовок ленты.
// GET /api/content/reviews  — цитаты из отзывов 2ГИС.
// PUT /api/content/:name    — сохранить (только админ).
//
// Пустой ответ (null) значит «ещё не правили»: сайт показывает то, что зашито
// в код, и работает до первой правки так же, как раньше.
//
// Перед каждой записью прежняя версия откладывается в историю (последние 20) —
// если сохранили не то, её можно вернуть вручную из хранилища.

import { getStore } from '@netlify/blobs';
import { isAdmin, json, preflight } from '../lib/http.js';

const HISTORY = 20;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hex = (v) => (typeof v === 'string' && /^#[0-9A-F]{6}$/i.test(v) ? v.toUpperCase() : null);
const num = (v, lo, hi, fallback) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const photo = (v) =>
  typeof v === 'string' && /^\/(api\/media\/[a-z0-9-]+\.(webp|jpg|png|avif)|assets\/feed\/[\w.-]+)$/.test(v) ? v : null;
const focus = (v) => ({ x: num(v?.x, 0, 100, 50), y: num(v?.y, 0, 100, 50) });

export function cleanFeed(body) {
  const models = (Array.isArray(body?.models) ? body.models : [])
    .slice(0, 40)
    .filter(m => /^[A-Za-z ]{2,30}\|(classic|halo|bezel)$/.test(m?.key ?? ''))
    .map(m => ({
      key: m.key,
      text: str(m.text, 160),
      photo: photo(m.photo),
      tone: hex(m.tone),
      toneAuto: hex(m.toneAuto),
      focus: focus(m.focus),
    }));
  const seen = new Set();
  const unique = models.filter(m => !seen.has(m.key) && seen.add(m.key));

  const breaks = (Array.isArray(body?.breaks) ? body.breaks : [])
    .slice(0, 12)
    .map(b => ({
      id: str(b?.id, 24) || Math.random().toString(36).slice(2, 10),
      title: str(b?.title, 80),
      after: Math.round(num(b?.after, 1, 40, 3)),
      photo: photo(b?.photo),
      tone: hex(b?.tone),
      toneAuto: hex(b?.toneAuto),
      focus: focus(b?.focus),
      hidden: b?.hidden === true,
    }));

  return {
    version: 1,
    intro: { title: str(body?.intro?.title, 60), sub: str(body?.intro?.sub, 120) },
    models: unique,
    breaks,
  };
}

export function cleanReviews(body) {
  const items = (Array.isArray(body?.items) ? body.items : [])
    .slice(0, 40)
    .map(r => ({
      id: str(r?.id, 24) || Math.random().toString(36).slice(2, 10),
      name: str(r?.name, 40),
      text: str(r?.text, 600),
      url: str(r?.url, 400),
      date: /^\d{4}-\d{2}-\d{2}$/.test(r?.date ?? '') ? r.date : '',
      hidden: r?.hidden === true,
    }))
    // Отзыв без ссылки на оригинал не публикуем: придумывать отзывы нельзя,
    // и ссылка — то, чем это проверяется.
    .filter(r => r.name && r.text && /^https:\/\/([\w-]+\.)*2gis\.(kz|ru|com)\//.test(r.url));
  return { version: 1, items };
}

const DOCS = { feed: cleanFeed, reviews: cleanReviews };

export default async (req, context) => {
  if (req.method === 'OPTIONS') return preflight();
  const name = String(context.params?.name ?? '');
  const clean = DOCS[name];
  if (!clean) return json(404, { error: 'unknown document' });

  const store = getStore({ name: 'nd-content', context });

  if (req.method === 'GET') {
    const doc = await store.get(name, { type: 'json' }).catch(() => null);
    return json(200, doc ?? null);
  }

  if (req.method !== 'PUT') return json(405, { error: 'method' });
  if (!isAdmin(req)) return json(401, { error: 'unauthorized' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid json' }); }

  const doc = { ...clean(body), updatedAt: new Date().toISOString() };

  const prev = await store.get(name, { type: 'json' }).catch(() => null);
  if (prev) {
    await store.setJSON(`history/${name}/${prev.updatedAt ?? Date.now()}`, prev).catch(() => {});
    const { blobs } = await store.list({ prefix: `history/${name}/` }).catch(() => ({ blobs: [] }));
    const old = blobs.map(b => b.key).sort().slice(0, Math.max(0, blobs.length - HISTORY));
    await Promise.all(old.map(k => store.delete(k).catch(() => {})));
  }

  await store.setJSON(name, doc);
  return json(200, doc);
};

export const config = { path: '/api/content/:name' };
