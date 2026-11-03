import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SHAPES } from '../data/config.js';
import { feedModels, feedBreaks, defaultSub, DEFAULT_TITLE } from '../data/feed.js';
import { useContent } from '../data/content.js';
import { usePrices } from '../data/prices.js';
import { enabledShapes, useProducts } from '../data/products.js';
import { track, EVENTS } from '../lib/track.js';
import { waMessage } from '../lib/waMessage.js';
import { currentCity, waNumber } from '../lib/city.js';
import SiteFooter from '../components/SiteFooter.jsx';
import { FeedCard, FeedBreak, FeedCardSkeleton } from '../components/FeedCard.jsx';

// Лента моделей — вход в каталог.
//
// Не каталог, а обложки линеек: девять карточек в одну колонку, у каждой фото,
// имя, цена, две строки о том, как устроено кольцо, и одна кнопка. Огранка
// здесь не упоминается — её выбирают на странице модели вместе с каратностью
// и металлом, без отдельного шага.
//
// Живого 3D здесь нет сознательно: девять сцен iJewel на одной странице кладут
// телефон. 3D — на странице модели.
//
// Фото, тексты, порядок и цвета — из админки (раздел «Лента»).
// Размеры и цвета — в DESIGN.md, раздел «Лента».

function basePrice(prices, shank, cast) {
  if (!prices) return null;
  const base = prices.baseByShank?.[shank] ?? 0;
  const add  = cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0;
  return base + add;
}

export default function FeedScreen() {
  const prices = usePrices();

  const productCfg = useProducts();
  const { data: content, ready } = useContent('feed');
  const models = useMemo(() => feedModels(productCfg, content), [productCfg, content]);
  const breaks = useMemo(() => feedBreaks(content), [content]);

  // Страница модели открывается с первой формой, включённой в админке.
  const firstShape = useMemo(() => {
    const allowed = new Set(enabledShapes(productCfg).map(s => s.id));
    return SHAPES.find(s => allowed.has(s.id))?.id ?? 'round';
  }, [productCfg]);

  const cardRefs = useRef(new Map());
  const seen = useRef(new Set());

  useEffect(() => {
    track(EVENTS.FEED_VIEW, {});
  }, []);

  // Карточка считается просмотренной, если половина её задержалась на экране
  // на секунду.
  useEffect(() => {
    const timers = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const order = Number(e.target.dataset.order);
        const item = models.find(m => m.order === order);
        if (!item) continue;
        if (e.isIntersecting && !seen.current.has(order)) {
          timers.set(order, setTimeout(() => {
            seen.current.add(order);
            track(EVENTS.FEED_CARD_VIEW, { model: item.shank, cast: item.cast, name: item.model, position: order + 1 });
          }, 1000));
        } else if (!e.isIntersecting) {
          clearTimeout(timers.get(order));
          timers.delete(order);
        }
      }
    }, { threshold: [0.5] });

    for (const el of cardRefs.current.values()) if (el?.isConnected) io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [models, ready]);

  const modelHref = (item) => {
    const slug = item.shank.toLowerCase().replace(/\s+/g, '-');
    return `/catalog/product/${slug}/${item.cast}/${firstShape}`;
  };

  const utm = (() => {
    try { return JSON.parse(sessionStorage.getItem('nd_utm') ?? '{}') ?? {}; }
    catch { return {}; }
  })();
  const fittingHref = `https://wa.me/${waNumber(currentCity())}?text=${encodeURIComponent(waMessage('fitting', {}, utm))}`;

  return (
    <div className="feed">
      <header className="feed-head">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="feed-logo" />
      </header>

      <div className="feed-intro">
        <h1 className="feed-title">{content?.intro?.title || DEFAULT_TITLE}</h1>
        <p className="feed-sub">{content?.intro?.sub || defaultSub(models.length)}</p>
      </div>

      <div className="feed-list">
        {!ready && [0, 1].map(i => <FeedCardSkeleton key={i} />)}
        {ready && models.map((item, i) => {
          const pause = breaks.find(b => b.after === i + 1);
          return (
            <div key={item.key} className="feed-slot">
              <div data-order={item.order} ref={(el) => { if (el) cardRefs.current.set(item.order, el); }}>
                <FeedCard
                  as={Link}
                  to={modelHref(item)}
                  item={item}
                  price={basePrice(prices, item.shank, item.cast)}
                  priority={i === 0}
                />
              </div>
              {pause && (
                <FeedBreak item={pause} cta={
                  <a className="feed-card__cta" href={fittingHref} target="_blank" rel="noopener noreferrer"
                     onClick={() => track(EVENTS.FEED_HELP_CLICK, { kind: 'fitting' })}>
                    Записаться на примерку
                  </a>
                } />
              )}
            </div>
          );
        })}
      </div>

      <SiteFooter />
    </div>
  );
}
