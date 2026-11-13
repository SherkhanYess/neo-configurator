import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Button, Empty, ErrorNote, Loading, PageHead, Svg, useToast } from '../ui.jsx';

// Раздел «Намёки». По CJM она выбирает кольцо, но не покупает: намёк — её
// интерес, превращённый в лид на него. Здесь менеджер видит намёки, пишет
// парню в WhatsApp готовым текстом и отмечает, чем закончилось.
//
// Размер ему не пишем — его он узнаёт, только написав нам: так разговор
// начинается с нашей стороны.

const STATUSES = [
  { id: 'new',     label: 'Новый',          tone: 'new' },
  { id: 'written', label: 'Написали ему',   tone: 'work' },
  { id: 'replied', label: 'Ответил',        tone: 'work' },
  { id: 'visited', label: 'Пришёл в шоурум', tone: 'work' },
  { id: 'bought',  label: 'Купил',          tone: 'win' },
  { id: 'lost',    label: 'Не ответил',     tone: 'lost' },
];
const STATUS = Object.fromEntries(STATUSES.map(s => [s.id, s]));

const TEMPLATE_KEY = 'nd_hint_template';
const DEFAULT_TEMPLATE =
  'Здравствуйте, {имя}! Это Neo Diamond. Вам оставили намёк — кольцо, которое ей понравилось: {кольцо}\n{ссылка}\n\n{размер}';
const SIZE_KNOWN = 'Она поделилась с нами своим размером — напишите, и мы всё подскажем.';
const SIZE_UNKNOWN = 'Подскажем, как незаметно узнать размер. Напишите, если интересно.';

function loadTemplate() {
  try { return localStorage.getItem(TEMPLATE_KEY) || DEFAULT_TEMPLATE; } catch { return DEFAULT_TEMPLATE; }
}

function fill(template, h) {
  return template
    .replaceAll('{имя}', h.name)
    .replaceAll('{кольцо}', h.ring)
    .replaceAll('{ссылка}', h.link)
    .replaceAll('{размер}', h.size ? SIZE_KNOWN : SIZE_UNKNOWN)
    .trim();
}

const phoneView = (p) => {
  const d = String(p ?? '').replace(/\D/g, '');
  return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : p;
};

function when(iso) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function HintCard({ h, template, onPatch }) {
  const [note, setNote] = useState(h.note ?? '');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const st = STATUS[h.status] ?? STATUS.new;
  const text = fill(template, h);
  const wa = `https://wa.me/${String(h.phone).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  async function patch(body, okText) {
    setBusy(true);
    try { await onPatch(h.key, body); if (okText) toast(okText); }
    catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <article className={`st-hint is-${st.tone}`}>
      <header className="st-hint__head">
        <div>
          <h3 className="st-hint__name">{h.name}</h3>
          <a className="st-hint__phone" href={`tel:${h.phone}`}>{phoneView(h.phone)}</a>
        </div>
        <span className={`st-pill is-${st.tone}`}>{st.label}</span>
      </header>

      <dl className="st-hint__facts">
        <div><dt>Кольцо</dt><dd>{h.link ? <a href={h.link} target="_blank" rel="noopener noreferrer">{h.ring}</a> : h.ring}</dd></div>
        <div><dt>Её размер</dt><dd className="st-mono">{h.size ? String(h.size).replace('.', ',') : 'не знает'}</dd></div>
        <div><dt>Когда</dt><dd>{when(h.at)}{h.city ? ` · ${h.city}` : ''}</dd></div>
        {h.code && <div><dt>Код</dt><dd className="st-mono">{h.code}</dd></div>}
        {(h.waSentAt || h.waError) && <div><dt>WhatsApp</dt><dd>{h.waSentAt ? 'Сообщение ушло автоматически' : 'Автосообщение не ушло — напишите вручную'}</dd></div>}
        {h.leadId && <div><dt>amoCRM</dt><dd><a href={`https://neodiamondkz.amocrm.ru/leads/detail/${h.leadId}`} target="_blank" rel="noopener noreferrer">Сделка {h.leadId}</a></dd></div>}
      </dl>

      <div className="st-hint__actions">
        <a className="st-btn st-btn--wa" href={wa} target="_blank" rel="noopener noreferrer"
           onClick={() => { if (h.status === 'new') patch({ status: 'written' }); }}>
          <Svg name="wa" />Написать ему
        </a>
        <select className="st-input st-input--s" value={h.status ?? 'new'} disabled={busy}
                onChange={e => patch({ status: e.target.value }, `Статус: ${STATUS[e.target.value].label.toLowerCase()}`)}>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <textarea className="st-input st-textarea st-hint__note" rows={2} placeholder="Заметка менеджера"
                value={note} onChange={e => setNote(e.target.value)}
                onBlur={() => { if (note !== (h.note ?? '')) patch({ note }, 'Заметка сохранена'); }} />
    </article>
  );
}

