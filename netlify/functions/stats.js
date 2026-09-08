// Netlify Function v2: stats
// Aggregates catalog funnel events for the admin dashboard.
//
// GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD   (Bearer ADMIN_TOKEN)
//
// Events are stored one blob per event, which is right for writing but means a
// range query has to read many objects. So each completed day is rolled up once
// into a compact summary and cached; only the current day is recomputed live.
//
// Funnel steps count DISTINCT SESSIONS, not raw events — otherwise one visitor
// opening ten cards would look like ten people.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const FUNNEL = [
  'session_start',
  'shape_select',
  'catalog_view',
  'product_open',
  'config_change',
  'booking_open',
  'wa_click',
];

const MAX_DAYS = 92;
const FETCH_CHUNK = 40;

function isDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s ?? ''); }
function today()  { return new Date().toISOString().slice(0, 10); }

function daysBetween(from, to) {
  const out = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end && out.length < MAX_DAYS) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// Turns one day of raw events into the compact shape the dashboard reads.
function rollUp(day, records) {
  const sessions      = new Set();
  const stepSessions  = Object.fromEntries(FUNNEL.map(s => [s, new Set()]));
  const citySessions  = new Map();
  const utmSessions   = new Map();
  const shapes        = new Map();
  const models        = new Map();
  const categories    = new Map();
  const carats        = new Map();

  const bump = (map, key) => {
    if (key === null || key === undefined || key === '') return;
    map.set(key, (map.get(key) ?? 0) + 1);
  };
  const addSession = (map, key, sid) => {
    if (key === null || key === undefined || key === '') return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(sid);
  };

  for (const r of records) {
    const sid = r.sessionId;
    if (!sid) continue;
    sessions.add(sid);
    if (stepSessions[r.event]) stepSessions[r.event].add(sid);

    addSession(citySessions, r.city ?? 'Неизвестно', sid);
    addSession(utmSessions, r.utm?.utm_source ?? 'Прямой заход', sid);

    if (r.event === 'shape_select') bump(shapes, r.props?.shape);
    if (r.event === 'product_open') {
      bump(models, r.props?.model);
      bump(categories, r.props?.category);
      bump(shapes, r.props?.shape);
    }
    if (r.event === 'config_change' && r.props?.field === 'carat') bump(carats, String(r.props.value));
  }

  const countMap  = (m) => Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
  const uniqueMap = (m) => Object.fromEntries(
    [...m.entries()].map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1])
  );

  return {
    day,
    events:   records.length,
    sessions: sessions.size,
    funnel:   Object.fromEntries(FUNNEL.map(s => [s, stepSessions[s].size])),
    cities:   uniqueMap(citySessions),
    utm:      uniqueMap(utmSessions),
    shapes:   countMap(shapes),
    models:   countMap(models),
    categories: countMap(categories),
    carats:   countMap(carats),
  };
}

async function readDay(store, day) {
  const keys = [];
  for await (const page of store.list({ prefix: `events/${day}/`, paginate: true })) {
    for (const b of page.blobs) keys.push(b.key);
  }

  const records = [];
  for (let i = 0; i < keys.length; i += FETCH_CHUNK) {
    const chunk = keys.slice(i, i + FETCH_CHUNK);
    const got = await Promise.all(
      chunk.map(k => store.get(k, { type: 'json' }).catch(() => null))
    );
    for (const r of got) if (r) records.push(r);
  }
  return records;
}

async function dayStats(store, rollups, day) {
  const isToday = day === today();

  if (!isToday) {
    const cached = await rollups.get(day, { type: 'json' }).catch(() => null);
    if (cached) return cached;
  }

  const summary = rollUp(day, await readDay(store, day));

  // Past days never change again, so the rollup is worth keeping.
  if (!isToday) {
    await rollups.setJSON(day, summary).catch(() => {});
  }
  return summary;
}

// Sums daily summaries into one range-wide view.
function mergeDays(days) {
  const total = {
    events: 0,
    sessions: 0,
    funnel: Object.fromEntries(FUNNEL.map(s => [s, 0])),
    cities: {}, utm: {}, shapes: {}, models: {}, categories: {}, carats: {},
  };
  const addInto = (target, src) => {
    for (const [k, v] of Object.entries(src ?? {})) target[k] = (target[k] ?? 0) + v;
  };

  for (const d of days) {
    total.events   += d.events ?? 0;
    total.sessions += d.sessions ?? 0;
    addInto(total.funnel, d.funnel);
    addInto(total.cities, d.cities);
    addInto(total.utm, d.utm);
    addInto(total.shapes, d.shapes);
    addInto(total.models, d.models);
    addInto(total.categories, d.categories);
    addInto(total.carats, d.carats);
  }

  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  total.cities = sortObj(total.cities);
  total.utm = sortObj(total.utm);
  total.shapes = sortObj(total.shapes);
  total.models = sortObj(total.models);
  total.carats = sortObj(total.carats);

  // Conversion is measured against the top of the funnel, plus the step-to-step
  // drop that shows where people actually leave.
  const top = total.funnel.session_start || total.sessions || 0;
  let prev = top;
  total.conversion = FUNNEL.map((step) => {
    const n = total.funnel[step] ?? 0;
    const row = {
      step,
      sessions: n,
      ofTotal:    top  ? +(n / top  * 100).toFixed(1) : 0,
      ofPrevious: prev ? +(n / prev * 100).toFixed(1) : 0,
    };
    prev = n || prev;
    return row;
  });

  return total;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim();
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
  }

  const url = new URL(req.url);
  const to   = isDay(url.searchParams.get('to'))   ? url.searchParams.get('to')   : today();
  let   from = isDay(url.searchParams.get('from')) ? url.searchParams.get('from') : to;
  if (from > to) from = to;

  try {
    const store   = getStore({ name: 'nd-events',   context });
    const rollups = getStore({ name: 'nd-rollups',  context });

    const days = daysBetween(from, to);
    const daily = [];
    for (const day of days) {
      daily.push(await dayStats(store, rollups, day));
    }

    return new Response(JSON.stringify({
      from, to,
      daily,
      total: mergeDays(daily),
    }), { status: 200, headers: CORS });
  } catch (err) {
    console.error('stats error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to build stats', detail: String(err) }),
      { status: 500, headers: CORS }
    );
  }
};

export const config = { path: '/api/stats' };
