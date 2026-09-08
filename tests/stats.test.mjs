import { rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};

// A смотрит 3 карточки, доходит до WhatsApp. B только зашёл и ушёл.
const ev = (sessionId, event, props = {}, city = 'Almaty', utm = {}) =>
  ({ sessionId, event, props, city, utm });

const day = rollUp('2026-09-08', [
  ev('A', 'session_start'),
  ev('A', 'shape_select', { shape: 'pear' }),
  ev('A', 'catalog_view'),
  ev('A', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }),
  ev('A', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }),
  ev('A', 'product_open', { model: 'Halo', shape: 'oval', category: 'ring' }),
  ev('A', 'config_change', { field: 'carat', value: 2 }),
  ev('A', 'booking_open'),
  ev('A', 'wa_click'),
  ev('B', 'session_start', {}, 'Astana', { utm_source: 'instagram' }),
  ev('B', 'shape_select', { shape: 'oval' }, 'Astana', { utm_source: 'instagram' }),
]);

console.log('rollUp:');
eq('всего событий', day.events, 11);
eq('уникальных сессий', day.sessions, 2);
eq('шаг product_open = 1 сессия, не 3 события', day.funnel.product_open, 1);

eq('дошли до WhatsApp', day.funnel.wa_click, 1);
eq('зашли', day.funnel.session_start, 2);
eq('города по сессиям', day.cities, { Almaty: 1, Astana: 1 });
eq('источники', day.utm, { 'Прямой заход': 1, instagram: 1 });
eq('модели по открытиям', day.models, { Neo: 2, Halo: 1 });
eq('огранки', day.shapes, { pear: 3, oval: 2 });
eq('караты', day.carats, { '2': 1 });

// Второй день + слияние
const day2 = rollUp('2026-09-09', [
  ev('C', 'session_start', {}, 'Almaty'),
  ev('C', 'shape_select', { shape: 'pear' }, 'Almaty'),
  ev('C', 'catalog_view', {}, 'Almaty'),
  ev('C', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }, 'Almaty'),
  ev('C', 'booking_open', {}, 'Almaty'),
]);

const total = mergeDays([day, day2]);
console.log('\nmergeDays:');
eq('сессии сложились', total.sessions, 3);
eq('зашли всего', total.funnel.session_start, 3);
eq('дошли до WhatsApp', total.funnel.wa_click, 1);
eq('Алматы за оба дня', total.cities.Almaty, 2);
eq('груша суммарно', total.shapes.pear, 5);

const conv = Object.fromEntries(total.conversion.map(c => [c.step, c.ofTotal]));
const steps = total.conversion.map(c => c.step);
eq('config_change убран из ступеней воронки', steps.includes('config_change'), false);
eq('ступени воронки', steps, ['session_start','shape_select','catalog_view','product_open','booking_open','wa_click']);
eq('вовлечённость считается отдельно', total.engagement.config_change.sessions, 1);
const over = total.conversion.filter(c => c.ofPrevious > 100).map(c => c.step);
eq('ни одна ступень не даёт >100% от предыдущей', over, []);
console.log('\nворонка (% от зашедших):');
total.conversion.forEach(c => console.log('  ' + c.step.padEnd(15), c.sessions, '→', c.ofTotal + '%', '| от предыдущего', c.ofPrevious + '%'));
eq('конверсия в WhatsApp = 1 из 3', conv.wa_click, 33.3);
eq('верх воронки = 100%', conv.session_start, 100);

// Пустой диапазон не должен падать
const empty = mergeDays([rollUp('2026-01-01', [])]);
console.log('\nграничный случай:');
eq('нет данных — без деления на ноль', empty.conversion[0].ofTotal, 0);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
