import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Counter, Empty, ErrorNote, Field, Loading, PageHead, SaveBar, Svg, Toggle, useDraft, useToast } from '../ui.jsx';
import { moveItem } from '../sortable.js';
import { REVIEWS } from '../../catalog/data/reviews.js';

// Раздел «Отзывы»: цитаты для блока «Нас выбирают» на странице модели.
//
// Только дословно из 2ГИС и только со ссылкой на оригинал — без ссылки сервер
// отзыв не сохранит. Придумывать или «улучшать» отзывы нельзя: это проверяемо,
// и одна найденная подделка стоит дороже всех настоящих.

const URL_OK = (u) => /^https:\/\/([\w-]+\.)*2gis\.(kz|ru|com)\//.test(u ?? '');
const STAR = <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path fill="#896E4C" d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>;

const blank = () => ({ id: Math.random().toString(36).slice(2, 10), name: '', text: '', url: '', date: '', hidden: false });

function ReviewRow({ r, index, count, update, move, remove }) {
  const urlBad = r.url && !URL_OK(r.url);
  const incomplete = !r.name.trim() || !r.text.trim() || !URL_OK(r.url);
  return (
    <div className={`st-review${r.hidden ? ' is-off' : ''}`}>
      <div className="st-review__preview">
        <div className="mp-review">
          <div style={{ display: 'flex', gap: 2 }}>{STAR}{STAR}{STAR}{STAR}{STAR}</div>
          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#122D2E' }}>{r.text || 'Текст отзыва'}</p>
          <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: '#52615B' }}>{r.name || 'Имя'} · 2ГИС</div>
        </div>
      </div>
      <div className="st-review__form">
        <div className="st-review__top">
          <span className="st-eyebrow">Отзыв {index + 1}{incomplete ? ' · не заполнен — не сохранится' : ''}</span>
          <div className="st-row st-row--tight">
            <Button variant="icon" onClick={() => move(-1)} disabled={index === 0} aria-label="Выше"><Svg name="up" /></Button>
            <Button variant="icon" onClick={() => move(1)} disabled={index === count - 1} aria-label="Ниже"><Svg name="down" /></Button>
            <Button variant="icon" onClick={remove} aria-label="Удалить"><Svg name="trash" /></Button>
          </div>
        </div>
        <div className="st-grid2">
          <Field label="Имя, как в 2ГИС">
            <input className="st-input" value={r.name} maxLength={40} onChange={e => update({ name: e.target.value })} />
          </Field>
          <Field label="Дата отзыва">
            <input className="st-input" type="date" value={r.date} onChange={e => update({ date: e.target.value })} />
          </Field>
        </div>
        <Field label="Текст — дословно" counter={<Counter value={r.text} soft={220} hard={400} />}
               hint="Можно сократить многоточием, но не переписывать.">
          <textarea className="st-input st-textarea" rows={4} value={r.text} maxLength={600} onChange={e => update({ text: e.target.value })} />
        </Field>
        <Field label="Ссылка на отзыв в 2ГИС" hint={urlBad ? 'Нужна ссылка на 2gis.kz — без неё отзыв не сохранится.' : 'Откройте отзыв в 2ГИС и скопируйте адрес из браузера.'}>
          <input className={`st-input${urlBad ? ' is-bad' : ''}`} value={r.url} placeholder="https://2gis.kz/almaty/firm/…" onChange={e => update({ url: e.target.value.trim() })} />
        </Field>
        <div className="st-switchrow">
          <div><b>Показывать на сайте</b></div>
          <Toggle on={!r.hidden} onChange={(on) => update({ hidden: !on })} label="Показывать на сайте" />
        </div>
      </div>
    </div>
  );
}

export default function ReviewsEditor() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rep, setRep] = useState(null);
  const { draft, setDraft, dirty, load, reset } = useDraft(null);

  useEffect(() => {
    api('/api/content/reviews?fresh')
      .then(doc => load(doc?.items ?? REVIEWS.map(r => ({ ...blank(), ...r }))))
      .catch(e => setError(e.message));
    fetch('/catalog/reputation.json').then(r => (r.ok ? r.json() : null)).then(setRep).catch(() => {});
  }, [load]);

  const update = (id, patch) => setDraft(list => list.map(r => (r.id === id ? { ...r, ...patch } : r)));

  async function save() {
    const bad = draft.filter(r => !r.name.trim() || !r.text.trim() || !URL_OK(r.url));
    if (bad.length && !confirm(`${bad.length} ${bad.length === 1 ? 'отзыв не заполнен' : 'отзыва не заполнены'} до конца (имя, текст и ссылка на 2ГИС) — они не сохранятся. Продолжить?`)) return;
    setSaving(true);
    try {
      const saved = await api('/api/content/reviews', { method: 'PUT', body: { items: draft } });
      load(saved.items);
      toast('Сохранено — отзывы на сайте обновились');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="st-reviews">
      <PageHead
        title="Отзывы"
        sub="Цитаты для блока «Нас выбирают» на странице модели. Только дословно из 2ГИС и со ссылкой на оригинал."
        actions={draft && <Button onClick={() => setDraft(list => [blank(), ...list])}><Svg name="plus" size={16} />Добавить отзыв</Button>}
      />

      {rep && (
        <Card className="st-rep">
          <span className="st-rep__n">{Number(rep.rating).toFixed(1).replace('.', ',')}</span>
          <span>
            <b>Рейтинг в 2ГИС — {rep.ratings} оценки</b>
            <small>Обновляется сам при каждой сборке сайта. <a href={rep.url} target="_blank" rel="noopener noreferrer">Открыть 2ГИС</a></small>
          </span>
        </Card>
      )}

      <ErrorNote>{error}</ErrorNote>
      {!draft && !error && <Loading />}
      {draft && draft.length === 0 && (
        <Empty title="Отзывов пока нет">
          Пока список пуст, на сайте показываются только рейтинг и ссылка «Все отзывы в 2ГИС». Добавьте 2–3 цитаты — лучше о помолвке и о том, как помогли выбрать.
        </Empty>
      )}
      <div className="st-reviews__list">
        {draft?.map((r, i) => (
          <ReviewRow key={r.id} r={r} index={i} count={draft.length}
                     update={(p) => update(r.id, p)}
                     move={(d) => setDraft(list => moveItem(list, i, i + d))}
                     remove={() => { if (confirm('Удалить отзыв?')) setDraft(list => list.filter(x => x.id !== r.id)); }} />
        ))}
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
