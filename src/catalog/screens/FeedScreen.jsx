import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SHAPES, ringImage } from '../data/config.js';
import { feedModels, usedStyles } from '../data/feed.js';
import { usePrices } from '../data/prices.js';
import { formatPrice } from '../data/priceCalc.js';
import { enabledShapes, useProducts } from '../data/products.js';
import { track, EVENTS } from '../lib/track.js';
import { waMessage } from '../lib/waMessage.js';
import { currentCity, waNumber } from '../lib/city.js';
import SiteFooter from '../components/SiteFooter.jsx';

// Лента моделей — вход в каталог.
//
// Раньше здесь стоял вопрос «Выберите форму бриллианта»: технический выбор до
// того, как человек увидел хоть одно кольцо, причём словами «Радиант» и «Ашер»,
// которые большинству ничего не говорят. Следом шёл список из девяноста
// карточек — одна и та же модель повторялась в десяти формах, отсортированная
// по цене.
//
// Теперь моделей девять, по карточке на каждую, в одну колонку. Форма камня
// выбирается внутри карточки. Человек листает вниз, как в ленте, из которой
// пришёл.
//
// Живого 3D здесь нет сознательно: девять сцен iJewel на одной странице кладут
// телефон. Показываем готовые рендеры, а 3D — на странице модели.

const money = (n) => (n ? formatPrice(n) : null);

function basePrice(prices, shank, cast) {
  if (!prices) return null;
  const base = prices.baseByShank?.[shank] ?? 0;
  const add  = cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0;
  return base + add;
}

