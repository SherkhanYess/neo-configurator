// Люди, которые нажали «Смотреть все украшения», не выбирая огранку, —
// нормальный путь, а не отвал. Проверяем, что воронка так их и считает.
import { rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};
const ev = (sessionId, event, props = {}) => ({ sessionId, event, props, city: 'Almaty', utm: {} });

// SKIP пропустил выбор огранки и дошёл до конца. PICK выбрал огранку и застрял на витрине.
const day = rollUp('2026-09-10', [
  ev('SKIP', 'session_start'),
  ev('SKIP', 'catalog_view'),
  ev('SKIP', 'product_open', { model: 'Sirius', shape: 'round', category: 'ring' }),
  ev('SKIP', 'booking_open'),
  ev('SKIP', 'wa_click'),

  ev('PICK', 'session_start'),
  ev('PICK', 'shape_select', { shape: 'pear' }),
  ev('PICK', 'catalog_view'),
]);
const total = mergeDays([day]);
const conv = Object.fromEntries(total.conversion.map(c => [c.step, c]));

console.log('воронка:');
total.conversion.forEach(c => console.log('  ' + c.step.padEnd(15), c.sessions, '→', c.ofTotal + '%', '| от предыдущего', c.ofPrevious + '%'));

console.log('\nпроверки:');
eq('выбор огранки — не ступень воронки',
   total.conversion.map(c => c.step).includes('shape_select'), false);
eq('до витрины дошли оба', conv.catalog_view.sessions, 2);
eq('витрина = 100% от зашедших', conv.catalog_view.ofPrevious, 100);
eq('карточку открыл один из двух', conv.product_open.ofPrevious, 50);
eq('выбор огранки — отдельный показатель', total.engagement.shape_select.sessions, 1);

// Глубина просмотра: отличает «посмотрел одну и ушёл» от «сравнивал восемь».
console.log('\nглубина просмотра:');
eq('SKIP открыл 1 карточку', total.depth?.['1'], 1);
eq('никто не открывал 2–3', total.depth?.['2-3'], undefined);
eq('среднее по открывавшим', total.avgCardsPerSession, 1);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
