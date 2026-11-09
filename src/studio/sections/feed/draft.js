import { DEFAULT_MODELS, DEFAULT_BREAKS, feedModels, feedBreaks, renderPhoto, toneOf } from '../../../catalog/data/feed.js';
import { modelName } from '../../../catalog/data/config.js';

// Черновик ленты в админке и обратно — в документы для сервера.
//
// Лента собирается из двух мест: видимость и название модели живут в
// настройках моделей (/api/set-products — их же читает страница модели), а
// фото, текст, цвет и порядок — в документе ленты (/api/content/feed). В
// черновике это одна строка на модель, чтобы править всё в одном месте.

export function toDraft(content, products) {
  const edits = new Map((content?.models ?? []).map(m => [m.key, m]));
  const order = [...(content?.models ?? []).map(m => m.key), ...DEFAULT_MODELS.map(m => m.key)]
    .filter((k, i, all) => all.indexOf(k) === i);
  const byKey = new Map(DEFAULT_MODELS.map(m => [m.key, m]));

  const models = order.flatMap(key => {
    const base = byKey.get(key);
    if (!base) return [];
    const edit = edits.get(key);
    const ring = products?.rings?.find(r => r.shank === base.shank && r.cast === base.cast);
    return [{
      key,
      shank: base.shank,
      cast: base.cast,
      defaultName: modelName(base.shank, base.cast),
      name: ring?.name || base.model,
      enabled: ring ? ring.enabled !== false : true,
      text: edit?.text || base.text,
      photo: edit?.photo ?? base.staticPhoto ?? null,
      tone: edit?.tone ?? null,
      toneAuto: edit?.toneAuto ?? (base.staticPhoto && !edit?.photo ? toneOf(base.staticPhoto) : null),
      focus: edit?.focus ?? { x: 50, y: 50 },
    }];
  });

  const breaks = Array.isArray(content?.breaks)
    ? content.breaks.map(b => ({ ...b, focus: b.focus ?? { x: 50, y: 30 } }))
    : DEFAULT_BREAKS;

  return {
    intro: { title: content?.intro?.title ?? '', sub: content?.intro?.sub ?? '' },
    hero: { title: content?.hero?.title ?? '', sub: content?.hero?.sub ?? '', cta: content?.hero?.cta ?? '', cta2: content?.hero?.cta2 ?? '', photo: content?.hero?.photo ?? null, focus: content?.hero?.focus ?? { x: 50, y: 50 } },
    models,
    breaks,
  };
}

export function toContent(draft) {
  return {
    intro: draft.intro,
    hero: draft.hero,
    models: draft.models.map(({ key, text, photo, tone, toneAuto, focus }) => ({ key, text, photo, tone, toneAuto, focus })),
    breaks: draft.breaks.map(({ id, title, after, photo, tone, toneAuto, focus, hidden }) => ({ id, title, after, photo, tone, toneAuto, focus, hidden })),
  };
}

export function toProducts(draft, products) {
  return {
    ...products,
    rings: products.rings.map(r => {
      const m = draft.models.find(x => x.shank === r.shank && x.cast === r.cast);
      return m ? { ...r, name: m.name.trim() || m.defaultName, enabled: m.enabled } : r;
    }),
  };
}

/** Лента так, как её увидит покупатель, — теми же функциями, что и сайт. */
export function previewFeed(draft, products) {
  const content = toContent(draft);
  const prods = toProducts(draft, products);
  return { models: feedModels(prods, content), breaks: feedBreaks(content) };
}

/** Одна карточка для предпросмотра — в том числе скрытая модель. */
export function previewItem(m) {
  const src = m.photo ?? renderPhoto(m.shank, m.cast);
  return {
    key: m.key,
    model: m.name || m.defaultName,
    text: m.text,
    shank: m.shank,
    cast: m.cast,
    src,
    tone: m.photo ? (m.tone ?? m.toneAuto ?? '#3E3E3E') : '#3E3E3E',
    position: `${m.focus?.x ?? 50}% ${m.focus?.y ?? 50}%`,
  };
}

export function previewBreak(b) {
  return {
    id: b.id,
    title: b.title,
    src: b.photo,
    tone: b.tone ?? b.toneAuto ?? '#3E3E3E',
    position: `${b.focus?.x ?? 50}% ${b.focus?.y ?? 30}%`,
  };
}
