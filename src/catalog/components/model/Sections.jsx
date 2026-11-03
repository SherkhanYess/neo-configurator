import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQ_GROUPS } from '../Faq.jsx';
import { SHOWROOMS } from '../../data/org.js';
import { REVIEWS } from '../../data/reviews.js';
import { feedModels } from '../../data/feed.js';
import { formatPrice } from '../../data/priceCalc.js';
import { track, EVENTS } from '../../lib/track.js';
import { WA_ICON } from './whatsapp.jsx';
import { useQuoteFont } from '../../lib/useQuoteFont.js';

// Блоки страницы модели ниже выбора. Порядок и тексты — с холста, ряд
// «Страница модели — после правок».

const CHEV = (
  <svg width="12" height="8" viewBox="0 0 14 9" aria-hidden="true"><path d="M1 1l6 6 6-6" fill="none" stroke="#476888" strokeWidth="1.5"/></svg>
);
const ARROW = (
  <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>
);
const STAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="#C4A177" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4-5.7-5 7.5-.7z"/></svg>
);
const icon = (d) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2040" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export function WaButton({ children, onClick }) {
  return <button type="button" className="mp-wa" onClick={onClick}>{WA_ICON}{children}</button>;
}

export function Engraving() {
  useQuoteFont();
  return (
    <div className="mp-engr">
      <div className="mp-engr__t">Ваши слова внутри кольца</div>
      <p>Гравировка — в подарок к каждому заказу.</p>
    </div>
  );
}

/** «Понравилось кольцо?» с готовым первым сообщением: писать ничего не нужно. */
export function Like({ message, onWa }) {
  return (
    <div className="mp-card mp-like">
      <h2 className="mp-h2">Понравилось кольцо?</h2>
      <p className="mp-p">Напишите нам — подскажем по наличию, обсудим все детали и дадим бонусы.</p>
      <div className="mp-like__label">Сообщение уже готово:</div>
      <div className="mp-bubble">{message}</div>
      <WaButton onClick={onWa}>Написать в WhatsApp</WaButton>
    </div>
  );
}

export function Pair({ onHint, onCustom }) {
  return (
    <div className="mp-pair">
      <button type="button" className="mp-tile" onClick={onHint}>
        <span className="mp-tile__i">{icon(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>)}</span>
        <span className="mp-tile__t">Намекнуть партнёру<small>Напишем ему/ей про это кольцо</small></span>
        <span style={{ color: '#0B2040' }}>{ARROW}</span>
      </button>
      <button type="button" className="mp-tile" onClick={onCustom}>
        <span className="mp-tile__i">{icon(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></>)}</span>
        <span className="mp-tile__t">Кольцо по вашему дизайну<small>Обсудим идею в WhatsApp</small></span>
        <span style={{ color: '#0B2040' }}>{ARROW}</span>
      </button>
    </div>
  );
}

/** Живой показ. По CJM на стадиях 4–5 это главное, чего она хочет: увидеть на руке. */
export function Fitting({ model, onWa }) {
  return (
    <div className="mp-dark mp-fit" data-dark>
      <h2 className="mp-h2">Оцените вживую,<br />прежде чем решать</h2>
      <p className="mp-p">Примерьте {model} и другие модели на своей руке, посмотрите камень под правильным светом и сверьте сертификат IGI под микроскопом.</p>
      <div className="mp-addr">
        {SHOWROOMS.map(s => (
          <a key={s.city} href={s.twogis} target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DCC29B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span><b>{s.city}</b><small>{s.streetAddress.replace(/^(проспект|улица)\s+/, '')} ({s.place})</small></span>
          </a>
        ))}
      </div>
      <WaButton onClick={onWa}>Записаться на живой показ</WaButton>
      <div className="mp-note">Без обязательств — можно просто посмотреть</div>
    </div>
  );
}

function useReputation() {
  const [rep, setRep] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/catalog/reputation.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d?.rating) setRep(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return rep;
}

