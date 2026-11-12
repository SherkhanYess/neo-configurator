import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '../api.js';
import { Button, Card, ErrorNote, Field, Loading, Modal, PageHead, SaveBar, Svg, Toggle, useDraft, useToast } from '../ui.jsx';
import { fetchProducts, saveProducts } from '../../catalog/data/products.js';
import { fetchPrices, savePrices } from '../../catalog/data/prices.js';
import { SHAPES, shapeImage } from '../../catalog/data/config.js';
import { mergeProducts, modelShanks, prunePrices } from '../../catalog/data/models.js';
import { calcPrice, formatPrice } from '../../catalog/data/priceCalc.js';
import { addModelToSite, clearLeftovers, findLeftovers, planRemoval, removeModelEverywhere } from '../models.js';

// Раздел «Модели и цены»: какие модели и огранки есть на сайте, как они
// называются и сколько стоят. Здесь же модели добавляют и удаляют
// (src/studio/models.js): удаление стирает модель отовсюду — из ленты, цен,
// ссылок в гидах и хранилища фото.
//
// Модель держится за шинку в 3D-сцене iJewel — её точное имя вводят при
// добавлении. Теги огранок и оправ — в коде: опечатка там сломала бы просмотр.

const CAST_NAMES = { classic: 'на лапках', halo: 'с ореолом', bezel: 'в ободке' };

const CAST_LABELS = { halo: 'Ореол (Halo)', bezel: 'Ободок (Bezel)' };

/**
 * Сумма с пробелами между тысячами; пока поле в фокусе — просто цифры.
 * placeholder — для необязательной суммы: пустое поле вместо «0».
 */
function Money({ value, onChange, placeholder, label }) {
  const [text, setText] = useState(null);
  return (
    <span className="st-money">
      <input className="st-input st-input--money" inputMode="numeric" placeholder={placeholder} aria-label={label}
             value={text ?? (value ? value.toLocaleString('ru-RU') : (placeholder ? '' : '0'))}
             onFocus={() => setText(String(value || ''))}
             onChange={e => { const d = e.target.value.replace(/\D/g, ''); setText(d); onChange(Number(d || 0)); }}
             onBlur={() => setText(null)} />
      <span>₸</span>
    </span>
  );
}

function PriceRow({ label, hint, value, onChange }) {
  return (
    <div className="st-pricerow">
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <Money value={value} onChange={onChange} label={label} />
    </div>
  );
}

/**
 * Базовая цена модели и цена со скидкой под ней. Пустая цена со скидкой —
 * скидки нет. Подпись сразу считает, сколько это в тенге и процентах, и
 * предупреждает, если цена со скидкой не ниже базовой (тогда сайт её не
 * покажет).
 */
function ModelPriceRow({ label, hint, base, sale, onBase, onSale }) {
  const off = sale > 0 && sale < base ? base - sale : 0;
  const note = !sale ? 'пусто — без скидки'
    : off ? `−${formatPrice(off)} · −${Math.round((off / base) * 100)}%`
    : 'должна быть меньше базовой — сейчас скидки нет';
  return (
    <div className="st-pricerow st-pricerow--model">
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <span className="st-pricerow__fields">
        <Money value={base} onChange={onBase} label={`${label}: базовая цена`} />
        <span className="st-pricerow__sale">
          <small className={sale && !off ? 'st-pricerow__warn' : undefined}>Со скидкой: {note}</small>
          <Money value={sale} onChange={onSale} placeholder="—" label={`${label}: цена со скидкой`} />
        </span>
      </span>
    </div>
  );
}

/** Цена со скидкой: 0 стирает запись, чтобы в документе не копились нули. */
function withSale(prices, shank, v) {
  const sale = { ...(prices.saleByShank ?? {}) };
  if (v) sale[shank] = v; else delete sale[shank];
  return { ...prices, saleByShank: sale };
}

