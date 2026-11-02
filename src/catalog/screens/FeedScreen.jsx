import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SHAPES } from '../data/config.js';
import { feedModels, feedBreaks } from '../data/feed.js';
import { usePrices } from '../data/prices.js';
import { formatPrice } from '../data/priceCalc.js';
import { enabledShapes, useProducts } from '../data/products.js';
import { track, EVENTS } from '../lib/track.js';
import { waMessage } from '../lib/waMessage.js';
import { currentCity, waNumber } from '../lib/city.js';
import SiteFooter from '../components/SiteFooter.jsx';

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
// Размеры и цвета — в DESIGN.md, раздел «Лента».

function basePrice(prices, shank, cast) {
  if (!prices) return null;
  const base = prices.baseByShank?.[shank] ?? 0;
  const add  = cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0;
  return base + add;
}

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
      <span className="feed-card__divider" aria-hidden="true" />
      {price && <span className="feed-card__price">от {formatPrice(price)}</span>}
    </div>
  );
}

function ModelCard({ item, price, href, priority }) {
  return (
    <Link
      to={href}
      className="feed-card"
      style={{ '--tone': item.tone }}
    >
      <div className="feed-card__photo">
        <img
          src={item.src}
          alt={`Кольцо ${item.model}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
      </div>
      <div className="feed-card__body">
        <NameRow name={item.model} price={price} />
        <p className="feed-card__text">{item.text}</p>
        <span className="feed-card__cta">Смотреть модель</span>
      </div>
    </Link>
  );
}

// Курсив для подписи паузы грузим, только когда пауза есть на странице: шрифт
// нужен на одну строку, конструктору и остальному каталогу он ни к чему.
const QUOTE_FONT = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&display=swap';
function useQuoteFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${QUOTE_FONT}"]`)) return;
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: QUOTE_FONT });
    document.head.appendChild(link);
  }, []);
}

function HandBreak({ item, href }) {
  useQuoteFont();
  return (
    <div className="feed-break" style={{ '--tone': item.tone }}>
      <img src={item.src} alt="Кольца на руке" loading="lazy" decoding="async" />
      <div className="feed-break__body">
        <p className="feed-break__title">{item.title}</p>
        <a
          className="feed-card__cta"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.FEED_HELP_CLICK, { kind: 'fitting' })}
        >
          Записаться на примерку
        </a>
      </div>
    </div>
  );
}

export default function FeedScreen() {
  const prices = usePrices();
  const productCfg = useProducts();

  const models = useMemo(() => feedModels(), []);
  const breaks = useMemo(() => feedBreaks(), []);

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
            track(EVENTS.FEED_CARD_VIEW, { model: item.model, position: order + 1 });
          }, 1000));
        } else if (!e.isIntersecting) {
          clearTimeout(timers.get(order));
          timers.delete(order);
        }
      }
    }, { threshold: [0.5] });

    for (const el of cardRefs.current.values()) if (el) io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [models]);

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
        <h1 className="feed-title">Помолвочные кольца</h1>
        <p className="feed-sub">Девять оправ, камень любой формы в каждой</p>
      </div>

      <div className="feed-list">
        {models.map((item, i) => {
          const pause = breaks.find(b => b.after === i + 1);
          return (
            <div key={item.model} className="feed-slot">
              <div data-order={item.order} ref={(el) => { if (el) cardRefs.current.set(item.order, el); }}>
                <ModelCard
                  item={item}
                  price={basePrice(prices, item.shank, item.cast)}
                  href={modelHref(item)}
                  priority={i === 0}
                />
              </div>
              {pause && <HandBreak item={pause} href={fittingHref} />}
            </div>
          );
        })}
      </div>

      <SiteFooter />
    </div>
  );
}
