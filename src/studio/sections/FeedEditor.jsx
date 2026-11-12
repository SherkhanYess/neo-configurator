import { useEffect, useMemo, useState } from 'react';
import { api, getToken } from '../api.js';
import { Button, Card, Counter, ErrorNote, Field, Loading, PageHead, SaveBar, Svg, Toggle, useDraft, useToast } from '../ui.jsx';
import { moveItem, useSortable } from '../sortable.js';
import { toDraft, toContent, toProducts, previewFeed, previewItem, previewBreak, canShow } from './feed/draft.js';
import { PhotoButtons, PhotoStage, TonePicker, retone, useUpload } from './feed/PhotoStage.jsx';
import { FeedCard, FeedBreak } from '../../catalog/components/FeedCard.jsx';
import { fetchProducts, saveProducts } from '../../catalog/data/products.js';
import { fetchPrices } from '../../catalog/data/prices.js';
import { fromPrice, wasPrice } from '../../catalog/data/priceCalc.js';
import { mergeProducts, pruneFeed, shankSlug } from '../../catalog/data/models.js';
import { DEFAULT_HERO, DEFAULT_LIST_TITLE, feedHero, typo } from '../../catalog/data/feed.js';
import { Hero } from '../../catalog/screens/FeedScreen.jsx';
import { FieldInput } from './guides/FieldEditor.jsx';

// Раздел «Лента»: порядок моделей, фото, цвет плашки, тексты, кадры «на руке»
// и заголовок. Слева список, в середине правка выбранного, справа — вся лента
// на экране телефона, как её увидит покупатель.

const TEXT_SOFT = 75;   // две строки на телефоне
const TEXT_HARD = 90;   // дальше конец строки обрежется многоточием


// ─── Список ──────────────────────────────────────────────────────────────────

function Thumb({ src, tone, position }) {
  return (
    <span className="st-thumb" style={{ '--tone': tone }}>
      {src ? <img src={src} alt="" style={{ objectPosition: position }} loading="lazy" /> : <Svg name="photo" />}
    </span>
  );
}

function ModelList({ draft, setDraft, sel, setSel }) {
  const ids = draft.models.map(m => m.key);
  const { rowProps, handleProps, dragging } = useSortable(ids, (from, to) =>
    setDraft(d => ({ ...d, models: moveItem(d.models, from, to) })));
  let shown = 0;

  return (
    <div className="st-list">
      <button type="button" className={`st-list__row st-list__row--intro${sel.type === 'intro' ? ' is-sel' : ''}`}
              onClick={() => setSel({ type: 'intro' })}>
        <span className="st-list__aa">Aa</span>
        <span className="st-list__body">
          <b>{draft.hero.title || DEFAULT_HERO.title}</b>
          <small>Обложка бренда и строка над моделями</small>
        </span>
      </button>

      <div className="st-list__label">Модели · перетащите, чтобы поменять порядок</div>
      {draft.models.map((m) => {
        const item = previewItem(m);
        const pos = m.enabled ? ++shown : null;
        return (
          <div key={m.key} {...rowProps(m.key)}
               className={`st-list__row${sel.key === m.key ? ' is-sel' : ''}${m.enabled ? '' : ' is-off'}${dragging === m.key ? ' is-drag' : ''}`}
               onClick={() => setSel({ type: 'model', key: m.key })}
               role="button" tabIndex={0}
               onKeyDown={(e) => { if (e.key === 'Enter') setSel({ type: 'model', key: m.key }); }}>
            <span className="st-grip" {...handleProps(m.key)} onClick={(e) => e.stopPropagation()} aria-label="Перетащить">
              <Svg name="grip" />
            </span>
            <span className="st-list__n">{pos ?? '—'}</span>
            <Thumb src={item.src} tone={item.tone} position={item.position} />
            <span className="st-list__body">
              <b>{item.model}</b>
              <small>
                {!m.enabled ? 'Скрыта с сайта' : m.photo ? m.text : canShow(m) ? <em>Нет своего фото — показан рендер</em> : <em>Нет фото — на сайте не показана</em>}
              </small>
            </span>
            {!m.enabled && <Svg name="eyeOff" className="st-list__flag" />}
          </div>
        );
      })}

      <div className="st-list__label">Кадры «на руке» · пауза между моделями</div>
      {draft.breaks.map(b => (
        <button key={b.id} type="button"
                className={`st-list__row${sel.id === b.id ? ' is-sel' : ''}${b.hidden || !b.photo ? ' is-off' : ''}`}
                onClick={() => setSel({ type: 'break', id: b.id })}>
          <span className="st-list__n">↳</span>
          <Thumb src={b.photo} tone={b.tone ?? b.toneAuto} position={previewBreak(b).position} />
          <span className="st-list__body">
            <b className="st-quote">{b.title || 'Без подписи'}</b>
            <small>{!b.photo ? 'Нет фото — не показывается' : b.hidden ? 'Скрыт' : `После ${b.after}-й модели`}</small>
          </span>
        </button>
      ))}
      <Button variant="ghost" size="s" onClick={() => {
        const id = Math.random().toString(36).slice(2, 10);
        setDraft(d => ({ ...d, breaks: [...d.breaks, { id, title: 'Как они выглядят на руке', after: Math.min(3 * (d.breaks.length + 1), d.models.length), photo: null, tone: null, toneAuto: null, focus: { x: 50, y: 30 }, hidden: false }] }));
        setSel({ type: 'break', id });
      }}>
        <Svg name="plus" size={16} />Добавить кадр
      </Button>
    </div>
  );
}

