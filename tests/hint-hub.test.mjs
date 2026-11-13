// Намёк → инфоцентр (site-lead): тело запроса по договорённости с хабом.
import { hubPayload, hubCity, toHub, HUB_SITE_LEAD_URL } from '../netlify/functions/hint.js';

let ok = 0, fail = 0;
const is = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { console.log('  ok ', name); ok++; }
  else { console.log('  FAIL', name, '\n    получено:', g, '\n    ожидали :', w); fail++; }
};

const h = {
  at: '2026-11-14T10:00:00.000Z', name: 'Ержан', phone: '+77771234567', size: 16.5,
  ring: 'Sirius Luxe · 1 ct · белое золото', link: 'https://taena.neodiamond.kz/product/x?utm_medium=hint',
  code: '[T·ia-НМ·m]', city: 'Алматы',
};

console.log('\nтело для site-lead:');
is('все поля', hubPayload(h, 'k1'), {
  type: 'hint', code: '[T·ia-НМ·m]', name: 'Ержан', phone: '+77771234567',
  ring: 'Sirius Luxe · 1 ct · белое золото', link: 'https://taena.neodiamond.kz/product/x?utm_medium=hint',
  size: '16.5', city: 'almaty', hint_id: 'k1',
});
is('размер не знает → null', hubPayload({ ...h, size: null }, 'k').size, null);
is('размер целый → строка', hubPayload({ ...h, size: 17 }, 'k').size, '17');
is('Астана', hubCity('Астана'), 'astana');
is('пустой город → null', hubCity(''), null);
is('неизвестный город → null', hubCity('Шымкент'), null);
is('адрес инфоцентра', HUB_SITE_LEAD_URL, 'https://kpsvtmryzzjwtkmlnruy.supabase.co/functions/v1/site-lead');

console.log('\nотправка (fetch подменён, в сеть ничего не уходит):');
const calls = [];
const reply = (status, body) => async (url, opts) => { calls.push({ url, opts }); return new Response(JSON.stringify(body), { status }); };

delete process.env.HUB_SITE_KEY;
globalThis.fetch = reply(200, { ok: true, lead_id: 1 });
is('нет ключа — не отправляем', await toHub(h, 'k1'), null);
is('и запроса не было', calls.length, 0);

process.env.HUB_SITE_KEY = 'test-key';
globalThis.fetch = reply(200, { ok: true, lead_id: 555, contact_id: 7, duplicate: false });
is('ответ — номер сделки', await toHub(h, 'k1'), 555);
is('адрес', calls[0].url, HUB_SITE_LEAD_URL);
is('ключ в заголовке', calls[0].opts.headers['x-site-key'], 'test-key');
is('тело', JSON.parse(calls[0].opts.body).hint_id, 'k1');
is('с таймаутом', calls[0].opts.signal instanceof AbortSignal, true);

globalThis.fetch = reply(500, { error: 'amo' });
let threw = false; try { await toHub(h, 'k1'); } catch { threw = true; }
is('ошибка инфоцентра — исключение (форма его ловит)', threw, true);

globalThis.fetch = reply(200, { ok: false });
threw = false; try { await toHub(h, 'k1'); } catch { threw = true; }
is('ok:false — тоже ошибка', threw, true);
delete process.env.HUB_SITE_KEY;

console.log(`\nитого: ${ok} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
