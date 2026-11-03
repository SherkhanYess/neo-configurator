// Админка витрины: что сервер пропускает в документы ленты и отзывов и как
// статистика раскладывает обращения по моделям.
import { cleanFeed, cleanReviews } from '../netlify/functions/content.js';
import { rollUp, mergeDays } from '../netlify/functions/stats.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};

console.log('документ ленты:');
const feed = cleanFeed({
  intro: { title: '  Кольца  ', sub: 'x'.repeat(500) },
  models: [
    { key: 'Sirius|classic', text: 'Текст', photo: '/api/media/abc-12.webp', tone: '#1a2b3c', focus: { x: 140, y: -5 } },
    { key: 'Sirius|classic', text: 'дубль' },
    { key: 'Evil|<script>', text: 'нет' },
    { key: 'Neo|halo', photo: 'https://evil.example/x.jpg', tone: 'red' },
  ],
  breaks: [{ title: 'На руке', after: 99, photo: '/assets/feed/hand-1.webp' }],
});
eq('заголовок обрезан по краям', feed.intro.title, 'Кольца');
eq('подзаголовок не длиннее 120', feed.intro.sub.length, 120);
eq('дубль и чужой ключ отброшены', feed.models.map(m => m.key), ['Sirius|classic', 'Neo|halo']);
eq('цвет — заглавными', feed.models[0].tone, '#1A2B3C');
eq('фокус зажат в 0–100', feed.models[0].focus, { x: 100, y: 0 });
eq('чужой адрес фото не принят', feed.models[1].photo, null);
eq('не-hex цвет не принят', feed.models[1].tone, null);
eq('пауза не дальше 40-й модели', feed.breaks[0].after, 40);
eq('фото паузы из /assets/feed принято', feed.breaks[0].photo, '/assets/feed/hand-1.webp');

console.log('отзывы:');
const rev = cleanReviews({ items: [
  { name: 'Айгерим', text: 'Помогли выбрать', url: 'https://2gis.kz/almaty/firm/1/tab/reviews' },
  { name: 'Без ссылки', text: 'Текст', url: '' },
  { name: 'Чужая ссылка', text: 'Текст', url: 'https://example.com/2gis.kz/' },
] });
eq('сохраняется только отзыв со ссылкой на 2ГИС', rev.items.map(r => r.name), ['Айгерим']);

console.log('статистика по моделям:');
const ev = (sessionId, event, props = {}) => ({ sessionId, event, props, utm: {} });
const day = rollUp('2026-11-03', [
  ev('A', 'feed_card_view', { model: 'Sirius', cast: 'halo' }),
  ev('A', 'product_open', { model: 'Sirius', cast: 'halo' }),
  ev('A', 'product_open', { model: 'Sirius', cast: 'halo' }),
  ev('A', 'wa_click', { model: 'Sirius', cast: 'halo', type: 'price' }),
  ev('B', 'product_open', { model: 'Sirius', cast: 'halo' }),
  ev('B', 'hint_submit', { model: 'Sirius', cast: 'halo' }),
  ev('C', 'product_open', { model: 'Sirius', cast: 'classic' }),
  ev('C', 'wa_click', { model: 'Sirius', cast: 'classic', type: 'fitting' }),
]);
eq('Sirius с ореолом отдельно от классики', Object.keys(day.perModel).sort(), ['Sirius|classic', 'Sirius|halo']);
eq('визиты, а не нажатия', day.perModel['Sirius|halo'], { seen: 1, open: 2, wa: 1, hint: 1 });
eq('с какой кнопки', day.waTypes, { price: 1, fitting: 1 });
const total = mergeDays([day, day]);
eq('дни складываются', total.perModel['Sirius|halo'].open, 4);

console.log(`\nитого: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
