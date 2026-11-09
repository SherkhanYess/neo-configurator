import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, ErrorNote, Field, Loading, PageHead, SaveBar, Svg, Toggle, useDraft, useToast } from '../ui.jsx';
import { moveItem } from '../sortable.js';
import { Fields } from './guides/FieldEditor.jsx';
import { BLOCKS, GUIDE_FIELDS, emptyBlock } from '../../catalog/data/guideSchema.js';
import { DEFAULT_GUIDES } from '../../catalog/data/guidesDefault.js';
import { guidePath, minutesLabel } from '../../catalog/data/guides.js';
import { GuideCover } from '../../catalog/guides/covers.jsx';
import GuideArticle from '../../catalog/guides/GuideArticle.jsx';
import { GuideCtx } from '../../catalog/guides/guideCtx.js';
import { BASE } from '../utm.js';

// Раздел «Гиды»: статьи для мужчин целиком — заголовок, вступление, обложка,
// описание для превью ссылки и все блоки статьи по порядку. Справа — та же
// статья, как её увидит человек на телефоне.
//
// Статья — список блоков (схема — src/catalog/data/guideSchema.js): абзацы,
// заголовки, списки, фото, кнопки и иллюстрации из статей. Любой блок можно
// поправить, переставить, скопировать, убрать или добавить новый.
//
// Пока здесь ничего не сохраняли, сайт показывает гиды из кода. Первое
// сохранение кладёт на сервер все гиды сразу — дальше сайт берёт их оттуда.

const clone = (x) => JSON.parse(JSON.stringify(x));
const GROUPS = [...new Set(Object.values(BLOCKS).map(b => b.group))];

