// Netlify Function v2: track
// Records one catalog funnel event.
//
// v2 (not the older `export const handler` style) specifically because the
// second argument carries `context.geo` — Netlify resolves the city at the
// edge, so no third-party IP lookup is needed.
//
// Every event is written under its own key. Appending to a shared document
// would mean read-modify-write, and two visitors acting at the same moment
// would silently overwrite each other.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const ALLOWED_EVENTS = new Set([
  'session_start',
  'shape_select',
  'catalog_view',
  'product_open',
  'config_change',
  'booking_open',
  'wa_click',
  'product_learn_more_click',
  'booking_whatsapp_click',
  'booking_share_click',
  'booking_share_success',
  'booking_other_models_click',
  'faq_open',
]);

// Keeps a malformed or hostile payload from bloating storage.
const MAX_PROPS_KEYS = 12;
const MAX_STR        = 120;

function clean(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, MAX_STR);
  return undefined;
}

function cleanObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out = {};
  for (const [k, v] of Object.entries(obj).slice(0, MAX_PROPS_KEYS)) {
    const c = clean(v);
    if (c !== undefined) out[String(k).slice(0, 40)] = c;
  }
  return out;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  const event = String(body?.event ?? '');
  if (!ALLOWED_EVENTS.has(event)) {
    return new Response(JSON.stringify({ error: 'Unknown event' }), { status: 400, headers: CORS });
  }

  const sessionId = String(body?.sessionId ?? '').slice(0, 64);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), { status: 400, headers: CORS });
  }

  const geo = context?.geo ?? {};
  const now = new Date();

  const record = {
    event,
    sessionId,
    ts:      Number.isFinite(body?.ts) ? body.ts : now.getTime(),
    path:    String(body?.path ?? '').slice(0, MAX_STR),
    props:   cleanObject(body?.props),
    utm:     cleanObject(body?.utm),
    city:    geo.city ?? null,
    country: geo.country?.code ?? null,
  };

  // events/YYYY-MM-DD/<session>/<ts>-<rand> — the date prefix lets the
  // dashboard read one day without scanning everything.
  const day = now.toISOString().slice(0, 10);
  const key = `events/${day}/${sessionId}/${record.ts}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const store = getStore({ name: 'nd-events', context });
    await store.setJSON(key, record);
  } catch (err) {
    // A failed write must never surface to the visitor.
    console.warn('track write failed:', err);
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: CORS });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
};

export const config = { path: '/api/track' };
