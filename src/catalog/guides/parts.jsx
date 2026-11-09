import { Link } from 'react-router-dom';
import { track, EVENTS } from '../lib/track.js';
import { WA_ICON } from '../components/model/whatsapp.jsx';
import { useGuide } from './guideCtx.js';

// Детали, из которых собраны статьи. Разметка повторяет макет на холсте:
// текст — колонкой с полями 24 px, иллюстрации и карточки — шире, с полями
// 12 px, как карточки ленты.


export const Col  = ({ children, className = '' }) => <div className={`gd-col ${className}`}>{children}</div>;
export const Wide = ({ children, className = '' }) => <div className={`gd-wide ${className}`}>{children}</div>;

/** Раздел статьи: отступ сверху, заголовок и текст колонкой. */
export function Sec({ title, children, first = false }) {
  return (
    <section className={`gd-col gd-s${first ? ' gd-s--first' : ''}`}>
      {title && <h2 className="gd-h2">{title}</h2>}
      {children}
    </section>
  );
}

export const P = ({ children, muted, className = '' }) => <p className={`gd-p${muted ? ' gd-p--muted' : ''} ${className}`}>{children}</p>;
export const Quote = ({ children, light }) => <p className={`gd-quote${light ? ' gd-quote--light' : ''}`}>{children}</p>;

/** Список с отметкой: plus, minus, check, x, dot. */
export function List({ kind = 'dot', items, small }) {
  return (
    <ul className={`gd-list gd-list--${kind}${small ? ' gd-list--s' : ''}`}>
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

export const Card = ({ children, className = '', pick }) => <div className={`gd-card${pick ? ' gd-card--pick' : ''} ${className}`}>{children}</div>;

const ICONS = {
  hand:   <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5" /><path d="M14 11.5V5.5a1.5 1.5 0 0 1 3 0V14" /><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4 16.5a1.6 1.6 0 0 1 2.4-2.1L8 16" /></>,
  book:   <path d="M6 3h12v18l-6-4-6 4z" />,
  user:   <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></>,
  size:   <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M6.5 10l-2.5 2 2.5 2M17.5 10l2.5 2-2.5 2" /></>,
  clock:  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin:    <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  pen:    <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  spark:  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
  phone:  <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
};
export const Icon = ({ name }) => <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;

/** Кнопка в каталог. Клик считаем — так видно, какой гид приводит к моделям. */
export function CatalogButton({ children, to = '/catalog', variant = 'ink', place }) {
  const { slug } = useGuide();
  return (
    <Link to={to} className={`gd-btn gd-btn--${variant}`}
          onClick={() => track(EVENTS.GUIDE_CTA, { guide: slug, target: to === '/catalog' ? 'catalog' : 'product', place })}>
      {children}
    </Link>
  );
}

/**
 * Кнопка WhatsApp. Тип обращения — как на остальном сайте: «помогите с
 * выбором» — подбор (ПД), «написать нам» — общий вопрос (ОБ). Из какого гида
 * пришёл человек, видно в аналитике по полю guide.
 */
export function WaCta({ type = 'price', children, place }) {
  const { slug, wa } = useGuide();
  return (
    <button type="button" className="mp-wa" onClick={() => wa?.open(type, {}, { place: place ?? 'guide', guide: slug })}>
      {WA_ICON}{children}
    </button>
  );
}

/** Финальный тёмный блок: заголовок, текст и две кнопки. */
export function Final({ title, children, primary, waText, waType = 'price' }) {
  return (
    <Wide className="gd-s">
      <div className="gd-dark" data-final="">
        <h2 className="gd-h2 gd-h2--light">{title}</h2>
        {children}
        <div className="gd-btns">
          <CatalogButton variant="white" place="final">{primary}</CatalogButton>
          <WaCta type={waType} place="guide_final">{waText}</WaCta>
        </div>
      </div>
    </Wide>
  );
}
