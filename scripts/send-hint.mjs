// Отправить один намёк вручную: шаблон ему в WhatsApp (Kelesu) и сделка в
// amoCRM (инфоцентр, site-lead) — то же, что делает сайт сразу после формы.
// Нужно для намёков, оставленных до подключения, и для повторной отправки.
//
//   node scripts/send-hint.mjs <ключ намёка>          — показать, что уйдёт
//   node scripts/send-hint.mjs <ключ намёка> --send   — отправить
//
// Ключи берутся из ~/.config (Kelesu — neo-diamond-lenta, инфоцентр — neo-diamond-hub) — в процессе,
// на экран не выводятся. Имя и телефон в выводе скрыты.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { kelesuPayload, sendHintWa } from '../netlify/lib/hintWa.js';
import { hubPayload, toHub } from '../netlify/functions/hint.js';

const SITE = '3e62802d-a497-4770-885f-231a79f56e0f';
const [key, flag] = process.argv.slice(2);
if (!key) { console.error('нужен ключ намёка, например 2026-11-13T16:24:43.342Z-0r9iv0'); process.exit(2); }
const send = flag === '--send';

const netlify = (...args) => execFileSync('npx', ['netlify', ...args], {
  encoding: 'utf8', env: { ...process.env, NETLIFY_SITE_ID: SITE }, stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

const h = JSON.parse(netlify('blobs:get', 'nd-hints', key));
const mask = (o) => JSON.stringify(o, null, 1)
  .replaceAll(h.name, h.name[0] + '…')
  .replace(/\d{6,}/g, (d) => '•'.repeat(d.length - 2) + d.slice(-2));

console.log('намёк:', h.ring, '· размер', h.size ?? 'не знает', '· статус', h.status ?? 'new');
if (h.waSentAt) { console.log('WhatsApp уже отправлен', h.waSentAt, '— повторно не шлю'); }
console.log('Kelesu:', mask(kelesuPayload(h)));
if (!h.leadId) console.log('инфоцентр:', mask(hubPayload(h, key)));
else console.log('сделка уже есть:', h.leadId);
if (!send) { console.log('\nпроверка — ничего не отправлено. Отправить: добавьте --send'); process.exit(0); }

// У сайта taena ключи Kelesu секретные — CLI отдаёт их только маской. Копия
// лежит на этом Mac в ~/.config/neo-diamond-lenta (права 600).
process.env.KELESU_API_KEY = readFileSync(`${homedir()}/.config/neo-diamond-lenta/kelesu_key`, 'utf8').trim();
process.env.KELESU_CHANNEL_ID = readFileSync(`${homedir()}/.config/neo-diamond-lenta/kelesu_channel`, 'utf8').trim();
process.env.HUB_SITE_KEY = readFileSync(`${homedir()}/.config/neo-diamond-hub/site_lead_key`, 'utf8').trim();

const [wa, hub] = await Promise.allSettled([
  h.waSentAt ? Promise.resolve(null) : sendHintWa(h),
  h.leadId ? Promise.resolve(h.leadId) : toHub(h, key),
]);

const now = new Date().toISOString();
const next = { ...h };
if (wa.status === 'fulfilled' && wa.value) {
  Object.assign(next, { waSentAt: now, waReply: wa.value, waError: undefined });
  if ((h.status ?? 'new') === 'new') Object.assign(next, { status: 'written', statusAt: now });
}
if (wa.status === 'rejected') next.waError = String(wa.reason?.message ?? wa.reason).slice(0, 300);
if (hub.status === 'fulfilled' && hub.value) next.leadId = hub.value;

netlify('blobs:set', 'nd-hints', key, JSON.stringify(next));

console.log('\nWhatsApp:', wa.status === 'fulfilled' ? (wa.value ? 'отправлен' : 'пропущен (уже был)') : 'ОШИБКА — ' + next.waError);
console.log('amoCRM:', hub.status === 'fulfilled' ? `сделка ${next.leadId}` : 'ОШИБКА — ' + (hub.reason?.message ?? hub.reason));
process.exit(wa.status === 'rejected' || hub.status === 'rejected' ? 1 : 0);
