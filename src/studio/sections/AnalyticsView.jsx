import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, ErrorNote, Loading, PageHead, Toggle } from '../ui.jsx';
import { STAFF_KEY } from '../../catalog/lib/track.js';
import { SERIES, BarList, FunnelChart, TrendChart, TrendTable } from '../charts.jsx';
import { UTM_LABELS } from '../utm.js';
import { FAQ_GROUPS } from '../../catalog/components/Faq.jsx';
import { fetchProducts, ringName } from '../../catalog/data/products.js';

// Раздел «Аналитика»: новая воронка витрины.
//
//   лента → досмотрели карточку → открыли модель → написали в WhatsApp
//                                             └→ отправила намёк
//
// Шаги считаются по уникальным визитам: один человек, открывший десять
// моделей, — один человек. Фильтр по источнику пересчитывает всю страницу,
// включая воронку и таблицу моделей.

const STEP_LABELS = {
  feed_view:      'Зашли в ленту',
  feed_card_view: 'Досмотрели хотя бы одну карточку',
  product_open:   'Открыли модель',
  wa_click:       'Написали в WhatsApp',
};

const WA_LABELS = {
  price:   '«Понравилось кольцо?»',
  hint:    'Пришёл по ссылке-намёку',
  custom:  'Кольцо по своему дизайну',
  fitting: 'Живой показ',
  help:    '«Остались вопросы?»',
  other:   'Прочее',
};

const SHAPE_LABELS = {
  round: 'Круглый', princess: 'Принцесса', radiant: 'Радиант', cushion: 'Кушон',
  oval: 'Овал', pear: 'Груша', heart: 'Сердце', marquise: 'Маркиз',
  emerald: 'Изумруд', asscher: 'Ашер',
};

const FAQ_LABELS = (() => {
  let n = 0;
  const out = {};
  for (const g of FAQ_GROUPS) for (const item of g.items) out[String(++n)] = `${n}. ${item.q}`;
  return out;
})();

const RANGES = [
  { id: 'today', label: 'Сегодня', days: 0 },
  { id: '7',     label: '7 дней',  days: 6 },
  { id: '30',    label: '30 дней', days: 29 },
  { id: '90',    label: '90 дней', days: 89 },
];

const TREND = (unit) => [
  { key: 'visits',   title: unit === 'people' ? 'Люди' : 'Визиты', color: SERIES[1] },
  { key: 'contacts', title: 'Обращения (WhatsApp и намёки)', color: SERIES[2] },
];

const ALL = '__all__';

const UNITS = [
  { id: 'people', label: 'Люди',   hint: 'Один человек за период — один раз, сколько бы раз он ни заходил' },
  { id: 'visits', label: 'Визиты', hint: 'Каждый заход отдельно: вечером и утром — два визита' },
];

function readStaff() {
  try { return localStorage.getItem(STAFF_KEY) === '1'; } catch { return false; }
}

