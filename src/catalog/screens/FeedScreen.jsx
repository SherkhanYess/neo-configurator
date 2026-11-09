import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SHAPES } from '../data/config.js';
import { feedModels, feedBreaks, feedHero, defaultSub, typo } from '../data/feed.js';
import { useContent } from '../data/content.js';
import { usePrices, pricesKnown } from '../data/prices.js';
import { enabledShapes, useProducts } from '../data/products.js';
import { track, EVENTS } from '../lib/track.js';
import { waMessage } from '../lib/waMessage.js';
import { currentCity, waNumber } from '../lib/city.js';
import { FeedCard, FeedBreak, FeedCardSkeleton } from '../components/FeedCard.jsx';
import { useWhatsApp } from '../components/model/whatsapp.jsx';
import { WaButton } from '../components/model/Sections.jsx';
import GuidesStrip from '../components/GuidesStrip.jsx';
import { useReputation } from '../lib/reputation.js';
import { useQuoteFont } from '../lib/useQuoteFont.js';

// Лента моделей — вход в каталог.
//
// Не каталог, а обложки линеек: карточки в одну колонку, у каждой фото,
// имя, цена, две строки о том, как устроено кольцо, и одна кнопка. Огранка
// здесь не упоминается — её выбирают на странице модели вместе с каратностью
// и металлом, без отдельного шага.
//
// Живого 3D здесь нет сознательно: несколько сцен iJewel на одной странице кладут
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

/**
 * Обложка бренда — первый экран. Герой — двое, а не кольцо: чёрно-белое фото
 * рук пары (загружается в админке, сайт сам делает его чёрно-белым), знак
 * aena и обещание бренда. Кнопка ведёт вниз, к моделям. Без фото — та же
 * «глубина» со знаком: обложка не ломается, пока съёмки нет.
 */
export function Hero({ hero, onShow }) {
  useQuoteFont();
  return (
    <section className={`feed-hero${hero.photo ? ' has-photo' : ''}`} aria-label="aena">
      {hero.photo && <img className="feed-hero__photo" src={hero.photo} alt="" fetchPriority="high" decoding="async" style={{ objectPosition: hero.position }} />}
      <img className="feed-hero__sign" src="/assets/aena/sign-pearl.png" alt="aena" />
      <div className="feed-hero__body">
        <h1 className="feed-hero__t">{typo(hero.title)}</h1>
        <p className="feed-hero__p">{typo(hero.sub)}</p>
        <button type="button" className="feed-hero__cta" onClick={onShow}>{hero.cta}</button>
      </div>
    </section>
  );
}

/**
 * «Почему нам доверяют» — после колец и гидов, перед подбором в WhatsApp:
 * отвечает на главный страх человека с рекламы, прежде чем он напишет.
 */
const STAR_ICON = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>;
function Trust() {
  const rep = useReputation();
  const facts = [
    rep ? { v: <>{Number(rep.rating).toFixed(1).replace('.', ',')}{STAR_ICON}</>, c: `в 2ГИС, ${rep.ratings} оценок`, href: rep.url } : null,
    { v: '5–10', c: 'дней на изготовление' },
    { v: 'IGI', c: 'сертификат на каждый камень' },
    { v: 'В подарок', c: 'гравировка внутри кольца', small: true },
  ].filter(Boolean);
  return (
    <section className="feed-trust" aria-labelledby="feed-trust-t">
      <h2 className="feed-trust__t" id="feed-trust-t">Почему нам доверяют</h2>
      <div className="feed-trust__row" style={{ '--n': facts.length }}>
        {facts.map((f, i) => {
          const inner = <><b className={f.small ? 'is-small' : ''}>{f.v}</b><small>{f.c}</small></>;
          return f.href
            ? <a key={i} className="feed-trust__f" href={f.href} target="_blank" rel="noopener noreferrer">{inner}</a>
            : <div key={i} className="feed-trust__f">{inner}</div>;
        })}
      </div>
    </section>
  );
}

/**
 * Конец ленты — для того, кто долистал и не выбрал. По CJM выбирает она, а
 * покупает он, и чаще всего он не знает её вкуса: подбор вместе с нами
 * снимает этот страх. Тип обращения — ПД (подбор).
 */
function HelpBlock({ onWa }) {
  return (
    <section className="feed-help">
      <h2 className="feed-help__t">Не знаете, какое ей понравится?</h2>
      <p className="feed-help__p">
        Расскажите нам о ней — что она носит, какой у неё стиль. Подберём два-три кольца,
        которые ей подойдут, и подскажем, как незаметно узнать размер.
      </p>
      <WaButton onClick={onWa}>Подобрать вместе в WhatsApp</WaButton>
    </section>
  );
}

export default function FeedScreen() {
  const wa = useWhatsApp();
  const prices = usePrices();

  const productCfg = useProducts();
  const { data: content, ready } = useContent('feed');
  const models = useMemo(() => feedModels(productCfg, content), [productCfg, content]);
  const breaks = useMemo(() => feedBreaks(content), [content]);
  const hero = useMemo(() => feedHero(content), [content]);
  const listRef = useRef(null);
  const showRings = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    return `/product/${slug}/${item.cast}/${firstShape}`;
  };

  const utm = (() => {
    try { return JSON.parse(sessionStorage.getItem('nd_utm') ?? '{}') ?? {}; }
    catch { return {}; }
  })();
  const fittingHref = `https://wa.me/${waNumber(currentCity())}?text=${encodeURIComponent(waMessage('fitting', {}, utm))}`;

  return (
    <div className="feed">
      {ready ? <Hero hero={hero} onShow={showRings} /> : <div className="feed-hero" aria-hidden="true" />}

      {/* Над моделями — короткая строка: сколько колец. Заголовок страницы —
          обещание бренда на обложке. */}
      <div className="feed-intro" ref={listRef}>
        <h2 className="feed-title">{typo(content?.intro?.title || defaultSub(models.length))}</h2>
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
                  // Пока цены не пришли, цены нет вовсе — а не цена по умолчанию на миг.
                  price={pricesKnown() ? basePrice(prices, item.shank, item.cast) : null}
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
        {ready && <GuidesStrip />}
        {ready && <Trust />}
        {ready && <HelpBlock onWa={() => wa.open('help', {}, { place: 'feed_end' })} />}
      </div>
      {wa.sheet}

    </div>
  );
}