// ─── Правка модели ───────────────────────────────────────────────────────────

function ModelEditor({ m, index, count, update, move, price, was }) {
  const { busy, upload, recrop } = useUpload((fields) => update(fields));
  const item = previewItem(m);
  const slug = shankSlug(m.shank);

  return (
    <div className="st-editor">
      <div className="st-editor__preview">
        <PhotoStage
          photo={m.photo}
          focus={m.focus}
          busy={busy}
          onFile={(f) => upload(f, { x: 50, y: 50 })}
          onFocus={(focus) => update({ focus })}
          onFocusEnd={async (focus) => { const toneAuto = await retone(m.photo, focus); if (toneAuto) update({ toneAuto }); }}
        >
          <FeedCard item={item} price={price} was={was} />
        </PhotoStage>
      </div>

      <div className="st-editor__form">
        <div className="st-editor__head">
          <div>
            <div className="st-eyebrow">Модель {m.enabled ? `· ${index} из ${count}` : '· скрыта'}</div>
            <h2 className="st-h2">{item.model}</h2>
          </div>
          <div className="st-row st-row--tight">
            <Button variant="icon" onClick={() => move(-1)} aria-label="Выше"><Svg name="up" /></Button>
            <Button variant="icon" onClick={() => move(1)} aria-label="Ниже"><Svg name="down" /></Button>
          </div>
        </div>

        <Card title="Фото">
          <PhotoButtons photo={m.photo} busy={busy} onFile={(f) => upload(f)} onCrop={() => recrop(m.photo)}
                        onRemove={() => update({ photo: null, tone: null, toneAuto: null, focus: { x: 50, y: 50 } })}
                        removeLabel="Вернуть рендер" />
          <p className="st-muted">Перетащите файл прямо на карточку. После выбора откроется кадрирование под карточку 4 : 5; большие фото с камеры сожмутся сами.</p>
        </Card>

        <Card title="Цвет плашки" aside={<span className="st-muted st-muted--s">под текстом внизу карточки</span>}>
          <TonePicker photo={m.photo} focus={m.focus} tone={m.tone} toneAuto={m.toneAuto}
                      onChange={(tone) => update({ tone })} />
        </Card>

        <Card title="Текст">
          <Field label="Название" hint={m.name !== m.defaultName ? `В 3D-модели: ${m.defaultName}` : 'Так же называется на странице модели и в сообщении WhatsApp'}>
            <input className="st-input" value={m.name} maxLength={40} onChange={e => update({ name: e.target.value })} />
          </Field>
          <Field label="Описание" counter={<Counter value={m.text} soft={TEXT_SOFT} hard={TEXT_HARD} />}
                 hint={[...m.text].length > TEXT_HARD ? 'Не влезет в две строки — конец обрежется многоточием.' : 'Две строки на телефоне: как устроено кольцо, без обещаний.'}>
            <textarea className="st-input st-textarea" rows={3} value={m.text} maxLength={160}
                      onChange={e => update({ text: e.target.value })} />
          </Field>
        </Card>

        <Card>
          <div className="st-switchrow">
            <div>
              <b>Показывать на сайте</b>
              <small>Скрытая модель пропадает из ленты и из «Других моделей»; её страница открывается только по прямой ссылке.</small>
            </div>
            <Toggle on={m.enabled} onChange={(enabled) => update({ enabled })} label="Показывать на сайте" />
          </div>
        </Card>

        <a className="st-link" href={`/product/${slug}/${m.cast}/round`} target="_blank" rel="noopener noreferrer">
          Открыть страницу модели <Svg name="ext" size={14} />
        </a>
      </div>
    </div>
  );
}