export default function HintsView({ onChange }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [template, setTemplate] = useState(loadTemplate);
  const [editTpl, setEditTpl] = useState(false);

  useEffect(() => {
    api('/api/hint').then(setList).catch(e => setError(e.message));
  }, []);

  async function patch(key, body) {
    const updated = await api('/api/hint', { method: 'PATCH', body: { key, ...body } });
    setList(l => l.map(h => (h.key === key ? { ...h, ...updated } : h)));
    onChange?.();
  }

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map(s => [s.id, 0]));
    for (const h of list ?? []) c[h.status ?? 'new'] = (c[h.status ?? 'new'] ?? 0) + 1;
    return c;
  }, [list]);

  const FILTERS = [
    { id: 'open', label: 'В работе', test: (h) => !['bought', 'lost'].includes(h.status ?? 'new') },
    { id: 'new', label: 'Новые', test: (h) => (h.status ?? 'new') === 'new' },
    { id: 'bought', label: 'Купили', test: (h) => h.status === 'bought' },
    { id: 'all', label: 'Все', test: () => true },
  ];
  const shown = (list ?? []).filter(FILTERS.find(f => f.id === filter).test);
  const total = list?.length ?? 0;
  const conv = total ? Math.round((counts.bought / total) * 100) : 0;

  function saveTemplate(v) {
    setTemplate(v);
    try { localStorage.setItem(TEMPLATE_KEY, v); } catch { /* приватный режим */ }
  }

  return (
    <div className="st-hints">
      <PageHead
        title="Намёки"
        sub="Девушка выбрала кольцо и оставила его номер. Напишите ему — размер он узнает, только ответив нам."
        actions={<Button variant="secondary" onClick={() => setEditTpl(v => !v)}>{editTpl ? 'Готово' : 'Текст сообщения'}</Button>}
      />

      {editTpl && (
        <div className="st-card st-tpl">
          <p className="st-muted">
            Подставляются: <code>{'{имя}'}</code> <code>{'{кольцо}'}</code> <code>{'{ссылка}'}</code> <code>{'{размер}'}</code> —
            последнее превращается в строку про размер: знает она его или нет. Текст хранится в этом браузере.
          </p>
          <textarea className="st-input st-textarea" rows={6} value={template} onChange={e => saveTemplate(e.target.value)} />
          <div className="st-row">
            <Button variant="ghost" size="s" onClick={() => saveTemplate(DEFAULT_TEMPLATE)}>Вернуть исходный</Button>
          </div>
        </div>
      )}

      {list && total > 0 && (
        <div className="st-kpis st-kpis--3">
          <div className="st-kpi"><span>Всего намёков</span><b>{total}</b></div>
          <div className="st-kpi"><span>Ждут ответа</span><b>{counts.new}</b></div>
          <div className="st-kpi"><span>Купили</span><b>{counts.bought}<small> · {conv}%</small></b></div>
        </div>
      )}

      <div className="st-chips">
        {FILTERS.map(f => {
          const n = (list ?? []).filter(f.test).length;
          return (
            <button key={f.id} type="button" className={`st-chip${filter === f.id ? ' is-on' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}<span>{n}</span>
            </button>
          );
        })}
      </div>

      <ErrorNote>{error}</ErrorNote>
      {!list && !error && <Loading />}
      {list && shown.length === 0 && (
        <Empty title={total ? 'Здесь пусто' : 'Намёков пока нет'}>
          {total ? 'Смените фильтр выше.' : 'Они появятся, когда девушка нажмёт «Намекнуть партнёру» на странице модели.'}
        </Empty>
      )}
      <div className="st-hints__grid">
        {shown.map(h => <HintCard key={h.key} h={h} template={template} onPatch={patch} />)}
      </div>
    </div>
  );
}