/** «Нас выбирают»: рейтинг, отзывы и коротко про сертификат, уход и сервис. */
export function Proof() {
  const rep = useReputation();
  return (
    <>
      <div className="mp-sec">
        <h2 className="mp-h2">Нас выбирают</h2>
        {rep && (
          <a className="mp-rating" href={rep.url} target="_blank" rel="noopener noreferrer">
            <span className="mp-rating__n">{Number(rep.rating).toFixed(1).replace('.', ',')}</span>
            <span><span style={{ display: 'flex', gap: 2 }}>{STAR}{STAR}{STAR}{STAR}{STAR}</span>
              <span className="mp-rating__s">{rep.ratings} оценки в 2ГИС</span></span>
          </a>
        )}
      </div>
      {REVIEWS.length > 0 && (
        <div className="mp-reviews">
          {REVIEWS.map((r, i) => (
            <div key={i} className="mp-review">
              <div style={{ display: 'flex', gap: 2 }}>{STAR}{STAR}{STAR}{STAR}{STAR}</div>
              <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#1E3149' }}>{r.text}</p>
              <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: '#476888' }}>{r.name} · 2ГИС</div>
            </div>
          ))}
        </div>
      )}
      {rep && (
        <a className="mp-link" href={rep.url} target="_blank" rel="noopener noreferrer">Все отзывы в 2ГИС {ARROW}</a>
      )}
      <div className="mp-card mp-theses">
        {[
          [icon(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></>), 'Сертификат IGI / GIA', 'На каждый камень, номер — на самом бриллианте'],
          [icon(<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></>), 'Уход навсегда', 'Чистка и родирование — бесплатно, пожизненно'],
          [icon(<><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></>), 'Футляр для предложения', 'Кольцо приедет в коробке, которую не стыдно открыть'],
          [icon(<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>), 'Ремонт и размер', 'Подгоним и починим по себестоимости'],
        ].map(([ic, t, s]) => (
          <div key={t} className="mp-thesis"><span className="mp-thesis__i">{ic}</span><b>{t}</b><small>{s}</small></div>
        ))}
      </div>
    </>
  );
}

function basePrice(prices, shank, cast) {
  if (!prices) return null;
  return (prices.baseByShank?.[shank] ?? 0) + (cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0);
}

/** Возврат к ленте: кому это кольцо не подошло, тот листает дальше, а не уходит. */
export function Others({ shank, cast, prices, products }) {
  const items = feedModels(products).filter(m => !(m.shank === shank && m.cast === cast));
  return (
    <>
      <div className="mp-others-h">
        <h2 className="mp-h2">Другие модели</h2>
        <Link to="/catalog">Все {ARROW}</Link>
      </div>
      <div className="mp-others">
        {items.map(m => {
          const price = basePrice(prices, m.shank, m.cast);
          return (
            <Link key={m.model} className="mp-mini" style={{ '--tone': m.tone }}
                  to={`/catalog/product/${m.shank.toLowerCase().replace(/\s+/g, '-')}/${m.cast}/round`}>
              <div className="mp-mini__p"><img src={m.src} alt={`Кольцо ${m.model}`} loading="lazy" decoding="async" /></div>
              <div className="mp-mini__b"><b>{m.model}</b>{price ? <small>от {formatPrice(price)}</small> : null}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function QA({ q, a, open, onToggle }) {
  return (
    <div>
      <button type="button" className="mp-row" aria-expanded={open} onClick={onToggle}><span>{q}</span>{CHEV}</button>
      {open && <div className="mp-ans">{a.map((p, i) => <p key={i}>{p}</p>)}</div>}
    </div>
  );
}

/** Вопросы: сначала о покупке, вопросы о камне — одним свёрнутым пунктом ниже. */
export function Questions() {
  const [open, setOpen] = useState(null);
  const [stones, setStones] = useState(false);
  const [buy, ...rest] = FAQ_GROUPS;
  let n = 0;
  const toggle = (key, num) => {
    setOpen(o => (o === key ? null : key));
    if (open !== key) track(EVENTS.FAQ_OPEN, { question: num });
  };
  return (
    <>
      <div className="mp-faq-h"><h2 className="mp-h2">Вопросы</h2></div>
      <div className="mp-card mp-faq">
        {buy.items.map(it => { const num = ++n; return (
          <QA key={it.q} q={it.q} a={it.a} open={open === it.q} onToggle={() => toggle(it.q, num)} />
        ); })}
        {rest.map(g => (
          <div key={g.title}>
            <button type="button" className="mp-row" aria-expanded={stones} onClick={() => setStones(v => !v)}>
              <span>{g.title} — {g.items.length} вопросов</span>{CHEV}
            </button>
            {stones && g.items.map(it => { const num = ++n; return (
              <QA key={it.q} q={it.q} a={it.a} open={open === it.q} onToggle={() => toggle(it.q, num)} />
            ); })}
          </div>
        ))}
      </div>
    </>
  );
}

/** Для дочитавшего до конца: хватит читать — напишите, разберёмся. */
export function Final({ onWa }) {
  return (
    <div className="mp-dark mp-final" data-dark>
      <h2 className="mp-h2">Остались вопросы?</h2>
      <p className="mp-p" style={{ textWrap: 'balance' }}>Вам не нужно разбираться во всём&nbsp;— напишите нам, проведём лучшую консультацию в вашей жизни!</p>
      <WaButton onClick={onWa}>Написать в WhatsApp</WaButton>
      <div className="mp-note">Ответим в течение 5 минут</div>
    </div>
  );
}
