// Netlify Function v2: set-products
// Saves the catalog product configuration (admin only).
//
// Only visibility and naming are accepted. The iJewel bindings live in the
// bundle and are not writable here — a bad shank name would break the 3D
// viewer rather than just mislabel a card.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const MAX_LABEL = 60;
const MAX_ITEMS = 200;

const str = (v, fallback = '') => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, MAX_LABEL) : fallback;
};
const bool = (v) => v !== false;

function sanitize(body) {
  const arr = (v) => (Array.isArray(v) ? v.slice(0, MAX_ITEMS) : []);

  return {
    version: 1,
    shapes: arr(body?.shapes)
      .filter(s => str(s?.id))
      .map(s => ({ id: str(s.id), label: str(s.label, str(s.id)), enabled: bool(s.enabled) })),
    rings: arr(body?.rings)
      .filter(r => str(r?.shank) && str(r?.cast))
      .map(r => ({ shank: str(r.shank), cast: str(r.cast), name: str(r.name), enabled: bool(r.enabled) })),
    pusety: arr(body?.pusety)
      .filter(p => str(p?.cast) && str(p?.shape))
      .map(p => ({ cast: str(p.cast), shape: str(p.shape), enabled: bool(p.enabled) })),
  };
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  const clean = sanitize(body);
  if (!clean.shapes.length && !clean.rings.length && !clean.pusety.length) {
    return new Response(JSON.stringify({ error: 'Empty product config' }), { status: 400, headers: CORS });
  }

  // Refuse to hide the whole catalog by accident.
  if (!clean.shapes.some(s => s.enabled)) {
    return new Response(
      JSON.stringify({ error: 'Хотя бы одна огранка должна остаться включённой' }),
      { status: 400, headers: CORS }
    );
  }

  try {
    const store = getStore({ name: 'nd-products', context });
    await store.setJSON('config', clean);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
  } catch (err) {
    console.error('set-products error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to save products', detail: String(err) }),
      { status: 500, headers: CORS }
    );
  }
};

export const config = { path: '/api/set-products' };
