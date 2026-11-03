import { useEffect, useState } from 'react';
import { getToken } from '../api.js';
import { Card, ErrorNote, Loading, PageHead, SaveBar, Toggle, useDraft, useToast } from '../ui.jsx';
import { fetchProducts, saveProducts } from '../../catalog/data/products.js';
import { fetchPrices, savePrices, SHANK_LABELS } from '../../catalog/data/prices.js';
import { SHAPES, shapeImage } from '../../catalog/data/config.js';
import { formatPrice } from '../../catalog/data/priceCalc.js';

// Раздел «Модели и цены»: какие огранки и модели есть на сайте, как они
// называются и сколько стоят.
//
// Привязка к 3D-модели (названия шинок и тегов в iJewel) в коде и здесь не
// меняется: опечатка там сломала бы просмотр, а не просто подпись.

const CAST_LABELS = { halo: 'Ореол (Halo)', bezel: 'Ободок (Bezel)' };

/** Сумма с пробелами между тысячами; пока поле в фокусе — просто цифры. */
function Money({ value, onChange }) {
  const [text, setText] = useState(null);
  return (
    <span className="st-money">
      <input className="st-input st-input--money" inputMode="numeric"
             value={text ?? (value ? value.toLocaleString('ru-RU') : '0')}
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
      <Money value={value} onChange={onChange} />
    </div>
  );
}

export default function CatalogEditor() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { draft, setDraft, saved, dirty, load, reset } = useDraft(null);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchPrices()])
      .then(([products, prices]) => load({ products, prices }))
      .catch(e => setError(e.message));
  }, [load]);

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
        if (!draft.products.shapes.some(s => s.enabled)) throw new Error('Хотя бы одна огранка должна остаться');
        next = { ...next, products: await saveProducts(draft.products, getToken()) };
      }
      if (JSON.stringify(draft.prices) !== JSON.stringify(saved.prices)) {
        next = { ...next, prices: await savePrices(draft.prices, getToken()) };
      }
      load(next);
      toast('Сохранено — на сайте уже новые цены и названия');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const example = (prices.baseByShank?.Sirius ?? 0) + (prices.caratPrice ?? 0) * 1 + (prices.purity750surcharge ?? 0);

  return (
    <div className="st-catalog">
      <PageHead title="Модели и цены" sub="Названия, видимость и цены. Сохранили — сайт пересчитал всё сразу, включая цены в ленте и текст сообщений в WhatsApp." />

      <div className="st-grid st-grid--catalog">
        <div className="st-stack">
          <Card title="Базовая цена модели" aside={<span className="st-muted st-muted--s">1 ct, белый бриллиант, 585 проба</span>}>
            {SHANK_LABELS.map(shank => (
              <PriceRow key={shank} label={shank} value={prices.baseByShank?.[shank] ?? 0}
                        onChange={v => setPrices(p => ({ ...p, baseByShank: { ...p.baseByShank, [shank]: v } }))} />
            ))}
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
            {products.rings.map(r => (
              <div key={`${r.shank}|${r.cast}`} className={`st-itemrow${r.enabled ? '' : ' is-off'}`}>
                <span className="st-itemrow__main">
                  <input className="st-input st-input--bare" value={r.name} maxLength={40}
                         onChange={e => setProducts(p => ({ ...p, rings: p.rings.map(x => (x === r ? { ...x, name: e.target.value } : x)) }))} />
                  <small className="st-mono">{r.shank} · {r.cast}</small>
                </span>
                <Toggle on={r.enabled} label={`Показывать ${r.name}`}
                        onChange={v => setProducts(p => ({ ...p, rings: p.rings.map(x => (x === r ? { ...x, enabled: v } : x)) }))} />
              </div>
            ))}
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
    </div>
  );
}
