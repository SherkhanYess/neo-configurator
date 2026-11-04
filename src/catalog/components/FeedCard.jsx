import { useLayoutEffect, useRef } from 'react';
import { formatPrice } from '../data/priceCalc.js';
import { useQuoteFont } from '../lib/useQuoteFont.js';

// Карточка ленты и пауза «на руке» — одна разметка для витрины и для
// предпросмотра в админке: что видно в админке, то и увидит покупатель.

/**
 * Имя и цена в одну строку через черту. Длинному имени («Neo Halo Luxe» на
 * узком телефоне) цена уступает строку и встаёт под него; черта тогда прячется,
 * иначе она повисает в конце строки.
 */
function NameRow({ name, price }) {
  const rowRef = useRef(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const [nameEl, divider, priceEl] = row.children;
    const fit = () => {
      if (!priceEl) return;
      divider.hidden = false;
      divider.hidden = priceEl.offsetTop >= nameEl.offsetTop + nameEl.offsetHeight;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [name, price]);

  return (
    <div className="feed-card__row" ref={rowRef}>
      <h2 className="feed-card__name">{name}</h2>
      {price ? <span className="feed-card__divider" aria-hidden="true" /> : null}
      {price ? <span className="feed-card__price">от {formatPrice(price)}</span> : null}
    </div>
  );
}

/** `as` — Link на витрине, div в админке. */
export function FeedCard({ item, price, priority, as: Tag = 'div', ...rest }) {
  return (
    <Tag className="feed-card" style={{ '--tone': item.tone }} {...rest}>
      <div className="feed-card__photo">
        <img
          src={item.src}
          alt={`Кольцо ${item.model}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          style={item.position ? { objectPosition: item.position } : undefined}
        />
      </div>
      <div className="feed-card__body">
        <NameRow name={item.model} price={price} />
        <p className="feed-card__text">{item.text}</p>
        <span className="feed-card__cta">Смотреть модель</span>
      </div>
    </Tag>
  );
}

/** `cta` — ссылка «Записаться на примерку» или null в предпросмотре. */
export function FeedBreak({ item, cta }) {
  useQuoteFont();
  return (
    <div className="feed-break" style={{ '--tone': item.tone }}>
      <img src={item.src} alt="Кольца на руке" loading="lazy" decoding="async"
           style={item.position ? { objectPosition: item.position } : undefined} />
      <div className="feed-break__body">
        <p className="feed-break__title">{item.title}</p>
        {cta ?? <span className="feed-card__cta">Записаться на примерку</span>}
      </div>
    </div>
  );
}

/** Заглушка на время первой загрузки ленты: та же высота, без прыжков. */
export function FeedCardSkeleton() {
  return (
    <div className="feed-card feed-card--skeleton" aria-hidden="true">
      <div className="feed-card__photo" />
      <div className="feed-card__body">
        <div className="feed-skel feed-skel--name" />
        <div className="feed-skel feed-skel--text" />
        <div className="feed-skel feed-skel--text feed-skel--short" />
        <div className="feed-skel feed-skel--cta" />
      </div>
    </div>
  );
}