/** Галерея одной модели: по кадру на каждую доступную форму камня. */
function Gallery({ item, shapes, onShapeChange, onOpen }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const touched = useRef(false);

  // Какой кадр сейчас в центре — считаем по позиции прокрутки, а не по
  // событиям, чтобы свайп и нажатие на точку давали один и тот же результат.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        setIndex(prev => {
          if (prev !== i && touched.current) onShapeChange?.(shapes[i]?.id);
          return i;
        });
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [shapes, onShapeChange]);

  const goTo = (i) => {
    touched.current = true;
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="feed-gallery">
      <div
        className="feed-gallery__track"
        ref={trackRef}
        onPointerDown={() => { touched.current = true; }}
        onClick={() => onOpen(shapes[index]?.id)}
      >
        {shapes.map((s, i) => (
          <div className="feed-gallery__slide" key={s.id}>
            <img
              src={ringImage(item.shank, item.cast, s.id)}
              alt={`${item.model}, огранка «${s.label}»`}
              loading={item.order === 0 && i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable="false"
            />
          </div>
        ))}
      </div>

      <div className="feed-gallery__dots" role="tablist" aria-label="Форма камня">
        {shapes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={s.label}
            className={`feed-dot${i === index ? ' is-active' : ''}`}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
          >
            <img src={`/assets/shapes/${s.file}`} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelCard({ item, shapes, price, onOpen, registerRef }) {
  const [open, setOpen] = useState(false);
  const [shape, setShape] = useState(shapes[0]?.id);

  return (
    <article className="feed-card" ref={registerRef} id={`style-${item.style}-${item.order}`}>
      <Gallery
        item={item}
        shapes={shapes}
        onShapeChange={(id) => {
          if (!id) return;
          setShape(id);
          track(EVENTS.FEED_GALLERY_SWIPE, { model: item.model, shape: id });
        }}
        onOpen={(id) => onOpen(item, id ?? shape)}
      />

      <div className="feed-card__body">
        <div className="feed-card__head">
          <h2 className="feed-card__name">{item.model}</h2>
          {price && <span className="feed-card__price">от {money(price)}</span>}
        </div>

        <p className="feed-card__facts">Изготовим за 5–10 дней · сертификат IGI</p>
        <p className="feed-card__text">{item.short}</p>

        <button type="button" className="feed-card__more" onClick={() => setOpen(v => !v)}>
          {open ? 'Свернуть' : 'Подробнее'}
        </button>
        {open && <p className="feed-card__text feed-card__text--more">{item.more}</p>}

        <button type="button" className="feed-card__cta" onClick={() => onOpen(item, shape)}>
          Смотреть модель
        </button>
      </div>
    </article>
  );
}

export default function FeedScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prices = usePrices();
  const productCfg = useProducts();

  const models = useMemo(() => feedModels(), []);
  const styles = useMemo(() => usedStyles(models), [models]);

  // Формы берём из админки: отключённую форму не должно быть видно и в ленте.
  const shapes = useMemo(() => {
    const allowed = new Set(enabledShapes(productCfg).map(s => s.id));
    return SHAPES.filter(s => allowed.has(s.id));
  }, [productCfg]);

  const [activeStyle, setActiveStyle] = useState(null);
  const cardRefs = useRef(new Map());
  const seen = useRef(new Set());

  const styleParam = searchParams.get('style');

  useEffect(() => {
    track(EVENTS.FEED_VIEW, { style: styleParam ?? null });
  }, [styleParam]);

  // Пришёл по ссылке со стилем — подводим ленту к первой модели этого стиля.
  //
  // Прокрутка откладывается до того, как карточки получат высоту: сразу после
  // первого кадра галереи ещё пустые, высота ленты занижена, и scrollIntoView
  // уезжает в начало. Поэтому ждём, пока ссылка на карточку появится, и только
  // тогда прокручиваем.
  const scrolledTo = useRef(null);
  useEffect(() => {
    if (!styleParam || scrolledTo.current === styleParam) return;
    const first = models.find(m => m.style === styleParam);
    if (!first) return;
    setActiveStyle(styleParam);

    let tries = 0;
    const tick = () => {
      const el = cardRefs.current.get(first.order);
      if (el && el.offsetHeight > 200) {
        scrolledTo.current = styleParam;
        el.scrollIntoView({ block: 'start' });
        return;
      }
      if (tries++ < 40) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [styleParam, models]);

  // Какая карточка смотрится сейчас — для подсветки чипса и для замера.
  useEffect(() => {
    const timers = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const order = Number(e.target.dataset.order);
        const item = models[order];
        if (!item) continue;

        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          setActiveStyle(item.style);
          // Карточка считается просмотренной, если задержалась на секунду.
          if (!seen.current.has(order)) {
            timers.set(order, setTimeout(() => {
              seen.current.add(order);
              track(EVENTS.FEED_CARD_VIEW, { model: item.model, position: order + 1 });
            }, 1000));
          }
        } else {
          clearTimeout(timers.get(order));
          timers.delete(order);
        }
      }
    }, { threshold: [0.5] });

    for (const el of cardRefs.current.values()) if (el) io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [models]);

  const openModel = (item, shape) => {
    const slug = item.shank.toLowerCase().replace(/\s+/g, '-');
    navigate(`/catalog/product/${slug}/${item.cast}/${shape ?? shapes[0]?.id}`);
  };

  const scrollToStyle = (styleId) => {
    track(EVENTS.FEED_STYLE_CLICK, { style: styleId });
    const first = models.find(m => m.style === styleId);
    const el = first && cardRefs.current.get(first.order);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const utm = (() => {
    try { return JSON.parse(sessionStorage.getItem('nd_utm') ?? '{}') ?? {}; }
    catch (_) { return {}; }
  })();
  const helpHref = `https://wa.me/${waNumber(currentCity())}?text=${encodeURIComponent(waMessage('help', {}, utm))}`;

  return (
    <div className="feed">
      <header className="feed-head">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="feed-logo" />
        <h1 className="feed-title">Помолвочные кольца</h1>
        <p className="feed-sub">
          Девять моделей. Форма бриллианта, каратность и металл — на выбор внутри каждой.
        </p>
        <Trust />
      </header>

      <nav className="feed-styles" aria-label="Стили">
        {styles.map(s => (
          <button
            key={s.id}
            type="button"
            className={`feed-chip${activeStyle === s.id ? ' is-active' : ''}`}
            onClick={() => scrollToStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="feed-list">
        {models.map((item, i) => (
          <div key={item.model}>
            <div
              data-order={item.order}
              ref={(el) => { if (el) cardRefs.current.set(item.order, el); }}
            >
              <ModelCard
                item={item}
                shapes={shapes}
                price={basePrice(prices, item.shank, item.cast)}
                onOpen={openModel}
                registerRef={null}
              />
            </div>

            {i === 3 && (
              <a
                className="feed-help"
                href={helpHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(EVENTS.FEED_HELP_CLICK, {})}
              >
                <span className="feed-help__title">Не знаете, какую выбрать</span>
                <span className="feed-help__text">
                  Напишите — спросим про неё пару вещей и предложим два-три варианта
                </span>
              </a>
            )}
          </div>
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}

/** Строка доверия. Те же данные, что в подвале: собираются при сборке. */
function Trust() {
  const [rep, setRep] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/catalog/reputation.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d?.rating) setRep(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <p className="feed-trust">
      {rep ? `${rep.rating} из 5 в 2ГИС · ` : ''}шоурумы в Алматы и Астане
    </p>
  );
}
