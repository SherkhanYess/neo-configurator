// Человек, который открыл модель, не задержавшись ни на одной карточке ленты,
// — нормальный путь, а не отвал: карточка засчитывается только через секунду
// просмотра, и быстрый тап по галерее её не фиксирует. Проверяем, что воронка
// не превращает это в отрицательный переход.
import { rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};
const ev = (sessionId, event, props = {}) => ({ sessionId, event, props, city: 'Almaty', utm: {} });

// FAST пролистал и сразу открыл модель. SLOW задержался на карточке и ушёл.
const day = rollUp('2026-09-10', [
  ev('FAST', 'feed_view'),
  ev('FAST', 'feed_card_view', { model: 'Sirius', position: 1 }),
  ev('FAST', 'product_open', { model: 'Sirius', shape: 'round', category: 'ring' }),
  ev('FAST', 'wa_click'),

  ev('SLOW', 'feed_view'),
  ev('SLOW', 'feed_gallery_swipe', { model: 'Halo', shape: 'pear' }),
  ev('SLOW', 'feed_card_view', { model: 'Halo', position: 3 }),
]);
const total = mergeDays([day]);
const conv = Object.fromEntries(total.conversion.map(c => [c.step, c]));

console.log('воронка:');
total.conversion.forEach(c => console.log('  ' + c.step.padEnd(15), c.sessions, '→', c.ofTotal + '%', '| от предыдущего', c.ofPrevious + '%'));

console.log('\nпроверки:');
eq('листание галереи — не ступень воронки',
   total.conversion.map(c => c.step).includes('feed_gallery_swipe'), false);
eq('до карточки дошли оба', conv.feed_card_view.sessions, 2);
eq('карточка = 100% от зашедших в ленту', conv.feed_card_view.ofPrevious, 100);
eq('карточку открыл один из двух', conv.product_open.ofPrevious, 50);
eq('листание галереи — отдельный показатель', total.engagement.feed_gallery_swipe.sessions, 1);

// Глубина просмотра: отличает «посмотрел одну и ушёл» от «сравнивал восемь».
console.log('\nглубина просмотра:');
eq('SKIP открыл 1 карточку', total.depth?.['1'], 1);
eq('никто не открывал 2–3', total.depth?.['2-3'], undefined);
eq('среднее по открывавшим', total.avgCardsPerSession, 1);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