// ─── Правка кадра «на руке» ──────────────────────────────────────────────────

function BreakEditor({ b, models, update, remove }) {
  const { busy, upload, recrop } = useUpload((fields) => update(fields));
  const visible = models.filter(m => m.enabled);

  return (
    <div className="st-editor">
      <div className="st-editor__preview">
        {b.photo ? (
          <PhotoStage photo={b.photo} focus={b.focus} busy={busy}
                      onFile={(f) => upload(f, { x: 50, y: 30 })}
                      onFocus={(focus) => update({ focus })}
                      onFocusEnd={async (focus) => { const toneAuto = await retone(b.photo, focus); if (toneAuto) update({ toneAuto }); }}>
            <FeedBreak item={previewBreak(b)} />
          </PhotoStage>
        ) : (
          <PhotoStage photo={null} focus={b.focus} busy={busy} onFile={(f) => upload(f, { x: 50, y: 30 })} onFocus={() => {}}>
            <div className="st-placeholder">
              <Svg name="photo" size={28} />
              <b>Фото на руке</b>
              <span>Перетащите сюда или нажмите «Загрузить фото». Без фото пауза в ленте не показывается.</span>
            </div>
          </PhotoStage>
        )}
      </div>

      <div className="st-editor__form">
        <div className="st-editor__head">
          <div>
            <div className="st-eyebrow">Кадр «на руке»</div>
            <h2 className="st-h2 st-quote">{b.title || 'Без подписи'}</h2>
          </div>
        </div>

        <Card title="Фото">
          <PhotoButtons photo={b.photo} busy={busy} onFile={(f) => upload(f)} onCrop={() => recrop(b.photo)}
                        onRemove={() => update({ photo: null, tone: null, toneAuto: null })} />
        </Card>

        <Card title="Цвет плашки">
          <TonePicker photo={b.photo} focus={b.focus} tone={b.tone} toneAuto={b.toneAuto} onChange={(tone) => update({ tone })} />
        </Card>

        <Card title="Подпись и место">
          <Field label="Подпись" counter={<Counter value={b.title} soft={32} hard={48} />}>
            <input className="st-input" value={b.title} maxLength={80} onChange={e => update({ title: e.target.value })} />
          </Field>
          <Field label="Где показать">
            <select className="st-input" value={b.after} onChange={e => update({ after: Number(e.target.value) })}>
              {visible.map((m, i) => (
                <option key={m.key} value={i + 1}>После {i + 1}-й — {m.name || m.defaultName}</option>
              ))}
            </select>
          </Field>
        </Card>

        <Card>
          <div className="st-switchrow">
            <div><b>Показывать в ленте</b><small>Можно спрятать, не удаляя фото.</small></div>
            <Toggle on={!b.hidden} onChange={(on) => update({ hidden: !on })} label="Показывать в ленте" />
          </div>
        </Card>

        <Button variant="danger" onClick={remove}><Svg name="trash" size={16} />Удалить кадр</Button>
      </div>
    </div>
  );
}

// ─── Заголовок ленты ─────────────────────────────────────────────────────────

