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

// The sequential path a visitor walks: every step here is genuinely required
// to reach the next one.
//
// shape_select and config_change are both absent for the same reason — neither
// gates anything. «Смотреть все украшения» takes you to the grid without
// picking a shape, and you can reach the booking screen without touching a
// single option. Counting an optional action as a stage invents a drop-off:
// the step showed people "leaving" while the step after it had MORE sessions,
// which a Math.min(100, …) cap then quietly hid. Both are reported separately.
const FUNNEL = [
  'session_start',
  'catalog_view',
  'product_open',
  'booking_open',
  'wa_click',
];

// Measured per session but off to the side of the funnel: none of them gates
// anything, so counting them as stages would invent a drop-off.
const ENGAGEMENT = [
  'shape_select',
  'config_change',
  'product_learn_more_click',
  'booking_share_click',
  'booking_share_success',
  'booking_other_models_click',
];

const TRACKED = [...FUNNEL, ...ENGAGEMENT];

// The booking page was rebuilt and its WhatsApp button started reporting under
// a new name, which silently emptied the last funnel step. Both names mean the
// same thing, so the newer one folds into the original and history still adds up.
const EVENT_ALIAS = { booking_whatsapp_click: 'wa_click' };

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

// A placement, not just a platform: utm_source alone would merge the profile
// link, stories and posts into one «instagram» row, which answers nothing.
// Medium is optional — a link tagged with source only still gets its own row.
export function utmKey(utm) {
  const source = String(utm?.utm_source ?? '').trim();
  if (!source) return 'Прямой заход';
  const medium = String(utm?.utm_medium ?? '').trim();
  return medium ? `${source} / ${medium}` : source;
}

// Turns a set of events into the compact shape the dashboard reads.
function core(records) {
  const sessions      = new Set();
  const stepSessions  = Object.fromEntries(TRACKED.map(s => [s, new Set()]));
  const citySessions  = new Map();
  const utmSessions   = new Map();
  const shapes        = new Map();
  const models        = new Map();
  const categories    = new Map();
  const carats        = new Map();
  const faq           = new Map();    // какие вопросы раскрывают
  const opensBySession = new Map();   // сколько карточек открыла каждая сессия

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
    const event = EVENT_ALIAS[r.event] ?? r.event;
    sessions.add(sid);
    if (stepSessions[event]) stepSessions[event].add(sid);

    addSession(citySessions, r.city ?? 'Неизвестно', sid);
    addSession(utmSessions, utmKey(r.utm), sid);

    if (event === 'shape_select') bump(shapes, r.props?.shape);
    if (event === 'faq_open')     bump(faq, String(r.props?.question ?? ''));
    if (event === 'product_open') {
      opensBySession.set(sid, (opensBySession.get(sid) ?? 0) + 1);
      bump(models, r.props?.model);
      bump(categories, r.props?.category);
      bump(shapes, r.props?.shape);
    }
    if (event === 'config_change' && r.props?.field === 'carat') bump(carats, String(r.props.value));
  }

  const countMap  = (m) => Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
  const uniqueMap = (m) => Object.fromEntries(
    [...m.entries()].map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1])
  );

  // Distinguishes "opened one card and left" from "compared eight" — the funnel
  // alone counts both as a single session that did not convert.
  const depth = { '1': 0, '2-3': 0, '4+': 0 };
  let openEvents = 0;
  for (const n of opensBySession.values()) {
    openEvents += n;
    if (n >= 4) depth['4+']++;
    else if (n >= 2) depth['2-3']++;
    else depth['1']++;
  }

  return {
    events:   records.length,
    sessions: sessions.size,
    depth,
    openEvents,
    openSessions: opensBySession.size,
    funnel:   Object.fromEntries(TRACKED.map(s => [s, stepSessions[s].size])),
    cities:   uniqueMap(citySessions),
    utm:      uniqueMap(utmSessions),
    shapes:   countMap(shapes),
    models:   countMap(models),
    categories: countMap(categories),
    carats:   countMap(carats),
    faq:      countMap(faq),
  };
}

