import { Link } from 'react-router-dom';
import { track, EVENTS } from '../lib/track.js';
import { WA_ICON } from '../components/model/whatsapp.jsx';
import { useGuide } from './guideCtx.js';

// Общие детали блоков гида: список с отметками, карточка, иконки и кнопки.

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
  heart:  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
  gift:   <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8.5h14V12M12 8v12.5" /><path d="M12 8c-1.5-3.5-5.5-4-5.5-1.5S10 8 12 8zM12 8c1.5-3.5 5.5-4 5.5-1.5S14 8 12 8z" /></>,
  shield: <><path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></>,
};
export const Icon = ({ name }) => <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name] ?? ICONS.spark}</svg>;

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
