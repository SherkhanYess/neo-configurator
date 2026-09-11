import { useState, useEffect, useCallback, useMemo } from 'react';
import UtmLinks, { UTM_LABELS } from './UtmLinks.jsx';
import { SERIES, StatTile, BarList, FunnelChart, TrendChart, TrendTable } from './charts.jsx';
import { FAQ_GROUPS } from '../components/Faq.jsx';

// Desktop dashboard for /catalog. Built for a laptop screen on purpose — it is
// an internal tool read while working, not something to thumb through on a phone.
//
// Every funnel figure counts DISTINCT SESSIONS: one visitor opening ten cards is
// one person, not ten.

const C = {
  surface:  '#FFFFFF',
  edge:     '#DBE2EB',
  ink800:   '#0B2040',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
};

const STEP_LABELS = {
  session_start: 'Зашли в каталог',
  catalog_view:  'Дошли до витрины',
  product_open:  'Открыли карточку',
  booking_open:  'Нажали «Узнать детали»',
  wa_click:      'Перешли в WhatsApp',
};

const SHAPE_LABELS = {
  round: 'Круглый', princess: 'Принцесса', radiant: 'Радиант', cushion: 'Кушон',
  oval: 'Овал', pear: 'Груша', heart: 'Сердце', marquise: 'Маркиз',
  emerald: 'Изумруд', asscher: 'Ашер',
};

// Вопросы нумерованы сквозно, как в тексте страницы, — чтобы строку в
// дашборде можно было сверить с самим вопросом.
const FAQ_LABELS = (() => {
  let n = 0;
  const out = {};
  for (const g of FAQ_GROUPS) for (const item of g.items) out[String(++n)] = `${n}. ${item.q}`;
  return out;
})();

const ACTION_LABELS = {
  shape_select:               'Выбирали огранку',
  config_change:              'Меняли конфигурацию',
  product_learn_more_click:   'Нажали «Узнать детали»',
  booking_share_click:        'Открыли «Отправить»',
  booking_share_success:      'Довели отправку до конца',
  booking_other_models_click: 'Ушли смотреть другие модели',
};

const DEPTH_LABELS = {
  '1': 'Открыли одну и ушли', '2-3': 'Сравнили 2–3', '4+': 'Сравнили 4 и больше',
};

const RANGES = [
  { id: 'today', label: 'Сегодня', days: 0 },
  { id: '7',     label: '7 дней',  days: 6 },
  { id: '30',    label: '30 дней', days: 29 },
  { id: '90',    label: '90 дней', days: 89 },
];

const TREND_SERIES = [
  { key: 'session_start', title: 'Посетители',         color: SERIES[1] },
  { key: 'wa_click',      title: 'Перешли в WhatsApp',  color: SERIES[2] },
];

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const card = {
  background: C.surface, border: `1.5px solid ${C.edge}`,
  borderRadius: 18, padding: '22px 24px',
};
const cardTitle = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.13em',
  textTransform: 'uppercase', color: C.ink400, marginBottom: 16,
};

