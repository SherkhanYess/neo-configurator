// Netlify Function v2: hint
//
// «Намекнуть партнёру»: она оставляет его имя и номер и свой размер кольца.
// Менеджер пишет ему в WhatsApp одно сообщение с ссылкой на кольцо; размер в
// сообщение не идёт — чтобы узнать его, он пишет нам сам.
//
// Каждый намёк сохраняется в Blobs (store nd-hints) — это журнал, из которого
// его видно, даже если CRM недоступна. Затем намёк уходит в инфоцентр
// (Supabase, функция site-lead): тот сам создаёт сделку в amoCRM — контакт
// парня, код обращения, UTM, «Источник лида», тег taena — и считает её как
// обращение с сайта. Ключа amoCRM на этом сайте нет и не нужно. Ключ к
// инфоцентру — HUB_SITE_KEY; на песочнице его нет, тестовые намёки в рабочую
// воронку не попадают. Инфоцентр недоступен — форма всё равно «отправлена»,
// намёк остаётся в журнале. Ему в WhatsApp сразу уходит шаблон Meta через
// Kelesu (lib/hintWa.js) — если на сайте есть ключи Kelesu.
//
// GET с ADMIN_TOKEN отдаёт последние намёки для админки, PATCH меняет статус
// работы с намёком («написали ему», «пришёл», «купил») и заметку менеджера.

import { getStore } from '@netlify/blobs';
import { isAdmin } from '../lib/http.js';
import { sendHintWa } from '../lib/hintWa.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json',
};

export const HINT_STATUSES = ['new', 'written', 'replied', 'visited', 'bought', 'lost'];

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: CORS });

/** +7XXXXXXXXXX из того, что ввели: «8 777…», «+7 (777)…», «777…». */
export function normalizePhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 11 && (d.startsWith('7') || d.startsWith('8'))) return `+7${d.slice(1)}`;
  if (d.length === 10) return `+7${d}`;
  return null;
}

/** Размер кольца: 14–24 с шагом 0,25. Пусто — «не знает размер». */
export function normalizeSize(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 14 || n > 24) return undefined;
  return Math.round(n * 4) / 4;
}

export const HUB_SITE_LEAD_URL = 'https://kpsvtmryzzjwtkmlnruy.supabase.co/functions/v1/site-lead';
const HUB_TIMEOUT_MS = 8000;

/** Город для инфоцентра: almaty | astana | null. */
export function hubCity(city) {
  return { 'Алматы': 'almaty', 'Астана': 'astana' }[city] ?? null;
}

/** Тело запроса в инфоцентр (site-lead). hint_id — защита от дублей. */
export function hubPayload(h, hintId) {
  return {
    type: 'hint',
    code: h.code,
    name: h.name,
    phone: h.phone,
    ring: h.ring,
    link: h.link,
    size: h.size === null || h.size === undefined ? null : String(h.size),
    city: hubCity(h.city),
    hint_id: hintId,
  };
}

/** Сделка в amoCRM через инфоцентр. Нет ключа — молча пропускаем. */
export async function toHub(h, hintId) {
  const key = process.env.HUB_SITE_KEY;
  if (!key) return null;
  const res = await fetch(HUB_SITE_LEAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-site-key': key },
    body: JSON.stringify(hubPayload(h, hintId)),
    signal: AbortSignal.timeout(HUB_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(`site-lead ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return data.lead_id ?? null;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });

  const store = getStore({ name: 'nd-hints', context });

  if (req.method === 'GET') {
    if (!isAdmin(req)) return json(401, { error: 'unauthorized' });
    const { blobs } = await store.list();
    const latest = blobs.map(b => b.key).sort().reverse().slice(0, 300);
    const items = await Promise.all(latest.map(async k => {
      const h = await store.get(k, { type: 'json' }).catch(() => null);
      return h && { key: k, status: 'new', ...h };
    }));
    return json(200, items.filter(Boolean));
  }

  if (req.method === 'PATCH') {
    if (!isAdmin(req)) return json(401, { error: 'unauthorized' });
    let body;
    try { body = await req.json(); } catch { return json(400, { error: 'invalid json' }); }
    const key = String(body?.key ?? '');
    const hint = key && await store.get(key, { type: 'json' }).catch(() => null);
    if (!hint) return json(404, { error: 'not found' });
    if (body.status !== undefined) {
      if (!HINT_STATUSES.includes(body.status)) return json(400, { error: 'status' });
      hint.status = body.status;
      hint.statusAt = new Date().toISOString();
    }
    if (body.note !== undefined) hint.note = String(body.note).slice(0, 500);
    await store.setJSON(key, hint);
    return json(200, { key, ...hint });
  }

  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid json' }); }

  const name  = String(body.name ?? '').trim().slice(0, 60);
  const phone = normalizePhone(body.phone);
  const size  = body.sizeUnknown ? null : normalizeSize(body.size);
  if (!name)               return json(400, { error: 'name' });
  if (!phone)              return json(400, { error: 'phone' });
  if (size === undefined)  return json(400, { error: 'size' });

  const hint = {
    at:   new Date().toISOString(),
    name, phone, size,
    ring: String(body.ring ?? '').slice(0, 120),
    link: String(body.link ?? '').slice(0, 500),
    code: String(body.code ?? '').slice(0, 40),
    city: String(body.city ?? '').slice(0, 20),
  };

  const key = `${hint.at}-${Math.random().toString(36).slice(2, 8)}`;
  await store.setJSON(key, hint);

  // Сделка в amoCRM и сообщение ему в WhatsApp — параллельно: каждое ждёт
  // до 8 с, вместе укладываются в лимит функции. Сбой любого не ломает форму.
  const [hub, wa] = await Promise.allSettled([toHub(hint, key), sendHintWa(hint)]);
  const extra = {};
  if (hub.status === 'fulfilled' && hub.value) extra.leadId = hub.value;
  if (hub.status === 'rejected') console.warn('hint → инфоцентр:', hub.reason?.message ?? hub.reason);
  if (wa.status === 'fulfilled' && wa.value) {
    extra.waSentAt = new Date().toISOString();
    extra.waReply = wa.value;
    extra.status = 'written';
    extra.statusAt = extra.waSentAt;
  }
  if (wa.status === 'rejected') {
    extra.waError = String(wa.reason?.message ?? wa.reason).slice(0, 300);
    console.warn('hint → WhatsApp:', extra.waError);
  }
  if (Object.keys(extra).length) await store.setJSON(key, { ...hint, ...extra });

  return json(200, { ok: true });
};

export const config = { path: '/api/hint' };
