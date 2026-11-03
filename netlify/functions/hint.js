// Netlify Function v2: hint
//
// «Намекнуть партнёру»: она оставляет его имя и номер и свой размер кольца.
// Менеджер пишет ему в WhatsApp одно сообщение с ссылкой на кольцо; размер в
// сообщение не идёт — чтобы узнать его, он пишет нам сам.
//
// Каждый намёк сохраняется в Blobs (store nd-hints) — это журнал, из которого
// его видно, даже если CRM недоступна. Если включено HINT_TO_AMO=1 и заданы
// ключи amoCRM, намёк ещё и создаётся сделкой с контактом парня. На песочнице
// флаг не ставится: тестовые намёки не должны попадать в рабочую воронку.
//
// GET с ADMIN_TOKEN отдаёт последние намёки — для проверки без CRM.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

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

async function toAmo(h) {
  const domain = process.env.AMO_DOMAIN;
  const token  = process.env.AMO_LONG_TOKEN;
  if (process.env.HINT_TO_AMO !== '1' || !domain || !token) return null;

  const base = `https://${domain}.amocrm.ru/api/v4`;
  const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const contact = await fetch(`${base}/contacts`, {
    method: 'POST', headers: hdrs,
    body: JSON.stringify([{ name: h.name, custom_fields_values: [{ field_code: 'PHONE', values: [{ value: h.phone, enum_code: 'WORK' }] }] }]),
  }).then(r => (r.ok ? r.json() : null));
  const contactId = contact?._embedded?.contacts?.[0]?.id;

  const lead = await fetch(`${base}/leads`, {
    method: 'POST', headers: hdrs,
    body: JSON.stringify([{
      name: `Намёк — ${h.ring} — ${h.name}`,
      ...(contactId ? { _embedded: { contacts: [{ id: contactId }] } } : {}),
    }]),
  }).then(r => (r.ok ? r.json() : null));
  const leadId = lead?._embedded?.leads?.[0]?.id;

  if (leadId) {
    const text = [
      `Намёк от девушки ${h.code}`,
      `Кольцо: ${h.ring}`,
      h.size ? `Её размер: ${h.size} — говорим, только когда он напишет сам` : 'Размер она не знает — зовём их вдвоём на примерку',
      `Ссылка для него: ${h.link}`,
    ].join('\n');
    await fetch(`${base}/leads/${leadId}/notes`, {
      method: 'POST', headers: hdrs,
      body: JSON.stringify([{ note_type: 'common', params: { text } }]),
    }).catch(() => {});
  }
  return leadId ?? null;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });

  const store = getStore({ name: 'nd-hints', context });

  if (req.method === 'GET') {
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) return json(401, { error: 'unauthorized' });
    const { blobs } = await store.list();
    const latest = blobs.map(b => b.key).sort().reverse().slice(0, 50);
    const items = await Promise.all(latest.map(k => store.get(k, { type: 'json' })));
    return json(200, items.filter(Boolean));
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

  await store.setJSON(`${hint.at}-${Math.random().toString(36).slice(2, 8)}`, hint);

  let leadId = null;
  try { leadId = await toAmo(hint); } catch (e) { console.warn('hint → amo failed:', e); }

  return json(200, { ok: true, leadId });
};

export const config = { path: '/api/hint' };
