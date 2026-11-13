// Намёк → шаблон Meta через Kelesu: какой шаблон, параметры, кнопка.
import { kelesuPayload, linkSuffix, sendHintWa } from '../netlify/lib/hintWa.js';

let ok = 0, fail = 0;
const is = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { console.log('  ok ', name); ok++; }
  else { console.log('  FAIL', name, '\n    получено:', g, '\n    ожидали :', w); fail++; }
};

const h = {
  name: 'Ержан', phone: '+77771234567', size: 16.5, ring: 'Sirius Luxe · 1 ct · белое золото',
  link: 'https://taena.neodiamond.kz/product/sirius-luxe/classic/oval?utm_medium=hint&utm_source=ia&ct=1',
};

console.log('\nшаблон:');
is('размер есть → taena_hint', kelesuPayload(h).template_name, 'taena_hint');
is('размера нет → taena_hint_nosize', kelesuPayload({ ...h, size: null }).template_name, 'taena_hint_nosize');
is('номер — только цифры', kelesuPayload(h).phone_number, '77771234567');
is('тело: имя и кольцо', kelesuPayload(h).components[0].parameters.map(p => p.text), ['Ержан', 'Sirius Luxe · 1 ct · белое золото']);
is('без переводов строк', kelesuPayload({ ...h, name: 'Ер\nжан' }).components[0].parameters[0].text, 'Ер жан');

console.log('\nкнопка «Посмотреть её кольцо»:');
const btn = kelesuPayload(h).components[1];
is('кнопка-ссылка №0', [btn.type, btn.sub_type, btn.index], ['button', 'url', '0']);
is('путь кольца с метками', btn.parameters[0].text, 'product/sirius-luxe/classic/oval?utm_medium=hint&utm_source=ia&ct=1');
is('чужой адрес → пусто (кнопка ведёт на главную)', linkSuffix('http://localhost:8900/product/x'), '');

console.log('\nотправка (fetch подменён):');
const calls = [];
delete process.env.KELESU_API_KEY; delete process.env.KELESU_CHANNEL_ID;
globalThis.fetch = async (url, opts) => { calls.push({ url, opts }); return new Response('{"ok":true}', { status: 200 }); };
is('нет ключей — не шлём', await sendHintWa(h), null);
is('и запроса не было', calls.length, 0);
process.env.KELESU_API_KEY = 'k'; process.env.KELESU_CHANNEL_ID = 'ch1';
is('есть ключи — ответ Kelesu', await sendHintWa(h), '{"ok":true}');
is('адрес канала', calls[0].url, 'https://api.kelesu.kz/api/v1/waba/channels/ch1/templates/send-to-phone');
is('ключ в заголовке', calls[0].opts.headers['X-API-Key'], 'k');
globalThis.fetch = async () => new Response('bad template', { status: 400 });
let threw = false; try { await sendHintWa(h); } catch { threw = true; }
is('ошибка Kelesu — исключение', threw, true);

console.log(`\nитого: ${ok} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