/** Свой браузер не попадает в статистику — переключатель для этого браузера. */
function StaffSwitch() {
  const [on, setOn] = useState(readStaff);
  const set = (v) => {
    try { if (v) localStorage.setItem(STAFF_KEY, '1'); else localStorage.removeItem(STAFF_KEY); } catch { /* приватный режим */ }
    setOn(v);
  };
  return (
    <Card>
      <div className="st-switchrow">
        <div>
          <b>Не учитывать этот браузер</b>
          <small>
            Включается само при входе в админку. Менеджерам — один раз войти в админку с рабочего телефона
            и компьютера по адресу сайта. Заходы из встроенного браузера Instagram всё равно посчитаются:
            у него своя память.
          </small>
        </div>
        <Toggle on={on} onChange={set} label="Не учитывать этот браузер" />
      </div>
    </Card>
  );
}
const isoDaysAgo = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%`.replace('.', ',') : '—');
const fmt = (n) => Number(n ?? 0).toLocaleString('ru-KZ');

function ModelTable({ perModel, products }) {
  const rows = Object.entries(perModel ?? {})
    .map(([key, v]) => {
      const [shank, cast] = key.split('|');
      return { key, name: products ? ringName(products, shank, cast) : key.replace('|', ' · '), ...v, contacts: v.wa + v.hint };
    })
    .sort((a, b) => b.contacts - a.contacts || b.open - a.open);

  if (!rows.length) return <p className="st-muted">Модели ещё не открывали за этот период.</p>;
  const maxOpen = Math.max(...rows.map(r => r.open), 1);

  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <thead>
          <tr>
            <th>Модель</th>
            <th className="num" title="Карточка в ленте была на экране дольше секунды">Видели в ленте</th>
            <th className="num">Открыли</th>
            <th className="num">WhatsApp</th>
            <th className="num">Намёки</th>
            <th className="num" title="WhatsApp и намёки от тех, кто открыл модель">Конверсия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key}>
              <td>
                <span className="st-table__name">{r.name}</span>
                <span className="st-table__bar" style={{ width: `${(r.open / maxOpen) * 100}%` }} />
              </td>
              <td className="num">{fmt(r.seen)}</td>
              <td className="num">{fmt(r.open)}<small>{r.seen ? ` · ${pct(r.open, r.seen)}` : ''}</small></td>
              <td className="num">{fmt(r.wa)}</td>
              <td className="num">{fmt(r.hint)}</td>
              <td className="num"><b>{pct(r.contacts, r.open)}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsView() {
  const [range, setRange] = useState('7');
  const [unit, setUnit] = useState('people');
  const [source, setSource] = useState(ALL);
  const [asTable, setAsTable] = useState(false);
  const [result, setResult] = useState({ range: null, data: null, error: '' });
  const [products, setProducts] = useState(null);

  useEffect(() => { fetchProducts().then(setProducts).catch(() => {}); }, []);

  // Прежний ответ остаётся на экране (приглушённым), пока считается новый.
  useEffect(() => {
    let alive = true;
    const cfg = RANGES.find(r => r.id === range) ?? RANGES[1];
    api(`/api/stats?from=${isoDaysAgo(cfg.days)}&to=${isoDaysAgo(0)}`)
      .then(data => { if (alive) setResult({ range, data, error: '' }); })
      .catch(e => { if (alive) setResult(r => ({ ...r, range, error: e.message })); });
    return () => { alive = false; };
  }, [range]);

  const { data, error } = result;
  const loading = result.range !== range;

  const sources = useMemo(() => {
    const by = data?.total?.bySource ?? {};
    return Object.keys(by).sort((a, b) => (by[b]?.sessions ?? 0) - (by[a]?.sessions ?? 0));
  }, [data]);

  const view = source === ALL ? data?.total : data?.total?.bySource?.[source];

  const daily = useMemo(() => (data?.daily ?? []).map(d => {
    const src = source === ALL ? d : (d.bySource?.[source] ?? { funnel: {} });
    return {
      day: d.day,
      visits: unit === 'people' ? (src.people?.visitors ?? 0) : (src.funnel?.session_start ?? 0),
      contacts: (src.funnel?.wa_click ?? 0) + (src.funnel?.hint_submit ?? 0),
    };
  }), [data, source, unit]);

  // Люди или визиты — меняет все цифры воронки сразу.
  const people = unit === 'people' ? view?.people : null;
  const f = people?.funnel ?? view?.funnel ?? {};
  const conversion = people?.conversion ?? view?.conversion ?? [];
  const sessions = view?.funnel?.session_start ?? 0;
  const visits = people ? (people.funnel.session_start || people.visitors) : sessions;
  const wa = f.wa_click ?? 0;
  const hints = f.hint_submit ?? 0;
  const opened = f.product_open ?? 0;
  const unitWord = people ? 'людей' : 'визитов';

  return (
    <div className="st-stats">
      <PageHead title="Аналитика" sub="Путь покупателя по витрине: от ленты до обращения. «Люди» — каждый человек один раз за период, «Визиты» — каждый заход." />

      <div className="st-filters">
        <div className="st-chips">
          {RANGES.map(r => (
            <button key={r.id} type="button" className={`st-chip${range === r.id ? ' is-on' : ''}`} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
        <div className="st-chips" role="group" aria-label="Что считать">
          {UNITS.map(u => (
            <button key={u.id} type="button" title={u.hint} className={`st-chip${unit === u.id ? ' is-on' : ''}`} onClick={() => setUnit(u.id)}>{u.label}</button>
          ))}
        </div>
        <label className="st-filters__src">
          <span>Источник</span>
          <select className="st-input st-input--s" value={source} onChange={e => setSource(e.target.value)}>
            <option value={ALL}>Все источники</option>
            {sources.map(s => <option key={s} value={s}>{UTM_LABELS[s] ?? s} · {data.total.bySource[s].sessions}</option>)}
          </select>
        </label>
      </div>

      <ErrorNote>{error}</ErrorNote>
      {loading && !view && <Loading label="Считаем…" />}

      {view && (
        <div className={`st-stats__body${loading ? ' is-loading' : ''}`}>
          <div className="st-kpis">
            {people ? (
              <div className="st-kpi"><span>Люди</span><b>{fmt(visits)}</b>
                <small>визитов: {fmt(sessions)} · новых {fmt(people.new)}, вернулись {fmt(people.returning)}</small></div>
            ) : (
              <div className="st-kpi"><span>Визиты</span><b>{fmt(visits)}</b><small>{data.from === data.to ? data.from : `${data.from} — ${data.to}`}</small></div>
            )}
            <div className="st-kpi"><span>Открыли модель</span><b>{fmt(opened)}</b><small>{pct(opened, visits)} {unitWord} · в среднем {String(view.avgCardsPerSession ?? 0).replace('.', ',')} модели за визит</small></div>
            <div className="st-kpi is-accent"><span>Написали в WhatsApp</span><b>{fmt(wa)}</b><small>{pct(wa, visits)} {unitWord}</small></div>
            <div className="st-kpi is-accent"><span>Намёки</span><b>{fmt(hints)}</b><small>открыли форму: {fmt(f.hint_open ?? 0)}</small></div>
          </div>

          <Card title="Динамика" aside={
            <button type="button" className="st-textbtn" onClick={() => setAsTable(v => !v)}>{asTable ? 'Графиком' : 'Таблицей'}</button>
          }>
            {asTable ? <TrendTable daily={daily} series={TREND(unit)} /> : <TrendChart daily={daily} series={TREND(unit)} />}
          </Card>

          <div className="st-grid st-grid--2">
            <Card title="Воронка">
              <FunnelChart conversion={conversion} labels={STEP_LABELS} />
              <p className="st-note">
                Намёк — отдельная ветка от «Открыли модель»: {fmt(hints)} {hints === 1 ? 'намёк' : 'намёков'},
                это {pct(hints, opened)} от открывших модель.
              </p>
            </Card>
            <Card title="С какой кнопки пишут">
              <BarList rows={Object.entries(view.waTypes ?? {})} labels={WA_LABELS} unit="раз" empty="В WhatsApp ещё не переходили" />
              <p className="st-note">Показывает, какой блок страницы модели продаёт. Считаются нажатия.</p>
            </Card>
          </div>

          <Card title="Модели: от ленты до обращения">
            <ModelTable perModel={view.perModel} products={products} />
          </Card>

          <div className="st-grid st-grid--3">
            <Card title="Источники"><BarList rows={Object.entries(data.total?.utm ?? {})} labels={UTM_LABELS} unit="виз." /></Card>
            <Card title="Огранки"><BarList rows={Object.entries(view.shapes ?? {})} labels={SHAPE_LABELS} /></Card>
            <Card title="Каратность"><BarList rows={Object.entries(view.carats ?? {})} labels={Object.fromEntries(Object.keys(view.carats ?? {}).map(k => [k, `${k.replace('.', ',')} ct`]))} unit="раз" empty="Каратность ещё не меняли" /></Card>
          </div>

          <div className="st-grid st-grid--2">
            <Card title="Какие вопросы открывают">
              <BarList rows={Object.entries(view.faq ?? {})} labels={FAQ_LABELS} unit="раз" empty="Вопросы ещё не раскрывали" />
            </Card>
            <Card title="Города"><BarList rows={Object.entries(view.cities ?? {})} unit="виз." empty="Город определяется автоматически" /></Card>
          </div>

          <StaffSwitch />

          <p className="st-note st-note--foot">
            Считается только витрина /catalog — конструктор живёт отдельно. «Люди» — анонимный номер браузера: с телефона и компьютера
            один человек посчитается дважды, а люди до сегодняшнего обновления — по визитам. Таблица моделей, источники и города — по визитам.
            «Источники» всегда показывают весь период целиком и не зависят от фильтра.
            Те же переходы в WhatsApp и намёки уходят в Meta как события «Contact» и «Lead» — только с боевого сайта.
          </p>
        </div>
      )}
    </div>
  );
}