const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const slugify = (s) => String(s).toLowerCase().split('').map(c => TRANSLIT[c] ?? c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'gid';

/** Первая строка текста блока — чтобы в свёрнутом виде было понятно, что это. */
function excerpt(b) {
  const first = b.text || b.title || b.items?.[0]?.title || b.items?.[0]?.term || (typeof b.items?.[0] === 'string' ? b.items[0] : '') || b.rows?.[0]?.title || '';
  return String(first).replace(/\s+/g, ' ').slice(0, 90);
}

function AddBlock({ onAdd, label = 'Добавить блок' }) {
  const [type, setType] = useState('p');
  return (
    <div className="st-gadd">
      <select className="st-input" value={type} onChange={e => setType(e.target.value)} aria-label="Тип блока">
        {GROUPS.map(g => (
          <optgroup key={g} label={g}>
            {Object.entries(BLOCKS).filter(([, b]) => b.group === g).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}
          </optgroup>
        ))}
      </select>
      <Button variant="secondary" onClick={() => onAdd(type)}><Svg name="plus" size={16} />{label}</Button>
    </div>
  );
}

function BlockRow({ b, i, count, open, onToggle, onChange, onMove, onCopy, onRemove, onInsert }) {
  const spec = BLOCKS[b.type];
  const [adding, setAdding] = useState(false);
  return (
    <div className={`st-gblock${open ? ' is-open' : ''}`} id={`blk-${b.id}`}>
      <div className="st-gblock__head">
        <button type="button" className="st-gblock__title" onClick={onToggle} aria-expanded={open}>
          <span className="st-list__n">{i + 1}</span>
          <span className="st-gblock__label"><b>{spec?.label ?? b.type}</b><small>{excerpt(b) || 'пусто'}</small></span>
          <Svg name={open ? 'up' : 'down'} />
        </button>
        <div className="st-row st-row--tight">
          <Button variant="icon" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label="Выше"><Svg name="up" /></Button>
          <Button variant="icon" onClick={() => onMove(i, i + 1)} disabled={i === count - 1} aria-label="Ниже"><Svg name="down" /></Button>
          <Button variant="icon" onClick={() => setAdding(a => !a)} aria-label="Вставить блок ниже"><Svg name="plus" /></Button>
          <Button variant="icon" onClick={onCopy} aria-label="Копия блока"><Svg name="copy" /></Button>
          <Button variant="icon" onClick={onRemove} aria-label="Удалить блок"><Svg name="trash" /></Button>
        </div>
      </div>
      {open && spec && (
        <div className="st-gblock__body">
          {Object.keys(spec.fields).length
            ? <Fields fields={spec.fields} value={b} onChange={onChange} />
            : <p className="st-muted">У этого блока нет текста — он рисуется сам.</p>}
        </div>
      )}
      {adding && <div className="st-gblock__insert"><AddBlock label="Вставить ниже" onAdd={(t) => { onInsert(t); setAdding(false); }} /></div>}
    </div>
  );
}

function GuideEdit({ guide, onChange, onBack, slugs }) {
  const [open, setOpen] = useState(null);
  const previewRef = useRef(null);
  const ctx = useMemo(() => ({ slug: guide.slug, wa: { open: () => {} } }), [guide.slug]);
  const blocks = guide.blocks ?? [];
  const setBlocks = (next) => onChange({ ...guide, blocks: next });

  // Открытый блок — и в предпросмотре: прокручиваем телефон к нему.
  useEffect(() => {
    if (!open) return;
    const screen = previewRef.current;
    const el = screen?.querySelector(`[data-block="${open}"]`);
    if (screen && el) screen.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  }, [open]);

  const slugBad = !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(guide.slug) || slugs.filter(s => s === guide.slug).length > 1;

  const add = (type, at = blocks.length) => {
    const nb = emptyBlock(type);
    setBlocks([...blocks.slice(0, at), nb, ...blocks.slice(at)]);
    setOpen(nb.id);
  };

  return (
    <div className="st-gedit">
      <div className="st-gedit__form">
        <Button variant="ghost" onClick={onBack}><Svg name="back" size={16} />Все гиды</Button>

        <Card title="Гид">
          <Field label="Адрес страницы" hint={slugBad ? 'Только латиница, цифры и дефис, и не как у другого гида.' : `Страница: ${guidePath(guide.slug)}`}>
            <div className="st-row st-row--tight">
              <input className={`st-input${slugBad ? ' is-bad' : ''}`} value={guide.slug} onChange={e => onChange({ ...guide, slug: e.target.value.toLowerCase() })} />
              <Button variant="secondary" size="s" onClick={() => onChange({ ...guide, slug: slugify(guide.title) })}>Из заголовка</Button>
            </div>
          </Field>
          <Fields fields={GUIDE_FIELDS} value={guide} onChange={onChange} />
          <div className="st-switchrow" style={{ marginTop: 16 }}>
            <div><b>Показывать на сайте</b><small>Скрытый гид пропадает из ленты, а его страница уводит в каталог.</small></div>
            <Toggle on={!guide.hidden} onChange={(on) => onChange({ ...guide, hidden: !on })} label="Показывать на сайте" />
          </div>
        </Card>

        <Card title={`Блоки статьи — ${blocks.length}`} aside={<span className="st-muted st-muted--s">Нажмите на блок, чтобы поправить</span>}>
          <div className="st-gblocks">
            {blocks.map((b, i) => (
              <BlockRow key={b.id} b={b} i={i} count={blocks.length} open={open === b.id}
                        onToggle={() => setOpen(o => (o === b.id ? null : b.id))}
                        onChange={(nb) => setBlocks(blocks.map(x => (x.id === b.id ? nb : x)))}
                        onMove={(a, c) => setBlocks(moveItem(blocks, a, c))}
                        onCopy={() => { const c = { ...clone(b), id: Math.random().toString(36).slice(2, 10) }; setBlocks([...blocks.slice(0, i + 1), c, ...blocks.slice(i + 1)]); }}
                        onRemove={() => { if (confirm(`Удалить блок «${BLOCKS[b.type]?.label}»?`)) setBlocks(blocks.filter(x => x.id !== b.id)); }}
                        onInsert={(t) => add(t, i + 1)} />
            ))}
          </div>
          <div style={{ marginTop: 14 }}><AddBlock onAdd={(t) => add(t)} /></div>
        </Card>
      </div>

      <div className="st-gedit__preview">
        <p className="st-phone__label">Так увидит покупатель</p>
        <div className="st-phone__screen st-gpreview" ref={previewRef}>
          <GuideCtx.Provider value={ctx}>
            <div className="gd"><GuideArticle guide={guide} /></div>
          </GuideCtx.Provider>
        </div>
      </div>
    </div>
  );
}

export default function GuidesEditor() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fromCode, setFromCode] = useState(false);
  const { draft, setDraft, dirty, load, reset } = useDraft(null);

  useEffect(() => {
    api('/api/content/guides?fresh')
      .then(doc => {
        const items = doc?.items?.length ? doc.items : clone(DEFAULT_GUIDES);
        setFromCode(!doc?.items?.length);
        load(items);
      })
      .catch(e => setError(e.message));
  }, [load]);

  async function save() {
    const slugs = draft.map(g => g.slug);
    if (slugs.some((s, i) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) || slugs.indexOf(s) !== i)) {
      toast('У какого-то гида неверный или повторяющийся адрес — поправьте его.', 'error');
      return;
    }
    if (draft.some(g => !g.title?.trim())) { toast('У каждого гида должен быть заголовок.', 'error'); return; }
    setSaving(true);
    try {
      const saved = await api('/api/content/guides', { method: 'PUT', body: { items: draft } });
      load(saved.items);
      setFromCode(false);
      toast('Сохранено — гиды на сайте обновились');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const update = (i, g) => setDraft(list => list.map((x, j) => (j === i ? g : x)));
  const addGuide = () => {
    const base = 'novyy-gid';
    let slug = base, k = 2;
    while (draft.some(g => g.slug === slug)) slug = `${base}-${k++}`;
    const g = { slug, title: 'Новый гид', teaser: '', minutes: 3, lead: '', cover: 'secret', coverPhoto: '', description: '', hidden: true,
      blocks: [emptyBlock('h2'), emptyBlock('p'), { ...emptyBlock('final'), title: 'Посмотрите кольца', primary: 'Смотреть каталог', wa: 'Написать нам', waType: 'price' }] };
    setDraft(list => [...list, g]);
    setEditing(draft.length);
  };

  const sheet = (
    <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset}
             note={editing !== null ? 'Сохраняются все гиды сразу' : undefined} />
  );

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!draft) return <Loading />;

  if (editing !== null && draft[editing]) {
    return (
      <div className="st-guides">
        <GuideEdit guide={draft[editing]} slugs={draft.map(g => g.slug)}
                   onChange={(g) => update(editing, g)}
                   onBack={() => setEditing(null)} />
        {sheet}
      </div>
    );
  }

  return (
    <div className="st-guides">
      <PageHead
        title="Гиды"
        sub="Статьи для мужчин: в ленте — карточками после моделей, у каждой — своя страница для рекламы."
        actions={<Button onClick={addGuide}><Svg name="plus" size={16} />Новый гид</Button>}
      />
      {fromCode && <p className="st-muted" style={{ marginBottom: 14 }}>Сейчас на сайте гиды из кода. После первого сохранения сайт будет брать их отсюда.</p>}
      <div className="st-glist st-glist--guides">
        {draft.map((g, i) => (
          <div key={i} className={`st-gcard${g.hidden ? ' is-off' : ''}`}>
            <div className="st-gcard__cover"><GuideCover kind={g.cover} photo={g.coverPhoto} /></div>
            <div className="st-gcard__body">
              <b>{g.title}</b>
              <small>{minutesLabel(g.minutes || 1)} · {(g.blocks ?? []).length} блоков · {guidePath(g.slug)}</small>
              {g.teaser && <p>{g.teaser}</p>}
              <div className="st-row" style={{ marginTop: 10 }}>
                <Button size="s" onClick={() => setEditing(i)}>Редактировать</Button>
                <a className="st-btn st-btn--ghost st-btn--s" href={guidePath(g.slug)} target="_blank" rel="noopener noreferrer"><Svg name="ext" size={15} />Открыть</a>
                <Button variant="ghost" size="s" onClick={() => navigator.clipboard?.writeText(`${BASE}${guidePath(g.slug)}`).then(() => toast('Ссылка скопирована. Ссылки с метками для рекламы — в разделе «Ссылки»'), () => {})}>
                  <Svg name="copy" size={15} />Ссылка
                </Button>
              </div>
            </div>
            <div className="st-gcard__side">
              <Toggle on={!g.hidden} onChange={(on) => update(i, { ...g, hidden: !on })} label="Показывать на сайте" />
              <div className="st-row st-row--tight">
                <Button variant="icon" onClick={() => setDraft(l => moveItem(l, i, i - 1))} disabled={i === 0} aria-label="Выше"><Svg name="up" /></Button>
                <Button variant="icon" onClick={() => setDraft(l => moveItem(l, i, i + 1))} disabled={i === draft.length - 1} aria-label="Ниже"><Svg name="down" /></Button>
                <Button variant="icon" aria-label="Удалить гид"
                        onClick={() => { if (confirm(`Удалить гид «${g.title}»? Его страница перестанет открываться.`)) setDraft(l => l.filter((_, j) => j !== i)); }}>
                  <Svg name="trash" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {sheet}
    </div>
  );
}