// Every figure is also computed per traffic source, so the dashboard's filter
// can rescope the whole page — funnel included — without re-reading raw events.
// Source cardinality is a handful, so this costs little and keeps the daily
// rollups cacheable.
export const ROLLUP_VERSION = 2;

export function rollUp(day, records) {
  const groups = new Map();
  for (const r of records) {
    const k = utmKey(r.utm);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  const bySource = {};
  for (const [k, recs] of groups) bySource[k] = core(recs);

  return { day, v: ROLLUP_VERSION, ...core(records), bySource };
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
    // An older rollup lacks the per-source split — recompute rather than serve
    // a day the filter cannot scope.
    if (cached && cached.v === ROLLUP_VERSION) return cached;
  }

  const summary = rollUp(day, await readDay(store, day));

  // Past days never change again, so the rollup is worth keeping.
  if (!isToday) {
    await rollups.setJSON(day, summary).catch(() => {});
  }
  return summary;
}

// Sums daily summaries into one range-wide view.
function mergeCores(days) {
  const total = {
    events: 0,
    sessions: 0,
    funnel: Object.fromEntries(TRACKED.map(s => [s, 0])),
    depth: { '1': 0, '2-3': 0, '4+': 0 },
    openEvents: 0,
    openSessions: 0,
    cities: {}, utm: {}, shapes: {}, models: {}, categories: {}, carats: {}, faq: {},
  };
  const addInto = (target, src) => {
    for (const [k, v] of Object.entries(src ?? {})) target[k] = (target[k] ?? 0) + v;
  };

  for (const d of days) {
    total.events       += d.events ?? 0;
    total.sessions     += d.sessions ?? 0;
    total.openEvents   += d.openEvents ?? 0;
    total.openSessions += d.openSessions ?? 0;
    addInto(total.depth, d.depth);
    addInto(total.funnel, d.funnel);
    addInto(total.cities, d.cities);
    addInto(total.utm, d.utm);
    addInto(total.shapes, d.shapes);
    addInto(total.models, d.models);
    addInto(total.categories, d.categories);
    addInto(total.carats, d.carats);
    addInto(total.faq, d.faq);
  }

  // Среднее по тем, кто вообще открывал карточки, — иначе его размывают те, кто до них не дошёл.
  total.avgCardsPerSession = total.openSessions
    ? +(total.openEvents / total.openSessions).toFixed(1)
    : 0;
  total.depth = Object.fromEntries(Object.entries(total.depth).filter(([, v]) => v > 0));

  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  total.cities = sortObj(total.cities);
  total.utm = sortObj(total.utm);
  total.shapes = sortObj(total.shapes);
  total.models = sortObj(total.models);
  total.carats = sortObj(total.carats);
  total.faq = sortObj(total.faq);

  // Conversion is measured against the top of the funnel, plus the step-to-step
  // drop that shows where people actually leave.
  const top = total.funnel.session_start || total.sessions || 0;
  let prev = top;
  total.conversion = FUNNEL.map((step) => {
    const n = total.funnel[step] ?? 0;
    // A step can be entered directly — a shared product link skips the grid —
    // so the ratio is capped: a stage never converts more than everyone before it.
    const ofPrevious = prev ? Math.min(100, +(n / prev * 100).toFixed(1)) : 0;
    const row = {
      step,
      sessions: n,
      ofTotal: top ? +(n / top * 100).toFixed(1) : 0,
      ofPrevious,
    };
    prev = n;
    return row;
  });

  total.engagement = Object.fromEntries(
    ENGAGEMENT.map(s => [s, {
      sessions: total.funnel[s] ?? 0,
      ofTotal:  top ? +((total.funnel[s] ?? 0) / top * 100).toFixed(1) : 0,
    }])
  );

  return total;
}

export function mergeDays(days) {
  const total = mergeCores(days);

  // The same range-wide view, one per source, so the filter swaps the whole
  // page rather than dimming one row.
  const keys = new Set(days.flatMap(d => Object.keys(d?.bySource ?? {})));
  const bySource = {};
  for (const key of keys) {
    bySource[key] = mergeCores(days.map(d => d?.bySource?.[key]).filter(Boolean));
  }

  return { ...total, bySource };
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
