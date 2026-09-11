// Метка должна различать площадку и размещение: шапка профиля и сторис —
// разные вопросы, и в одну строку сливаться не должны.
import { utmKey, rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};

console.log('utmKey:');
eq('площадка и размещение вместе', utmKey({ utm_source: 'instagram', utm_medium: 'bio' }), 'instagram / bio');
eq('сторис — отдельная строка',    utmKey({ utm_source: 'instagram', utm_medium: 'stories' }), 'instagram / stories');
eq('без medium — только источник', utmKey({ utm_source: 'google' }), 'google');
eq('пусто → прямой заход',         utmKey({}), 'Прямой заход');
eq('нет объекта → прямой заход',   utmKey(undefined), 'Прямой заход');
eq('пробелы не создают источник',  utmKey({ utm_source: '   ' }), 'Прямой заход');
eq('пробелы в medium отбрасываются', utmKey({ utm_source: 'instagram', utm_medium: '  ' }), 'instagram');

console.log('\nразные размещения одной площадки не сливаются:');
const ev = (sid, event, utm) => ({ sessionId: sid, event, props: {}, city: 'Almaty', utm });
const day = rollUp('2026-09-11', [
  ev('A', 'session_start', { utm_source: 'instagram', utm_medium: 'bio' }),
  ev('B', 'session_start', { utm_source: 'instagram', utm_medium: 'bio' }),
  ev('C', 'session_start', { utm_source: 'instagram', utm_medium: 'stories' }),
  ev('D', 'session_start', {}),
]);
eq('шапка профиля — 2 сессии', day.utm['instagram / bio'], 2);
eq('сторис — 1 сессия',        day.utm['instagram / stories'], 1);
eq('прямой заход — 1',         day.utm['Прямой заход'], 1);
eq('строк ровно три',          Object.keys(day.utm).length, 3);

const total = mergeDays([day]);
eq('после слияния разрезы целы', total.utm['instagram / bio'], 2);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