function Card({ title, children, action, style }) {
  return (
    <div style={{ ...card, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div style={cardTitle}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 50, cursor: 'pointer', whiteSpace: 'nowrap',
        border: `1.5px solid ${active ? C.ink800 : C.edge}`,
        background: active ? C.ink800 : C.surface,
        color: active ? '#fff' : C.ink400,
        fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
        fontWeight: active ? 700 : 500,
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  );
}

const ALL = '__all__';

export default function Dashboard({ token }) {
  const [range,   setRange]   = useState('7');
  const [source,  setSource]  = useState(ALL);
  const [asTable, setAsTable] = useState(false);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async (rangeId) => {
    setLoading(true);
    setError('');
    const cfg = RANGES.find(r => r.id === rangeId) ?? RANGES[1];
    try {
      const res = await fetch(`/api/stats?from=${isoDaysAgo(cfg.days)}&to=${isoDaysAgo(0)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) throw new Error('Неверный пароль — войдите заново');
      if (!res.ok) throw new Error(`Не удалось загрузить статистику (${res.status})`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(range); }, [range, load]);

  const sources = useMemo(() => {
    const by = data?.total?.bySource ?? {};
    return Object.keys(by).sort((a, b) => (by[b]?.sessions ?? 0) - (by[a]?.sessions ?? 0));
  }, [data]);

  // Filtering swaps the whole page, funnel included — not just one row.
  const view = source === ALL ? data?.total : data?.total?.bySource?.[source];

  // The trend is scoped to the same slice, so it always agrees with the funnel.
  const daily = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map(d => {
      const src = source === ALL ? d : (d.bySource?.[source] ?? { funnel: {} });
      return {
        day: d.day,
        session_start: src.funnel?.session_start ?? 0,
        wa_click:      src.funnel?.wa_click ?? 0,
      };
    });
  }, [data, source]);

  const waRate    = view?.conversion?.find(c => c.step === 'wa_click')?.ofTotal ?? 0;
  const sourceLbl = source === ALL ? 'все источники' : (UTM_LABELS[source] ?? source);

  return (
    <div style={{ minWidth: 1080 }}>

      {/* One filter row above everything it scopes. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
        padding: '0 0 20px', marginBottom: 20, borderBottom: `1.5px solid ${C.edge}`,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {RANGES.map(r => (
            <Pill key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>{r.label}</Pill>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.7rem', letterSpacing: '0.11em', textTransform: 'uppercase',
            color: C.ink400, fontWeight: 700,
          }}>
            Источник
          </span>
          <Pill active={source === ALL} onClick={() => setSource(ALL)}>Все</Pill>
          {sources.map(s => (
            <Pill key={s} active={source === s} onClick={() => setSource(s)}>
              {UTM_LABELS[s] ?? s}
            </Pill>
          ))}
        </div>
      </div>

      {error && !loading && (
        <div style={{ ...card, borderColor: '#E3B7B3', background: '#FCF3F2', marginBottom: 16 }}>
          <div style={{ fontSize: '0.88rem', color: '#A8322B', marginBottom: 12 }}>{error}</div>
          <Pill active={false} onClick={() => load(range)}>Попробовать снова</Pill>
        </div>
      )}

      {view && (
        // Previous render held at reduced opacity while refetching — no skeleton flash.
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
            <StatTile
              label="Посетителей"
              value={(view.funnel.session_start ?? 0).toLocaleString('ru-KZ')}
              hint={`${data.from} — ${data.to}`}
            />
            <StatTile
              label="Дошли до WhatsApp"
              value={`${waRate}%`}
              hint={`${view.funnel.wa_click ?? 0} из ${view.funnel.session_start ?? 0}`}
              accent={C.champ700}
            />
            <StatTile
              label="Открыли карточку"
              value={(view.funnel.product_open ?? 0).toLocaleString('ru-KZ')}
              hint={`карточек за визит: ${view.avgCardsPerSession ?? 0}`}
            />
            <StatTile
              label="Выбрали огранку"
              value={`${view.engagement?.shape_select?.ofTotal ?? 0}%`}
              hint="необязательный шаг"
            />
          </div>

          <Card
            title={`Динамика · ${sourceLbl}`}
            style={{ marginBottom: 14 }}
            action={
              <button type="button" onClick={() => setAsTable(v => !v)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', color: C.ink400, fontFamily: 'Manrope, sans-serif',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                {asTable ? 'Показать график' : 'Показать таблицей'}
              </button>
            }
          >
            {asTable
              ? <TrendTable daily={daily} series={TREND_SERIES} />
              : <TrendChart daily={daily} series={TREND_SERIES} />}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Воронка">
              <FunnelChart conversion={view.conversion ?? []} labels={STEP_LABELS} />
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card title="Как смотрят карточки">
                <BarList rows={Object.entries(view.depth ?? {})} labels={DEPTH_LABELS} unit="сессий"
                  empty="Карточки ещё не открывали" />
                <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
                  Отличает «посмотрел одну и ушёл» от «сравнивал несколько». Воронка считает
                  и то и другое одинаково — как один визит без обращения.
                </p>
              </Card>

              <Card title="Действия помимо воронки">
                <BarList
                  rows={Object.keys(ACTION_LABELS).map(k => [k, view.engagement?.[k]?.sessions ?? 0])}
                  labels={ACTION_LABELS}
                  unit="сессий"
                  max={view.funnel.session_start ?? 0}
                />
                <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
                  Ни одно из них не преграждает путь: до витрины можно дойти, не выбирая
                  огранку, а до обращения — ничего не настраивая. Поэтому они не ступени,
                  а отдельные показатели.
                </p>
              </Card>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
            <Card title="Отправка ссылки">
              <BarList
                rows={[
                  ['booking_share_click',   view.engagement?.booking_share_click?.sessions ?? 0],
                  ['booking_share_success', view.engagement?.booking_share_success?.sessions ?? 0],
                ]}
                labels={{ booking_share_click: 'Нажали «Отправить»', booking_share_success: 'Довели до конца' }}
                unit="сессий"
                empty="Ссылку ещё не отправляли"
                max={view.engagement?.booking_share_click?.sessions || 1}
              />
              <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
                Разрыв между строками — те, кто открыл меню отправки и передумал.
                На десктопе «до конца» означает скопированную ссылку.
              </p>
            </Card>

            <Card title="Какие вопросы открывают">
              <BarList rows={Object.entries(view.faq ?? {})} labels={FAQ_LABELS} unit="раз"
                empty="Вопросы ещё не раскрывали" />
              <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
                Что именно мешает решиться. Считаются раскрытия, а не сессии — один
                человек может открыть несколько вопросов.
              </p>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
            <Card title="Города">
              <BarList rows={Object.entries(view.cities ?? {})} unit="сессий"
                empty="Город определяется автоматически" />
            </Card>
            <Card title="Огранки">
              <BarList rows={Object.entries(view.shapes ?? {})} labels={SHAPE_LABELS} />
            </Card>
            <Card title="Модели">
              <BarList rows={Object.entries(view.models ?? {})} />
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
            <Card title="Категории">
              <BarList rows={Object.entries(view.categories ?? {})}
                labels={{ ring: 'Кольца', pusety: 'Пусеты' }} />
            </Card>
            <Card title="Каратность">
              <BarList rows={Object.entries(view.carats ?? {})} unit="раз"
                empty="Каратность ещё не меняли" />
            </Card>
            <Card title="Источники — весь период">
              <BarList rows={Object.entries(data.total?.utm ?? {})} labels={UTM_LABELS} unit="сессий" />
            </Card>
          </div>

          <UtmLinks eyebrowStyle={cardTitle} />

          <p style={{ fontSize: '0.74rem', color: C.ink400, lineHeight: 1.65, margin: '18px 2px 0', maxWidth: 780 }}>
            Считается только раздел /catalog — конструктор на главной живёт отдельно.
            Воронка и разрезы по городам и источникам — уникальные сессии; огранки,
            модели и каратность — действия. Карточка «Источники» показывает весь период
            целиком и не зависит от выбранного фильтра.
          </p>
        </div>
      )}

      {loading && !view && (
        <div style={{ ...card, color: C.ink400, fontSize: '0.88rem' }}>Загружаем статистику...</div>
      )}
    </div>
  );
}