function IntroEditor({ intro, hero, update, updateHero }) {
  const focusY = hero.focus?.y ?? 50;
  return (
    <div className="st-editor st-editor--single">
      <div className="st-editor__form">
        <div className="st-editor__head">
          <div>
            <div className="st-eyebrow">Начало ленты</div>
            <h2 className="st-h2">Обложка бренда</h2>
          </div>
        </div>
        <p className="st-muted">
          Первый экран: знак taena, обещание и фото рук двоих. Фото на сайте всегда чёрно-белое — загружайте любое, цвет уберётся сам.
          Пусто — подставится текст по умолчанию.
        </p>
        <Card>
          <Field label="Обещание" counter={<Counter value={hero.title} soft={40} hard={70} />}>
            <input className="st-input" value={hero.title} placeholder={DEFAULT_HERO.title} maxLength={80}
                   onChange={e => updateHero({ title: e.target.value })} />
          </Field>
          <Field label="Строка под ним" hint="Необязательно — пусто, и строки нет" counter={<Counter value={hero.sub} soft={70} hard={120} />}>
            <input className="st-input" value={hero.sub} placeholder="Пусто" maxLength={140}
                   onChange={e => updateHero({ sub: e.target.value })} />
          </Field>
          <div className="st-grid2">
            <Field label="Кнопка — к каталогу">
              <input className="st-input" value={hero.cta} placeholder={DEFAULT_HERO.cta} maxLength={40}
                     onChange={e => updateHero({ cta: e.target.value })} />
            </Field>
            <Field label="Кнопка — WhatsApp, свой дизайн">
              <input className="st-input" value={hero.cta2} placeholder={DEFAULT_HERO.cta2} maxLength={40}
                     onChange={e => updateHero({ cta2: e.target.value })} />
            </Field>
          </div>
          <FieldInput f={{ kind: 'image', label: 'Фото пары', aspects: [['4:5', 4 / 5], ['3:4', 3 / 4], ['1:1', 1]], hint: 'Пусто — стоит кольцо с овалом в пальцах. Своё: руки двоих, вертикальное или квадратное.' }}
                      value={hero.photo ?? ''} onChange={v => updateHero({ photo: v || null })} />
          {hero.photo && (
            <Field label={`Кадр по высоте — ${focusY}%`} hint="Двигайте, пока в кадре не окажутся руки">
              <input type="range" min="0" max="100" value={focusY} onChange={e => updateHero({ focus: { x: 50, y: Number(e.target.value) } })} />
            </Field>
          )}
        </Card>
        <Card>
          <Field label="Строка над моделями" counter={<Counter value={intro.title} soft={48} hard={60} />}
                 hint={`Пусто — «${DEFAULT_LIST_TITLE}»`}>
            <input className="st-input" value={intro.title} placeholder={DEFAULT_LIST_TITLE} maxLength={60}
                   onChange={e => update({ title: e.target.value })} />
          </Field>
        </Card>
      </div>
    </div>
  );
}

// ─── Телефон с лентой ────────────────────────────────────────────────────────

