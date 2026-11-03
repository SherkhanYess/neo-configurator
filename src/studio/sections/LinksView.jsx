import { useState } from 'react';
import { Button, Card, Field, PageHead, Svg, useToast } from '../ui.jsx';
import { UTM_PRESETS, buildUtmUrl } from '../utm.js';
import { DEFAULT_MODELS } from '../../catalog/data/feed.js';

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

export default function LinksView() {
  const copy = useCopy();
  const [form, setForm] = useState({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: '', target: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: k === 'target' ? e.target.value : latin(e.target.value) }));
  const custom = buildUtmUrl({ utm_source: form.utm_source, utm_medium: form.utm_medium, utm_campaign: form.utm_campaign }, form.target);

  return (
    <div className="st-links">
      <PageHead title="Ссылки" sub="Размещайте только ссылки отсюда — тогда каждый источник будет виден в аналитике и в коде заявки в WhatsApp." />

      <Card title="Своя ссылка">
        <div className="st-grid3">
          <Field label="Источник" hint="meta, instagram, tiktok…"><input className="st-input" value={form.utm_source} onChange={set('utm_source')} /></Field>
          <Field label="Размещение" hint="paid, bio, stories…"><input className="st-input" value={form.utm_medium} onChange={set('utm_medium')} /></Field>
          <Field label="Кампания" hint="одно слово: obraz, vitrina"><input className="st-input" value={form.utm_campaign} onChange={set('utm_campaign')} /></Field>
        </div>
        <Field label="Куда ведёт">
          <select className="st-input" value={form.target} onChange={set('target')}>
            <option value="">Лента — все модели</option>
            {DEFAULT_MODELS.map(m => (
              <option key={m.key} value={`/product/${slugOf(m.shank)}/${m.cast}/round`}>Страница модели {m.model}</option>
            ))}
          </select>
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
