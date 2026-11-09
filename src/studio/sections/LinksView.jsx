import { useEffect, useState } from 'react';
import { Button, Card, Field, PageHead, Svg, useToast } from '../ui.jsx';
import { ADS_URL_PARAMS, BASE, UTM_PRESETS, buildUtmUrl } from '../utm.js';
import { useProducts } from '../../catalog/data/products.js';
import { guideList, guidePath } from '../../catalog/data/guides.js';
import { api } from '../api.js';

// Раздел «Ссылки»: готовые ссылки с метками для мест, откуда идут люди.
//
// Метки пишутся один раз и правильно: опечатка в utm_source молча заводит
// второй источник, который в аналитике уже не сойдётся с первым. Кампания
// попадает в код источника в сообщении WhatsApp, поэтому её имя — одно
// короткое латинское слово.

function useCopy() {
  const toast = useToast();
  return async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Ссылка скопирована'); }
    catch { toast('Не получилось скопировать — выделите ссылку вручную', 'error'); }
  };
}

const slugOf = (shank) => shank.toLowerCase().replace(/\s+/g, '-');
const latin = (v) => v.toLowerCase().replace(/[^a-z0-9_-]/g, '');

/** Гиды — какими их сохранили в админке, а без этого — из кода. */
function useGuides() {
  const [doc, setDoc] = useState(null);
  useEffect(() => { api('/api/content/guides?fresh').then(setDoc).catch(() => {}); }, []);
  return guideList(doc);
}

/** Куда ведёт ссылка: лента, страница модели или гид. */
function TargetSelect({ value, onChange, models, guides }) {
  return (
    <select className="st-input" value={value} onChange={onChange}>
      <option value="">Лента — все модели</option>
      <optgroup label="Модели">
        {models.map(m => (
          <option key={m.key} value={`/product/${slugOf(m.shank)}/${m.cast}/round`}>{m.model}</option>
        ))}
      </optgroup>
      <optgroup label="Гиды">
        {guides.map(g => <option key={g.slug} value={guidePath(g.slug)}>{g.title}</option>)}
      </optgroup>
    </select>
  );
}

/**
 * Реклама: в Ads Manager на объявлении два поля — «Веб-сайт» (чистый адрес
 * посадочной) и «Параметры URL» (одна строка на все объявления). Метки
 * кампании и креатива Meta подставляет сама.
 */
function AdsCard({ copy, models, guides }) {
  const [landing, setLanding] = useState('');
  const site = `${BASE}${landing}`;
  return (
    <Card title="Реклама в Ads Manager" aside={<span className="st-muted st-muted--s">два поля в объявлении</span>}>
      <Field label="1. Веб-сайт" hint="Куда ведёт объявление. Адрес без меток — метки добавит строка ниже">
        <TargetSelect value={landing} onChange={e => setLanding(e.target.value)} models={models} guides={guides} />
      </Field>
      <div className="st-urlbox">
        <code>{site}</code>
        <Button variant="secondary" onClick={() => copy(site)}><Svg name="copy" size={16} />Копировать</Button>
      </div>
      <Field label="2. Параметры URL" hint="Одна и та же строка во всех объявлениях. Кампанию, креатив и номер объявления Meta подставит сама">
        <div className="st-urlbox" style={{ marginTop: 0 }}>
          <code>{ADS_URL_PARAMS}</code>
          <Button onClick={() => copy(ADS_URL_PARAMS)}><Svg name="copy" size={16} />Копировать</Button>
        </div>
      </Field>
      <p className="st-note">
        Кампании называйте «РК Тема_Таргет» или «РК Тема_Ретаргет», например «РК Образ_Ретаргет», и не переименовывайте
        после запуска — иначе одна кампания распадётся в аналитике на две. Креативы — как удобно.
      </p>
    </Card>
  );
}

export default function LinksView() {
  const copy = useCopy();
  const guides = useGuides();
  // Все модели, у которых есть своя страница, — и те, что не стоят в ленте.
  const models = useProducts().rings.map(r => ({ key: `${r.shank}|${r.cast}`, shank: r.shank, cast: r.cast, model: r.name }));
  // Своя ссылка — для мест не из рекламы (рекламные метки ставит Ads Manager).
  const [form, setForm] = useState({ utm_source: 'instagram', utm_medium: 'bio', utm_campaign: '', target: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: k === 'target' ? e.target.value : latin(e.target.value) }));
  const custom = buildUtmUrl({ utm_source: form.utm_source, utm_medium: form.utm_medium, utm_campaign: form.utm_campaign }, form.target);

  return (
    <div className="st-links">
      <PageHead title="Ссылки" sub="Размещайте только ссылки отсюда — тогда каждый источник будет виден в аналитике и в коде заявки в WhatsApp." />

      <AdsCard copy={copy} models={models} guides={guides} />

      <Card title="Своя ссылка" aside={<span className="st-muted st-muted--s">не для рекламы: профиль, сторис, рассылка</span>}>
        <div className="st-grid3">
          <Field label="Площадка" hint="instagram, tiktok…"><input className="st-input" value={form.utm_source} onChange={set('utm_source')} /></Field>
          <Field label="Размещение" hint="bio, stories, post, manager…"><input className="st-input" value={form.utm_medium} onChange={set('utm_medium')} /></Field>
          <Field label="Кампания" hint="одно слово: obraz, vitrina"><input className="st-input" value={form.utm_campaign} onChange={set('utm_campaign')} /></Field>
        </div>
        <Field label="Куда ведёт">
          <TargetSelect value={form.target} onChange={set('target')} models={models} guides={guides} />
        </Field>
        <div className="st-urlbox">
          <code>{custom}</code>
          <Button onClick={() => copy(custom)}><Svg name="copy" size={16} />Копировать</Button>
        </div>
      </Card>

      <div className="st-list-links">
        {UTM_PRESETS.map(p => {
          const url = buildUtmUrl(p.params);
          return (
            <div key={p.id} className="st-linkrow">
              <div className="st-linkrow__text">
                <b>{p.title}</b>
                <small>{p.note}</small>
                <code>{url}</code>
              </div>
              <Button variant="secondary" onClick={() => copy(url)}><Svg name="copy" size={16} />Копировать</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
