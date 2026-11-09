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

console.log('люди, а не визиты:');
const pv = (sessionId, visitorId, event, firstVisit = false) => ({ sessionId, visitorId, firstVisit, event, props: {}, utm: {} });
const mon = rollUp('2026-11-02', [
  pv('s1', 'anna', 'session_start', true), pv('s1', 'anna', 'feed_view', true),
  pv('s2', 'bek', 'session_start', true),
]);
const wed = rollUp('2026-11-04', [
  pv('s3', 'anna', 'session_start'), pv('s3', 'anna', 'feed_view'), pv('s3', 'anna', 'product_open'), pv('s3', 'anna', 'wa_click'),
  pv('s4', 'anna', 'session_start'),
  { sessionId: 'old', event: 'session_start', props: {}, utm: {} },
]);
const week = mergeDays([mon, wed]);
eq('визитов 5', week.funnel.session_start, 5);
eq('людей 3: Анна дважды за неделю — один человек, старое событие без номера — отдельно', week.people.visitors, 3);
eq('новые — по первому заходу', week.people.new, 2);
eq('вернувшихся нет: Анна и Бек впервые на этой неделе', week.people.returning, 0);
eq('написали в WhatsApp — 1 человек из 3', week.people.conversion.find(c => c.step === 'wa_click').ofTotal, 33.3);
const back = mergeDays([wed]);
eq('в среду Анна — вернувшаяся', back.people.returning, 1);
eq('номера не уходят в ответ', 'peopleIds' in week, false);

console.log('гиды:');
const ge = (sid, event, props) => ({ sessionId: sid, event, props, utm: {} });
const gday = rollUp('2026-11-09', [
  ge('a', 'guide_open', { guide: 'kak-ugadat-kolco', from: 'feed' }),
  ge('a', 'guide_view', { guide: 'kak-ugadat-kolco' }),
  ge('a', 'guide_view', { guide: 'kak-ugadat-kolco' }),               // вернулся к статье — та же сессия
  ge('a', 'guide_read', { guide: 'kak-ugadat-kolco', seconds: 140 }),
  ge('a', 'wa_click', { guide: 'kak-ugadat-kolco', type: 'help' }),
  ge('b', 'guide_view', { guide: 'kak-ugadat-kolco' }),                // пришёл из рекламы, не дочитал
  ge('c', 'guide_view', { guide: 'kolco-za-5-minut' }),
  ge('c', 'guide_cta', { guide: 'kolco-za-5-minut', target: 'catalog' }),
  ge('c', 'guide_cta', { guide: 'kolco-za-5-minut', target: 'checklist_done' }), // не переход в каталог
  ge('d', 'wa_click', { type: 'price' }),                               // не из гида
]);
eq('гид 1: открыли 1, читали 2, дочитали 1, написали 1', gday.perGuide['kak-ugadat-kolco'], { open: 1, view: 2, read: 1, cta: 0, wa: 1 });
eq('гид 2: в каталог 1, чек-лист не считается переходом', gday.perGuide['kolco-za-5-minut'].cta, 1);
eq('WhatsApp без гида в гиды не попадает', Object.keys(gday.perGuide).length, 2);
eq('дни по гидам складываются', mergeDays([gday, gday]).perGuide['kak-ugadat-kolco'].view, 4);

console.log(`\nитого: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
