import { useState, useEffect, useCallback } from 'react';

// Funnel and breakdowns for /catalog, read from /api/stats.
//
// Every figure counts DISTINCT SESSIONS, not raw events: one visitor opening
// ten cards is one person, not ten.

const C = {
  paper050: '#FAFBFC',
  paper100: '#F2F5F9',
  paper200: '#E9EDF3',
  paper300: '#DBE2EB',
  ink800:   '#0B2040',
  ink600:   '#1E3149',
  ink400:   '#5B81A1',
  champ700: '#7C6035',
  champ200: '#EFE4D2',
};

const STEP_LABELS = {
  session_start: 'Зашли в каталог',
  catalog_view:  'Дошли до витрины',
  product_open:  'Открыли карточку',
  booking_open:  'Нажали «Подтвердить»',
  wa_click:      'Перешли в WhatsApp',
};

const SHAPE_LABELS = {
  round: 'Круглый', princess: 'Принцесса', radiant: 'Радиант', cushion: 'Кушон',
  oval: 'Овал', pear: 'Груша', heart: 'Сердце', marquise: 'Маркиз',
  emerald: 'Изумруд', asscher: 'Ашер',
};

const RANGES = [
  { id: 'today', label: 'Сегодня', days: 0 },
  { id: '7',     label: '7 дней',  days: 6 },
  { id: '30',    label: '30 дней', days: 29 },
];

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const card = {
  background: '#fff',
  border: `1.5px solid ${C.paper300}`,
  borderRadius: 20,
  padding: '20px 22px',
};

const eyebrow = {
  fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: C.ink400, marginBottom: 14,
};

const mono = { fontFamily: '"JetBrains Mono", "Courier New", monospace', fontVariantNumeric: 'tabular-nums' };