export default function CatalogEditor() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { draft, setDraft, saved, dirty, load, reset } = useDraft(null);
  const [removing, setRemoving] = useState(null);
  const [adding, setAdding] = useState(false);
  const [leftovers, setLeftovers] = useState(null);
  const [busyLeft, setBusyLeft] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([fetchProducts(), fetchPrices()])
      .then(([products, prices]) => load({ products, prices }))
      .catch(e => setError(e.message));
    findLeftovers().then(setLeftovers).catch(() => setLeftovers(null));
  }, [load]);

  useEffect(() => { refresh(); }, [refresh]);

  const afterChange = useCallback(() => { setRemoving(null); setAdding(false); refresh(); }, [refresh]);

  if (error) return <><PageHead title="Модели и цены" /><ErrorNote>{error}</ErrorNote></>;
  if (!draft) return <><PageHead title="Модели и цены" /><Loading /></>;

  const { products, prices } = draft;
  const setProducts = (fn) => setDraft(d => ({ ...d, products: fn(d.products) }));
  const setPrices = (fn) => setDraft(d => ({ ...d, prices: fn(d.prices) }));

  async function save() {
    setSaving(true);
    try {
      let next = { ...draft };
      if (JSON.stringify(draft.products) !== JSON.stringify(saved.products)) {
        // Список моделей могли поменять, пока страница была открыта (другая
        // вкладка, другой человек). Сохранить поверх — значит вернуть удалённую
        // модель или стереть добавленную. Лучше остановиться.
        const keys = (p) => p.rings.map(r => `${r.shank}|${r.cast}`).join(',');
        if (keys(mergeProducts(await api('/api/get-products?fresh'))) !== keys(saved.products)) {
          throw new Error('Пока страница была открыта, список моделей изменили. Обновите страницу и повторите правку.');
        }
        if (!draft.products.shapes.some(s => s.enabled)) throw new Error('Хотя бы одна огранка должна остаться');
        next = { ...next, products: await saveProducts(draft.products, getToken()) };
      }
      if (JSON.stringify(draft.prices) !== JSON.stringify(saved.prices)) {
        next = { ...next, prices: await savePrices(prunePrices(draft.prices, draft.products), getToken()) };
      }
      load(next);
      toast('Сохранено — на сайте уже новые цены и названия');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Удаление и добавление пишут на сервер сразу — несохранённые правки на
  // экране при этом потерялись бы. Сначала сохранить или отменить.
  const guard = () => {
    if (!dirty) return true;
    toast('Сначала сохраните или отмените правки на этой странице', 'error');
    return false;
  };
  function askRemove(shank) {
    if (!guard()) return;
    setRemoving({ shank, loading: true });
    planRemoval(shank).then(setRemoving).catch(e => { setRemoving(null); toast(e.message, 'error'); });
  }
  function askAdd() { if (guard()) setAdding(true); }
  async function wipeLeftovers() {
    setBusyLeft(true);
    try { await clearLeftovers(leftovers); toast('Следы удалённых моделей стёрты'); refresh(); }
    catch (e) { toast(e.message, 'error'); }
    finally { setBusyLeft(false); }
  }

  // Та же формула, что на сайте, — со скидкой, если она есть.
  const example = calcPrice({ shankLabel: 'Sirius', cast: 'classic', carat: 2, purity: '750' }, prices);

  return (
    <div className="st-catalog">
      <PageHead title="Модели и цены" sub="Названия, видимость и цены. Сохранили — сайт пересчитал всё сразу, включая цены в ленте и текст сообщений в WhatsApp." />

      <div className="st-grid st-grid--catalog">
        <div className="st-stack">
          <Card title="Базовая цена модели" aside={<span className="st-muted st-muted--s">1 ct, белый бриллиант, 585 проба</span>}>
            {modelShanks(products).map(shank => (
              <ModelPriceRow key={shank} label={mainName(products, shank)} hint={mainName(products, shank) !== shank ? `шинка ${shank}` : undefined}
                             base={prices.baseByShank?.[shank] ?? 0}
                             sale={prices.saleByShank?.[shank] ?? 0}
                             onBase={v => setPrices(p => ({ ...p, baseByShank: { ...p.baseByShank, [shank]: v } }))}
                             onSale={v => setPrices(p => withSale(p, shank, v))} />
            ))}
            <p className="st-note">
              Скидка — разница между базовой ценой и ценой со скидкой. Она вычитается из всех вариантов модели: с ореолом,
              с другим каратом и пробой. На сайте новая цена стоит рядом со старой зачёркнутой — в ленте, на странице модели и
              в «Других моделях». Убрать скидку — стереть цену со скидкой.
            </p>
          </Card>

          <Card title="Доплаты">
            {Object.entries(CAST_LABELS).map(([id, label]) => (
              <PriceRow key={id} label={label} hint="к цене модели" value={prices.casts?.[id] ?? 0}
                        onChange={v => setPrices(p => ({ ...p, casts: { ...p.casts, [id]: v } }))} />
            ))}
            <PriceRow label="За каждый карат сверх 1" hint="1,5 ct — половина, 2 ct — полная сумма" value={prices.caratPrice ?? 0}
                      onChange={v => setPrices(p => ({ ...p, caratPrice: v }))} />
            <PriceRow label="Проба 750" hint="вместо 585" value={prices.purity750surcharge ?? 0}
                      onChange={v => setPrices(p => ({ ...p, purity750surcharge: v }))} />
            <PriceRow label="Цветной центральный камень" hint="за карат" value={prices.fancyColorSurcharge ?? 0}
                      onChange={v => setPrices(p => ({ ...p, fancyColorSurcharge: v }))} />
            <PriceRow label="Цветная россыпь" hint="за каждую зону, у ореола — дважды" value={prices.scatterFancySurcharge ?? 0}
                      onChange={v => setPrices(p => ({ ...p, scatterFancySurcharge: v }))} />
            <p className="st-note">Пример: Sirius 2 ct, проба 750 — <b className="st-mono">{formatPrice(example)}</b></p>
          </Card>
        </div>

        <div className="st-stack">
          <Card title="Модели" aside={<span className="st-muted st-muted--s">фото и тексты — в разделе «Лента»</span>}>
            <p className="st-note" style={{ marginTop: 0 }}>
              Модели с ореолом (кроме Halo Luxe) в ленте не стоят — их открывают переключателем «С ореолом» на странице модели без
              ореола. Название из этого списка показывается везде: в ленте, на странице модели, в «Других моделях» и в сообщении WhatsApp.
              Выключенная модель пропадает из ленты, а её ореол — из переключателя. «В ленте» — своя карточка в ленте
              (у ореола обычно нет: его включают на странице модели).
            </p>
            {leftovers && (
              <div className="st-leftovers">
                <span>Остались следы удалённых моделей ({leftovers.names.join(', ')}): цены, тексты или фото. На сайте их не видно.</span>
                <Button size="s" variant="secondary" busy={busyLeft} onClick={wipeLeftovers}>Стереть</Button>
              </div>
            )}
            {modelShanks(products).map(shank => (
              <div key={shank} className="st-model">
                <div className="st-model__head">
                  <span className="st-eyebrow">{shank}</span>
                  <Button variant="ghost" size="s" onClick={() => askRemove(shank)}><Svg name="trash" size={15} />Удалить</Button>
                </div>
                {products.rings.filter(r => r.shank === shank).map(r => (
                  <div key={`${r.shank}|${r.cast}`} className={`st-itemrow${r.enabled ? '' : ' is-off'}`}>
                    <span className="st-itemrow__main">
                      <input className="st-input st-input--bare" value={r.name} maxLength={40} aria-label={`Название: ${CAST_NAMES[r.cast]}`}
                             onChange={e => setProducts(p => ({ ...p, rings: p.rings.map(x => (x === r ? { ...x, name: e.target.value } : x)) }))} />
                      <small>{CAST_NAMES[r.cast]}</small>
                    </span>
                    <button type="button" className={`st-chip st-model__feed${r.feed ? ' is-on' : ''}`} aria-pressed={r.feed}
                            title="Своя карточка в ленте"
                            onClick={() => setProducts(p => ({ ...p, rings: p.rings.map(x => (x === r ? { ...x, feed: !x.feed } : x)) }))}>
                      В ленте
                    </button>
                    <Toggle on={r.enabled} label={`Показывать ${r.name}`}
                            onChange={v => setProducts(p => ({ ...p, rings: p.rings.map(x => (x === r ? { ...x, enabled: v } : x)) }))} />
                  </div>
                ))}
              </div>
            ))}
            <Button variant="secondary" className="st-models__add" onClick={askAdd}><Svg name="plus" size={16} />Добавить модель</Button>
          </Card>

          <Card title="Огранки" aside={<span className="st-muted st-muted--s">выбор на странице модели</span>}>
            <div className="st-shapes">
              {products.shapes.map(s => {
                const file = SHAPES.find(x => x.id === s.id)?.file;
                return (
                  <div key={s.id} className={`st-shape${s.enabled ? '' : ' is-off'}`}>
                    {file && <img src={shapeImage(file)} alt="" width={40} height={40} />}
                    <input className="st-input st-input--bare" value={s.label} maxLength={30}
                           onChange={e => setProducts(p => ({ ...p, shapes: p.shapes.map(x => (x.id === s.id ? { ...x, label: e.target.value } : x)) }))} />
                    <Toggle on={s.enabled} label={`Показывать ${s.label}`}
                            onChange={v => setProducts(p => ({ ...p, shapes: p.shapes.map(x => (x.id === s.id ? { ...x, enabled: v } : x)) }))} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />

      {removing && <RemoveDialog plan={removing} onClose={() => setRemoving(null)} onDone={afterChange} />}
      {adding && <AddDialog onClose={() => setAdding(false)} onDone={afterChange} />}
    </div>
  );
}

/** Имя модели в списках: вариант без ореола (или в ободке), а нет его — шинка. */
function mainName(products, shank) {
  const rings = products.rings.filter(r => r.shank === shank);
  return (rings.find(r => r.cast !== 'halo') ?? rings[0])?.name || shank;
}

function RemoveDialog({ plan, onClose, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (plan.loading) {
    return <Modal title={`Удалить ${plan.shank}?`} onClose={onClose}><Loading label="Смотрим, где она есть…" /></Modal>;
  }
  async function go() {
    setBusy(true);
    try {
      const res = await removeModelEverywhere(plan.shank);
      const extra = [res.photosDeleted && `фото: ${res.photosDeleted}`, res.guidesFixed && `ссылки в гидах: ${res.guidesFixed}`].filter(Boolean).join(', ');
      toast(`${plan.names.join(' и ')} — удалена отовсюду${extra ? ` (${extra})` : ''}`);
      onDone();
    } catch (e) {
      toast(e.message, 'error');
      setBusy(false);
    }
  }
  const list = [
    `${plan.names.length > 1 ? 'Модели' : 'Модель'} ${plan.names.join(' и ')} — из ленты, «Других моделей», ссылок и WhatsApp`,
    plan.pages && `Страницы модели на сайте (${plan.pages}) — по старым ссылкам человек попадёт в ленту`,
    plan.price && 'Базовая цена',
    plan.feedText && 'Текст карточки в ленте',
    plan.photos && `Загруженные фото (${plan.photos}) — из хранилища`,
    plan.linked.length && `Карточки и ссылки на неё в гидах: ${plan.linked.map(t => `«${t}»`).join(', ')}`,
  ].filter(Boolean);
  return (
    <Modal title={`Удалить ${plan.names[0]} насовсем?`} onClose={onClose}
           actions={<>
             <Button variant="ghost" onClick={onClose} disabled={busy}>Отмена</Button>
             <Button variant="danger" onClick={go} busy={busy} disabled={plan.lastOne}>Удалить</Button>
           </>}>
      <p>Сотрём всё, что с ней связано:</p>
      <ul>{list.map(x => <li key={x}>{x}</li>)}</ul>
      {plan.mentioned.length > 0 && (
        <p className="st-modal__warn">Название упоминается в тексте гидов: {plan.mentioned.map(t => `«${t}»`).join(', ')}. Текст мы не трогаем — поправьте его в разделе «Гиды».</p>
      )}
      {plan.lastOne
        ? <p className="st-modal__warn">Это последняя модель — без неё сайту нечего показать.</p>
        : <p className="st-muted st-muted--s">Вернуть можно только добавив модель заново. 3D-шинка в iJewel остаётся — её мы не трогаем.</p>}
    </Modal>
  );
}

function AddDialog({ onClose, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', shank: '', mount: 'prongs', halo: true, haloName: '', price: 0 });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  async function go() {
    setBusy(true);
    try {
      await addModelToSite(form);
      toast(`${form.name || form.shank} добавлена. Загрузите фото в «Ленте» — без фото карточки в ленте не будет`);
      onDone();
    } catch (e) {
      toast(e.message, 'error');
      setBusy(false);
    }
  }
  return (
    <Modal title="Новая модель" onClose={onClose}
           actions={<>
             <Button variant="ghost" onClick={onClose} disabled={busy}>Отмена</Button>
             <Button onClick={go} busy={busy} disabled={!form.shank.trim()}>Добавить</Button>
           </>}>
      <Field label="Название на сайте" hint="Как её увидит покупатель">
        <input className="st-input" value={form.name} maxLength={40} placeholder="Aurora" onChange={e => set('name')(e.target.value)} />
      </Field>
      <Field label="Шинка в 3D" hint="Точное имя вариации шинки в iJewel, латиницей. Сначала добавьте шинку в сцену iJewel — без неё 3D на странице модели не покажет кольцо">
        <input className="st-input" value={form.shank} maxLength={30} placeholder="Aurora" autoCapitalize="off" autoCorrect="off" spellCheck={false}
               onChange={e => set('shank')(e.target.value)} />
      </Field>
      <div className="st-field">
        <span className="st-field__label">Как держится камень</span>
        <div className="st-chips">
          {[['prongs', 'На лапках'], ['bezel', 'В ободке']].map(([v, l]) => (
            <button key={v} type="button" className={`st-chip${form.mount === v ? ' is-on' : ''}`} aria-pressed={form.mount === v} onClick={() => set('mount')(v)}>{l}</button>
          ))}
        </div>
      </div>
      {form.mount === 'prongs' && (
        <div className="st-switchrow">
          <div><b>Есть вариант с ореолом</b><small>Переключатель «С ореолом» на странице модели</small></div>
          <Toggle on={form.halo} onChange={set('halo')} label="Есть вариант с ореолом" />
        </div>
      )}
      {form.mount === 'prongs' && form.halo && (
        <Field label="Название с ореолом">
          <input className="st-input" value={form.haloName} maxLength={40} placeholder={`${form.name || form.shank || 'Aurora'} Halo`} onChange={e => set('haloName')(e.target.value)} />
        </Field>
      )}
      <div className="st-field">
        <span className="st-field__label">Базовая цена</span>
        <PriceRow label="1 ct, белый бриллиант, 585 проба" value={form.price} onChange={set('price')} />
      </div>
    </Modal>
  );
}
