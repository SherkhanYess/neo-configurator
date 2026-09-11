// Каждое событие, которое шлёт каталог, должно где-то учитываться.
// Эта проверка ловит случай, когда кнопку переименовали, а сервер остался
// со старым именем — и ступень воронки молча обнулилась.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};

// Имена событий из клиента
const trackSrc = readFileSync('src/catalog/lib/track.js', 'utf8');
const CLIENT = [...trackSrc.matchAll(/^\s+[A-Z_]+:\s*'([a-z_]+)'/gm)].map(m => m[1]);

// Какие имена сервер принимает и какие агрегирует
const fnSrc = readFileSync('netlify/functions/track.js', 'utf8');
const ALLOWED = [...fnSrc.matchAll(/^\s+'([a-z_]+)',$/gm)].map(m => m[1]);
const statsSrc = readFileSync('netlify/functions/stats.js', 'utf8');

console.log('клиент шлёт ' + CLIENT.length + ' событий');

const notAllowed = CLIENT.filter(e => !ALLOWED.includes(e));
eq('все события проходят белый список сервера', notAllowed, []);

// Агрегируется = в FUNNEL, в ENGAGEMENT, в алиасе или в отдельном разрезе
const aggregated = (e) =>
  new RegExp(`'${e}'`).test(statsSrc) || new RegExp(`${e}:`).test(statsSrc);
const notAggregated = CLIENT.filter(e => !aggregated(e));
eq('все события где-то агрегируются', notAggregated, []);

// Поведенческая проверка: новая кнопка WhatsApp закрывает воронку
const ev = (sid, event, props = {}) => ({ sessionId: sid, event, props, city: 'Almaty', utm: {} });
const day = rollUp('2026-09-12', [
  ev('A', 'session_start'),
  ev('A', 'catalog_view'),
  ev('A', 'product_open', { model: 'Neo', shape: 'round', category: 'ring' }),
  ev('A', 'booking_open'),
  ev('A', 'booking_whatsapp_click', { city: 'Астана' }),   // новое имя
  ev('B', 'session_start'),
  ev('B', 'wa_click'),                                      // историческое имя
  ev('C', 'session_start'),
  ev('C', 'booking_share_click'),
  ev('C', 'booking_share_success'),
  ev('C', 'booking_other_models_click'),
  ev('C', 'faq_open', { question: 11 }),
  ev('C', 'faq_open', { question: 1 }),
  ev('D', 'faq_open', { question: 11 }),
]);
const t = mergeDays([day]);

console.log('\nворонка и действия:');
eq('новое имя кнопки закрывает воронку', t.funnel.wa_click, 2);
eq('поделились — 1 сессия',              t.engagement.booking_share_click.sessions, 1);
eq('успешная отправка — 1 сессия',       t.engagement.booking_share_success.sessions, 1);
eq('ушли смотреть другие модели — 1',    t.engagement.booking_other_models_click.sessions, 1);
eq('вопрос 11 раскрыли дважды',          t.faq['11'], 2);
eq('вопрос 1 раскрыли один раз',         t.faq['1'], 1);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