function Funnel({ conversion }) {
  const top = conversion[0]?.sessions ?? 0;

  return (
    <div style={{ ...card }}>
      <div style={eyebrow}>Воронка</div>

      {top === 0 ? (
        <p style={{ margin: 0, fontSize: '0.88rem', color: C.ink400, lineHeight: 1.6 }}>
          За выбранный период данных ещё нет. Сбор запущен — статистика появится, когда в каталог зайдут посетители.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {conversion.map((row, i) => {
            const drop = i > 0 ? 100 - row.ofPrevious : 0;
            return (
              <div key={row.step}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 12, marginBottom: 6,
                }}>
                  <span style={{ fontSize: '0.87rem', color: C.ink800, fontWeight: 500 }}>
                    {STEP_LABELS[row.step] ?? row.step}
                  </span>
                  <span style={{ ...mono, fontSize: '0.87rem', color: C.ink800, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {row.sessions}
                    <span style={{ color: C.ink400, fontWeight: 400 }}> · {row.ofTotal}%</span>
                  </span>
                </div>

                <div style={{ height: 10, borderRadius: 50, background: C.paper200, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(row.ofTotal, row.sessions > 0 ? 2 : 0)}%`,
                    height: '100%',
                    borderRadius: 50,
                    background: i === conversion.length - 1 ? C.champ700 : C.ink800,
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                {i > 0 && drop > 0 && (
                  <div style={{ ...mono, fontSize: '0.72rem', color: C.ink400, marginTop: 4 }}>
                    потеряли {drop.toFixed(1)}% от предыдущего шага
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Breakdown({ title, data, labels, unit, empty, bare }) {
  // Sorted here rather than trusting the order the server sent: JSON objects
  // put integer-like keys first in numeric order, so carats ("1", "2", "1.5")
  // arrive reshuffled no matter how the server ordered them.
  const rows = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? Math.max(...rows.map(r => r[1])) : 0;

  const body = (
    <>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: C.ink400 }}>{empty ?? 'Пока нет данных'}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.slice(0, 10).map(([key, n]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem', color: C.ink600 }}>{labels?.[key] ?? key}</span>
                <span style={{ ...mono, fontSize: '0.85rem', color: C.ink800, fontWeight: 600 }}>
                  {n}{unit ? ` ${unit}` : ''}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 50, background: C.paper200, overflow: 'hidden' }}>
                <div style={{
                  width: `${max ? (n / max) * 100 : 0}%`,
                  height: '100%', borderRadius: 50, background: C.champ700,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (bare) return body;
  return (
    <div style={card}>
      <div style={eyebrow}>{title}</div>
      {body}
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ ...eyebrow, marginBottom: 8 }}>{label}</div>
      <div style={{ ...mono, fontSize: '1.6rem', fontWeight: 700, color: C.ink800, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: '0.75rem', color: C.ink400, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function Dashboard({ token }) {
  const [range,   setRange]   = useState('7');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async (rangeId) => {
    setLoading(true);
    setError('');
    const cfg = RANGES.find(r => r.id === rangeId) ?? RANGES[1];
    const to   = isoDaysAgo(0);
    const from = isoDaysAgo(cfg.days);

    try {
      const res = await fetch(`/api/stats?from=${from}&to=${to}`, {
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

  const total = data?.total;
  const waRate = total?.conversion?.find(c => c.step === 'wa_click')?.ofTotal ?? 0;
  const engagement = total?.engagement?.config_change;
  const shapePicked = total?.engagement?.shape_select;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={{ display: 'flex', gap: 8 }}>
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 50, cursor: 'pointer',
              border: `1.5px solid ${range === r.id ? C.ink800 : C.paper300}`,
              background: range === r.id ? C.paper100 : '#fff',
              color: range === r.id ? C.ink800 : C.ink400,
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.82rem', fontWeight: range === r.id ? 700 : 500,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ ...card, color: C.ink400, fontSize: '0.88rem' }}>Загружаем статистику...</div>
      )}

      {error && !loading && (
        <div style={{ ...card, borderColor: '#E3B7B3', background: '#FCF3F2' }}>
          <div style={{ fontSize: '0.88rem', color: '#A8322B', marginBottom: 10 }}>{error}</div>
          <button
            onClick={() => load(range)}
            style={{
              padding: '8px 18px', borderRadius: 50, cursor: 'pointer',
              border: `1.5px solid ${C.paper300}`, background: '#fff',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: C.ink800,
            }}
          >
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && total && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Metric label="Посетителей" value={total.funnel.session_start ?? 0} hint={`${data.from} — ${data.to}`} />
            <Metric label="Дошли до WhatsApp" value={`${waRate}%`} hint={`${total.funnel.wa_click ?? 0} из ${total.funnel.session_start ?? 0}`} />
          </div>

          <Funnel conversion={total.conversion ?? []} />

          <div style={card}>
            <div style={eyebrow}>Как смотрят карточки</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '0.87rem', color: C.ink600 }}>Карточек за визит, в среднем</span>
              <span style={{ ...mono, fontSize: '1.15rem', fontWeight: 700, color: C.ink800 }}>
                {total.avgCardsPerSession ?? 0}
              </span>
            </div>
            <Breakdown
              title=""
              data={total.depth}
              labels={{ '1': 'Открыли одну и ушли', '2-3': 'Сравнили 2–3', '4+': 'Сравнили 4 и больше' }}
              unit="сессий"
              empty="Карточки ещё не открывали"
              bare
            />
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
              Отличает «посмотрел одну и ушёл» от «сравнивал несколько». Воронка считает и то и другое
              одинаково — как один визит без записи.
            </p>
          </div>

          <div style={card}>
            <div style={eyebrow}>Необязательные действия</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Выбирали огранку на первом экране', shapePicked],
                ['Меняли конфигурацию украшения',      engagement],
              ].filter(([, v]) => v).map(([label, v]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: '0.87rem', color: C.ink600 }}>{label}</span>
                  <span style={{ ...mono, fontSize: '0.95rem', fontWeight: 700, color: C.ink800 }}>
                    {v.sessions}
                    <span style={{ color: C.ink400, fontWeight: 400 }}> · {v.ofTotal}%</span>
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: C.ink400, lineHeight: 1.55 }}>
              Не ступени воронки: до витрины можно дойти, не выбирая огранку, а до записи —
              ничего не настраивая. Если считать их ступенями, появляется отвал, которого нет.
            </p>
          </div>

          <Breakdown title="Города"          data={total.cities} unit="сессий" empty="Город определяется автоматически при заходе" />
          <Breakdown title="Огранки"         data={total.shapes} labels={SHAPE_LABELS} />
          <Breakdown title="Модели"          data={total.models} />
          <Breakdown title="Категории"       data={total.categories} labels={{ ring: 'Кольца', pusety: 'Пусеты' }} />
          <Breakdown title="Каратность"      data={total.carats} unit="раз" empty="Никто ещё не менял каратность" />
          <Breakdown title="Источники"       data={total.utm} unit="сессий" />

          <p style={{ fontSize: '0.72rem', color: C.ink400, lineHeight: 1.6, margin: '4px 2px 0' }}>
            Считается только раздел /catalog. Конструктор на главной живёт отдельно и в эту воронку не попадает.
            Все цифры — уникальные сессии, кроме огранок, моделей и каратности: там считаются действия.
          </p>
        </>
      )}
    </div>
  );
}
