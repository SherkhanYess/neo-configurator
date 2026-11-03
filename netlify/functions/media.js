// Фото, загруженные в админке.
//
// POST /api/media        — загрузить (только админ). Тело — сам файл.
// GET  /api/media/:id    — отдать файл посетителю.
//
// Файл приходит уже сжатым: админка уменьшает его в браузере до размера,
// которого хватает телефону. Имя каждого файла новое, поэтому отдаём его с
// кэшем «навсегда» — CDN Netlify держит копию у себя, и функция почти не
// вызывается. Адрес под /api/, чтобы фото открывались и через основной домен:
// он проксирует сюда именно /api/*.

import { getStore } from '@netlify/blobs';
import { isAdmin, json, preflight, CORS } from '../lib/http.js';

const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' };
const MAX_BYTES = 5 * 1024 * 1024;
const FOREVER = 'public, max-age=31536000, immutable';

export default async (req, context) => {
  if (req.method === 'OPTIONS') return preflight();
  const store = getStore({ name: 'nd-media', context });

  if (req.method === 'GET') {
    const id = String(context.params?.id ?? '');
    if (!/^[a-z0-9-]+\.(webp|jpg|png|avif)$/.test(id)) return new Response('Not found', { status: 404, headers: CORS });
    const got = await store.getWithMetadata(id, { type: 'arrayBuffer' }).catch(() => null);
    if (!got) return new Response('Not found', { status: 404, headers: CORS });
    return new Response(got.data, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': got.metadata?.type ?? 'application/octet-stream',
        'Cache-Control': FOREVER,
        'Netlify-CDN-Cache-Control': FOREVER,
      },
    });
  }

  if (req.method !== 'POST') return json(405, { error: 'method' });
  if (!isAdmin(req)) return json(401, { error: 'unauthorized' });

  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim();
  const ext = TYPES[type];
  if (!ext) return json(415, { error: 'type', message: 'Нужна картинка: WebP, JPEG, PNG или AVIF' });

  const data = await req.arrayBuffer();
  if (!data.byteLength) return json(400, { error: 'empty' });
  if (data.byteLength > MAX_BYTES) return json(413, { error: 'size', message: 'Файл больше 5 МБ' });

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await store.set(id, data, {
    metadata: {
      type,
      bytes: data.byteLength,
      width: Number(req.headers.get('x-width')) || null,
      height: Number(req.headers.get('x-height')) || null,
      at: new Date().toISOString(),
    },
  });
  return json(200, { id, url: `/api/media/${id}` });
};

export const config = { path: ['/api/media', '/api/media/:id'] };
