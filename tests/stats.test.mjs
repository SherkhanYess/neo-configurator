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
  ev('A', 'feed_view'),
  ev('A', 'feed_card_view', { model: 'Neo', position: 1 }),
  ev('A', 'feed_gallery_swipe', { model: 'Neo', shape: 'pear' }),
  ev('A', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }),
  ev('A', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }),
  ev('A', 'product_open', { model: 'Halo', shape: 'oval', category: 'ring' }),
  ev('A', 'config_change', { field: 'carat', value: 2 }),
  ev('A', 'booking_open'),
  ev('A', 'wa_click'),
  ev('B', 'feed_view', {}, 'Astana', { utm_source: 'instagram' }),
  ev('B', 'feed_gallery_swipe', { model: 'Halo', shape: 'oval' }, 'Astana', { utm_source: 'instagram' }),
]);

console.log('rollUp:');
eq('всего событий', day.events, 11);
eq('уникальных сессий', day.sessions, 2);
eq('шаг product_open = 1 сессия, не 3 события', day.funnel.product_open, 1);

eq('дошли до WhatsApp', day.funnel.wa_click, 1);
eq('зашли в ленту', day.funnel.feed_view, 2);
eq('города по сессиям', day.cities, { Almaty: 1, Astana: 1 });
eq('источники', day.utm, { 'Прямой заход': 1, instagram: 1 });
eq('модели по открытиям', day.models, { Neo: 2, Halo: 1 });
eq('огранки', day.shapes, { pear: 3, oval: 2 });
eq('караты', day.carats, { '2': 1 });

// Второй день + слияние
const day2 = rollUp('2026-09-09', [
  ev('C', 'feed_view', {}, 'Almaty'),
  ev('C', 'feed_gallery_swipe', { model: 'Neo', shape: 'pear' }, 'Almaty'),
  ev('C', 'feed_card_view', { model: 'Neo', position: 1 }, 'Almaty'),
  ev('C', 'product_open', { model: 'Neo', shape: 'pear', category: 'ring' }, 'Almaty'),
  ev('C', 'booking_open', {}, 'Almaty'),
]);

const total = mergeDays([day, day2]);
console.log('\nmergeDays:');
eq('сессии сложились', total.sessions, 3);
eq('зашли в ленту всего', total.funnel.feed_view, 3);
eq('дошли до WhatsApp', total.funnel.wa_click, 1);
eq('Алматы за оба дня', total.cities.Almaty, 2);
eq('груша суммарно', total.shapes.pear, 5);

const conv = Object.fromEntries(total.conversion.map(c => [c.step, c.ofTotal]));
const steps = total.conversion.map(c => c.step);
eq('config_change убран из ступеней воронки', steps.includes('config_change'), false);
eq('shape_select убран из ступеней воронки', steps.includes('shape_select'), false);
eq('ступени воронки', steps, ['feed_view','feed_card_view','product_open','wa_click']);
eq('вовлечённость считается отдельно', total.engagement.config_change.sessions, 1);
eq('листание галереи — вовлечённость (A, B, C)', total.engagement.feed_gallery_swipe.sessions, 3);
const over = total.conversion.filter(c => c.ofPrevious > 100).map(c => c.step);
eq('ни одна ступень не даёт >100% от предыдущей', over, []);
console.log('\nворонка (% от зашедших):');
total.conversion.forEach(c => console.log('  ' + c.step.padEnd(15), c.sessions, '→', c.ofTotal + '%', '| от предыдущего', c.ofPrevious + '%'));
eq('конверсия в WhatsApp = 1 из 3', conv.wa_click, 33.3);
eq('верх воронки = 100%', conv.feed_view, 100);

// Пустой диапазон не должен падать
const empty = mergeDays([rollUp('2026-01-01', [])]);
console.log('\nграничный случай:');
eq('нет данных — без деления на ноль', empty.conversion[0].ofTotal, 0);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