function PhonePreview({ draft, products, prices, onPick }) {
  const { models, breaks } = useMemo(() => previewFeed(draft, products), [draft, products]);
  return (
    <div className="st-phone">
      <div className="st-phone__label">Так увидит покупатель</div>
      <div className="st-phone__screen">
        <div className="feed">
          <div onClick={() => onPick({ type: 'intro' })} style={{ cursor: 'pointer' }}>
            <Hero hero={feedHero(draft)} onShow={() => {}} onDesign={() => {}} />
            <div className="feed-intro">
              <h2 className="feed-title">{typo(draft.intro.title || DEFAULT_LIST_TITLE)}</h2>
            </div>
          </div>
          <div className="feed-list">
            {models.map((item, i) => {
              const pause = breaks.find(b => b.after === i + 1);
              return (
                <div key={item.key} className="feed-slot">
                  <FeedCard item={item} price={fromPrice(prices, item.shank, item.cast)}
                            was={wasPrice(fromPrice(prices, item.shank, item.cast), prices, item.shank)}
                            onClick={() => onPick({ type: 'model', key: item.key })} />
                  {pause && <div onClick={() => onPick({ type: 'break', id: pause.id })}><FeedBreak item={pause} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Раздел ──────────────────────────────────────────────────────────────────

export default function FeedEditor() {
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { draft, setDraft, dirty, load, reset } = useDraft(null);
  const [sel, setSel] = useState({ type: 'model', key: null });
  const [mobileEdit, setMobileEdit] = useState(false);

  useEffect(() => {
    Promise.all([api('/api/content/feed?fresh'), fetchProducts(), fetchPrices()])
      .then(([content, prods, pr]) => {
        setProducts(prods);
        setPrices(pr);
        const d = toDraft(content, prods);
        load(d);
        setSel({ type: 'model', key: d.models[0]?.key });
      })
      .catch(e => setError(e.message));
  }, [load]);

  if (error) return <><PageHead title="Лента" /><ErrorNote>{error}</ErrorNote></>;
  if (!draft) return <><PageHead title="Лента" /><Loading /></>;

  const updateModel = (key, patch) => setDraft(d => ({ ...d, models: d.models.map(m => (m.key === key ? { ...m, ...patch } : m)) }));
  const updateBreak = (id, patch) => setDraft(d => ({ ...d, breaks: d.breaks.map(b => (b.id === id ? { ...b, ...patch } : b)) }));
  const pick = (s) => { setSel(s); setMobileEdit(true); };

  const visible = draft.models.filter(m => m.enabled);
  const model = sel.type === 'model' ? draft.models.find(m => m.key === sel.key) : null;
  const brk = sel.type === 'break' ? draft.breaks.find(b => b.id === sel.id) : null;
  const onSite = visible.filter(canShow);
  const noPhoto = onSite.filter(m => !m.photo).length;
  const waiting = visible.length - onSite.length;

  async function save() {
    setSaving(true);
    try {
      // Список моделей — свежий с сервера, а не тот, что был при открытии:
      // если модель тем временем удалили или добавили в «Модели и цены»,
      // сохранение ленты её не воскресит и не потеряет. Правки ленты (имя,
      // видимость, фото, текст, порядок) ложатся поверх.
      const current = mergeProducts(await api('/api/get-products?fresh'));
      const nextProducts = toProducts(draft, current);
      const productsChanged = JSON.stringify(nextProducts.rings) !== JSON.stringify(current.rings);
      if (productsChanged) {
        if (!nextProducts.rings.some(r => r.enabled)) throw new Error('Хотя бы одна модель должна остаться на сайте');
        setProducts(await saveProducts(nextProducts, getToken()));
      } else if (JSON.stringify(current.rings) !== JSON.stringify(products.rings)) {
        setProducts(current);
      }
      const saved = await api('/api/content/feed', { method: 'PUT', body: pruneFeed(toContent(draft), nextProducts) });
      const fresh = toDraft(saved, nextProducts);
      load(fresh);
      toast('Сохранено — лента на сайте уже обновилась');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  let editor = null;
  if (model) {
    const i = draft.models.indexOf(model);
    editor = (
      <ModelEditor
        m={model}
        index={visible.indexOf(model) + 1}
        count={visible.length}
        price={fromPrice(prices, model.shank, model.cast)}
        was={wasPrice(fromPrice(prices, model.shank, model.cast), prices, model.shank)}
        update={(p) => updateModel(model.key, p)}
        move={(dir) => setDraft(d => ({ ...d, models: moveItem(d.models, i, i + dir) }))}
      />
    );
  } else if (brk) {
    editor = (
      <BreakEditor b={brk} models={draft.models} update={(p) => updateBreak(brk.id, p)}
                   remove={() => {
                     if (!confirm('Удалить этот кадр из ленты?')) return;
                     setDraft(d => ({ ...d, breaks: d.breaks.filter(x => x.id !== brk.id) }));
                     setSel({ type: 'model', key: draft.models[0]?.key });
                     setMobileEdit(false);
                   }} />
    );
  } else if (sel.type === 'intro') {
    editor = <IntroEditor intro={draft.intro} hero={draft.hero}
                          update={(p) => setDraft(d => ({ ...d, intro: { ...d.intro, ...p } }))}
                          updateHero={(p) => setDraft(d => ({ ...d, hero: { ...d.hero, ...p } }))} />;
  }

  return (
    <div className={`st-feed${mobileEdit ? ' is-editing' : ''}`}>
      <PageHead
        title="Лента"
        sub={[
          noPhoto
            ? `На сайте ${onSite.length} ${onSite.length === 1 ? 'модель' : 'моделей'}. Своего фото нет у ${noPhoto} — там пока студийный рендер.`
            : `На сайте ${onSite.length} моделей, у всех свои фото.`,
          waiting ? `Ещё ${waiting} ждут фото — без него карточки на сайте нет.` : '',
        ].filter(Boolean).join(' ')}
      />

      <div className="st-feed__grid">
        <div className="st-feed__list">
          <ModelList draft={draft} setDraft={setDraft} sel={sel} setSel={pick} />
        </div>

        <div className="st-feed__editor">
          <button type="button" className="st-backbtn" onClick={() => setMobileEdit(false)}>
            <Svg name="back" />К списку
          </button>
          {editor}
        </div>

        <div className="st-feed__phone">
          <PhonePreview draft={draft} products={products} prices={prices} onPick={setSel} />
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
