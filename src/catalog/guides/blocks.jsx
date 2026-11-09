import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { usePrices, pricesKnown } from '../data/prices.js';
import { calcPrice, formatPrice } from '../data/priceCalc.js';
import { SHOWROOMS } from '../data/org.js';
import { SHAPE_IDS } from '../data/guideSchema.js';
import { typo } from '../data/feed.js';
import { track, EVENTS } from '../lib/track.js';
import { List, Card, Icon, CatalogButton, WaCta } from './parts.jsx';
import { useGuide } from './guideCtx.js';

// Блоки гида — по одному компоненту на тип из guideSchema.js. Одна и та же
// разметка и на сайте, и в предпросмотре админки.
//
// Текст — колонкой с полями 24 px (gd-col), иллюстрации и карточки — шире,
// с полями 12 px (gd-wide). Отступы между блоками — в guides.css (gd-blk).

const t = (s) => typo(s ?? '');
/** Перенос строки в поле админки — перенос и на сайте. */
const lines = (s) => t(s).split('\n').map((l, i, all) => <Fragment key={i}>{l}{i < all.length - 1 && <br />}</Fragment>);
const SHAPE = (id) => `/assets/shapes/${id}.webp`;
const SHAPE_NAME = Object.fromEntries(SHAPE_IDS);
const RING = (n) => `/assets/rings/${n}.webp`;

const colOf = (Inner) => function ColBlock(props) { return <div className="gd-col"><Inner {...props} /></div>; };
const wideOf = (Inner) => function WideBlock(props) { return <div className="gd-wide"><Inner {...props} /></div>; };

// ─── Текст ───────────────────────────────────────────────────────────────
const H2 = ({ b }) => <h2 className="gd-h2">{t(b.text)}</h2>;
const H3 = ({ b }) => <h3 className="gd-h3">{t(b.text)}</h3>;
const Para = ({ b }) => <p className={`gd-p${b.muted ? ' gd-p--muted' : ''}`}>{lines(b.text)}</p>;
const QuoteB = ({ b }) => <p className="gd-quote">{lines(b.text)}</p>;
const ListB = ({ b }) => <List kind={b.kind} items={(b.items ?? []).map(t)} />;

function Note({ b }) {
  return (
    <div className="gd-card gd-card--soft">
      {b.title && <b className="gd-b-title">{t(b.title)}</b>}
      {b.text && <p className="gd-p gd-p--card">{lines(b.text)}</p>}
    </div>
  );
}

function CardB({ b }) {
  return (
    <Card pick={b.pick}>
      {b.title && <div className="gd-name gd-name--s">{t(b.title)}</div>}
      {b.subtitle && <div className="gd-sub">{t(b.subtitle)}</div>}
      {b.items?.length > 0 && <List kind={b.kind} items={b.items.map(t)} />}
      {b.quote && <p className="gd-quote gd-quote--card">{lines(b.quote)}</p>}
      {b.note && <p className="gd-note">{lines(b.note)}</p>}
    </Card>
  );
}

function Cta({ b }) {
  const text = t(b.text) || 'Смотреть каталог';
  if (b.action === 'help' || b.action === 'price') return <WaCta type={b.action} place="guide_body">{text}</WaCta>;
  return <CatalogButton to={b.action === 'page' && b.to ? b.to : '/'} place="body">{text}</CatalogButton>;
}

function ImageB({ b }) {
  if (!b.src) return null;
  return (
    <figure className="gd-fig">
      <img src={b.src} alt={b.alt ?? ''} loading="lazy" decoding="async" />
      {b.caption && <figcaption>{t(b.caption)}</figcaption>}
    </figure>
  );
}

function Collage({ b }) {
  const imgs = (b.images ?? []).filter(Boolean);
  if (!imgs.length) return null;
  return <div className="gd-collage">{imgs.slice(0, 5).map((src, i) => <img key={i} src={src} alt="" loading="lazy" decoding="async" />)}</div>;
}

function Compare({ b }) {
  return (
    <div className="gd-vs">
      {(b.items ?? []).map((c, i) => (
        <Card key={i} pick={c.pick}>
          <div className="gd-vs__top">
            <span className={c.list?.length ? 'gd-eyebrow' : 'gd-vs__n'}>{t(c.title)}</span>
            {c.badge && <small>{t(c.badge)}</small>}
          </div>
          {c.text && <p className="gd-vs__p">{lines(c.text)}</p>}
          {c.list?.length > 0 && <List kind={c.kind} small items={c.list.map(t)} />}
        </Card>
      ))}
    </div>
  );
}

// ─── Гид 1 ───────────────────────────────────────────────────────────────
function Order() {
  return (
    <div className="gd-order">
      <div className="gd-order__head"><b>Заказ доставлен</b><span>2 товара, одна коробка</span></div>
      <div className="gd-order__item"><img className="gd-thumb" src={RING('sirius-round')} alt="" loading="lazy" /><span>Кольцо помолвочное, размер универсальный</span><b>4 990 ₸</b></div>
      <div className="gd-order__item"><span className="gd-thumb gd-thumb--icon"><Icon name="phone" /></span><span>Чехол прозрачный для телефона</span><b>1 290 ₸</b></div>
    </div>
  );
}
const PriceTag = () => (
  <div className="gd-tag"><div className="gd-tag__t">Только для вас</div><div className="gd-tag__p"><s>850 000</s><b>700 000 ₸</b></div></div>
);
const SameRing = () => (
  <div className="gd-same">{['Она', 'Подруга', 'Подруга подруги'].map(w => <div key={w}><img src={RING('halo-round')} alt="" loading="lazy" />{w}</div>)}</div>
);
function Receipt() {
  const row = (a, v) => <div key={a}><span>{a}</span><i /><b>{v}</b></div>;
  return (
    <div className="gd-receipt">
      {row('Камень', 'ищите сами')}{row('Срок', 'около месяца')}{row('Золото', 'по граммам')}
      <div className="gd-receipt__total">{row('Итого', 'узнаете в конце')}</div>
    </div>
  );
}
const MEME = { order: Order, tag: PriceTag, same: SameRing, receipt: Receipt };

function Places({ b }) {
  return (
    <div className="gd-stack">
      {(b.items ?? []).map((p, i) => {
        const Meme = MEME[p.meme];
        return (
          <Card key={i} pick={p.best} className="gd-place">
            <div className="gd-place__rank">{t(p.rank)}</div>
            <div className="gd-name">{t(p.title)}</div>
            {Meme && <Meme />}
            {p.pros?.length > 0 && <List kind={p.best ? 'check' : 'plus'} items={p.pros.map(t)} />}
            {p.best
              ? <p className="gd-place__minus">Минусы: мы искали.<br />Честно искали.</p>
              : p.cons?.length > 0 && <List kind="minus" items={p.cons.map(t)} />}
          </Card>
        );
      })}
    </div>
  );
}

function Clues({ b }) {
  return (
    <div className="gd-clues">
      {(b.items ?? []).map((c, i) => (
        <div key={i} className="gd-clue">
          <span className="gd-ic"><Icon name={c.icon} /></span>
          <div><h3 className="gd-h3">{t(c.title)}</h3><p>{lines(c.text)}</p></div>
        </div>
      ))}
    </div>
  );
}

function Matches({ b }) {
  const { slug } = useGuide();
  return (
    <div className="gd-row2">
      {(b.items ?? []).map((m, i) => (
        <Link key={i} to={m.to || '/'} className="gd-match"
              onClick={() => track(EVENTS.GUIDE_CTA, { guide: slug, target: 'product', place: 'match' })}>
          {m.img && <img src={m.img} alt={`Кольцо: ${String(m.name ?? '').toLowerCase()}`} loading="lazy" decoding="async" />}
          <div><small>Если она {t(m.if)}</small><div className="gd-name">{t(m.name)}</div><p>{t(m.what)}</p></div>
        </Link>
      ))}
    </div>
  );
}

function Sizer({ b }) {
  return (
    <Card className="gd-sizer">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
        <circle cx="52" cy="52" r="44" fill="none" stroke="#E9E1D3" strokeWidth="12" />
        <circle cx="52" cy="52" r="38" fill="none" stroke="#061B1B" strokeWidth="1" />
        <path d="M14 52h76" stroke="#6B5538" strokeWidth="1.2" />
        <path d="M19 48l-5 4 5 4M85 48l5 4-5 4" fill="none" stroke="#6B5538" strokeWidth="1.2" />
        <text x="52" y="44" textAnchor="middle" fontSize="11" fill="#061B1B" fontFamily="Manrope, sans-serif">{b.value}</text>
      </svg>
      <div><b className="gd-b">{t(b.title)}</b><p>{lines(b.text)}</p></div>
    </Card>
  );
}

function Perk({ b }) {
  return (
    <div className="gd-perk">
      <span className="gd-ic gd-ic--s"><Icon name={b.icon} /></span>
      <div><b>{t(b.title)}</b>{b.text && <small>{t(b.text)}</small>}</div>
    </div>
  );
}

function Engraving({ b }) {
  return (
    <div className="gd-engr">
      {b.label && <div className="gd-engr__k">{t(b.label)}</div>}
      <div className="gd-engr__band">{b.text}</div>
      {b.caption && <div className="gd-engr__p">{t(b.caption)}</div>}
    </div>
  );
}

// ─── Гид 2 ───────────────────────────────────────────────────────────────
function Terms({ b }) {
  return <dl className="gd-terms">{(b.items ?? []).map((x, i) => <div key={i}><dt>{t(x.term)}</dt><dd>{t(x.def)}</dd></div>)}</dl>;
}

function Shapes() {
  return (
    <div className="gd-shapes">
      {SHAPE_IDS.map(([id, name]) => <figure key={id}><span><img src={SHAPE(id)} alt="" loading="lazy" /></span><figcaption>{name}</figcaption></figure>)}
    </div>
  );
}

function Facts({ b }) {
  return (
    <>
      {b.title && <h3 className="gd-h3">{t(b.title)}</h3>}
      <div className="gd-facts">
        {(b.items ?? []).map((f, i) => (
          <div key={i} className="gd-fact">
            <span className="gd-fact__ic">{(f.shapes ?? []).map(id => <img key={id} src={SHAPE(id)} alt={SHAPE_NAME[id]} loading="lazy" />)}</span>
            <div><b>{t(f.title)}</b><p>{lines(f.text)}</p></div>
          </div>
        ))}
      </div>
    </>
  );
}

const METALS = [['#E3E6EA', 'Белое'], ['#D9B970', 'Жёлтое'], ['#D9A28E', 'Розовое']];
function Equal({ b }) {
  const tiles = b.kind === 'metals'
    ? METALS.map(([c, n]) => <span key={n} className="gd-eq__metal" style={{ background: c }} title={n} />)
    : ['round', 'marquise', 'heart'].map(id => <span key={id}><img src={SHAPE(id)} alt={SHAPE_NAME[id]} /></span>);
  return (
    <Card className="gd-center">
      <div className="gd-eq">{tiles.flatMap((x, i) => (i ? [<i key={`e${i}`}>=</i>, x] : [x]))}</div>
      <b>{t(b.title)}</b>
      {b.text && <p>{t(b.text)}</p>}
    </Card>
  );
}

const GLASSES = (
  <svg viewBox="0 0 70 22" aria-hidden="true">
    <path d="M2 6h66" stroke="#061B1B" strokeWidth="2" />
    <rect x="6" y="5" width="24" height="14" rx="6" fill="#061B1B" /><rect x="40" y="5" width="24" height="14" rx="6" fill="#061B1B" />
  </svg>
);
function Carats({ b }) {
  return (
    <Card className="gd-carats">
      {(b.items ?? []).map((c, i) => (
        <div className="gd-carat" key={i}>
          <div className="gd-carat__stone"><span style={{ width: c.px, height: c.px }}><img src={SHAPE('round')} alt="" loading="lazy" />{c.glasses && GLASSES}</span></div>
          <b>{t(c.ct)}</b><small>{t(c.mm)}</small><p>{t(c.caption)}</p>
        </div>
      ))}
    </Card>
  );
}

function Swatches({ b }) {
  return (
    <Card className="gd-swatches">
      {(b.items ?? []).map((s, i) => (
        <div className="gd-swatch" key={i}>
          <span style={{ background: /^#[0-9a-f]{6}$/i.test(s.color ?? '') ? s.color : '#E3E6EA' }} /><b>{t(s.name)}</b><small>{t(s.text)}</small>
        </div>
      ))}
    </Card>
  );
}

function Kinds({ b }) {
  return (
    <div className="gd-card" style={{ padding: '12px 12px 16px' }}>
      <div className="gd-kinds">
        {(b.items ?? []).map((k, i) => <div key={i}><div className="gd-name gd-name--s">{t(k.title)}</div><p>{lines(k.text)}</p></div>)}
      </div>
      {b.note && <p className="gd-p gd-p--card gd-kinds__note">{lines(b.note)}</p>}
    </div>
  );
}

function Bar({ label, sub, price, share, ink }) {
  return (
    <div className={`gd-bar${ink ? ' gd-bar--ink' : ''}`}>
      <div className="gd-bar__top"><span>{label}</span><span className="gd-price">{price}</span></div>
      <small>{sub}</small>
      <div className="gd-bar__track"><i style={{ width: `${share}%` }} /></div>
    </div>
  );
}

// Лабораторные цены — из прайса сайта: Sirius 1 ct и Neo Halo Luxe 5 ct.
// Природный — число из админки (оценка владельца).
function SameMoney({ b }) {
  const prices = usePrices();
  const known = pricesKnown();
  const natural = b.natural || 2000000;
  const lab1 = known ? calcPrice({ shankLabel: 'Sirius', cast: 'classic', carat: 1 }, prices) : null;
  const lab5 = known ? calcPrice({ shankLabel: 'Neo Luxe', cast: 'halo', carat: 5 }, prices) : null;
  const money = (v) => (v ? formatPrice(v) : '—');
  return (
    <Card>
      <b className="gd-b-title">{t(b.title)}</b>
      <Bar ink label={t(b.labLabel)} sub={t(b.labSub)} price={money(lab1)} share={lab1 ? Math.max(6, Math.round(lab1 / natural * 100)) : 28} />
      <Bar label={t(b.natLabel)} sub={t(b.natSub)} price={`≈ ${formatPrice(natural)}`} share={100} />
      {b.title2 && (
        <div className="gd-split">
          <b className="gd-b-title">{t(b.title2)}</b>
          <div className="gd-stones">
            <div><span className="gd-stones__img"><img src={SHAPE('round')} alt="" style={{ width: 46, height: 46 }} /></span>{lines(b.natCaption)}<br /><span className="gd-price">≈ {formatPrice(natural)}</span></div>
            <div><span className="gd-stones__img"><img src={SHAPE('round')} alt="" style={{ width: 88, height: 88 }} /></span>{lines(b.labCaption)}<br /><span className="gd-price">{money(lab5)}</span></div>
          </div>
        </div>
      )}
    </Card>
  );
}

function Ladder({ b }) {
  return (
    <Card>
      <b className="gd-b-title">{t(b.title)}</b>
      <div style={{ marginTop: 4 }}>
        {(b.rows ?? []).map((r, i) => (
          <div key={i} className={`gd-ladder__row${r.good ? ' gd-ladder__row--good gd-bar--ink' : ''}`}>
            <div className="gd-ladder__top">{t(r.title)}<span>{t(r.verdict)}</span></div>
            <p>{t(r.text)}</p>
            <div className="gd-bar__track"><i style={{ width: `${r.keep ?? 0}%` }} /></div>
          </div>
        ))}
      </div>
      {b.note && <p className="gd-note">{lines(b.note)}</p>}
    </Card>
  );
}

function Case({ b }) {
  return (
    <div className="gd-dark">
      {b.eyebrow && <div className="gd-eyebrow">{t(b.eyebrow)}</div>}
      <h3 className="gd-h2 gd-h2--light" style={{ marginTop: 6 }}>{t(b.title)}</h3>
      {(b.image || b.specs?.length > 0) && (
        <div className="gd-case__cert">
          {b.image && <img src={b.image} alt={b.imageAlt ?? ''} loading="lazy" />}
          <dl>{(b.specs ?? []).map((s, i) => <div key={i}><dt>{t(s.k)}</dt><dd>{t(s.v)}</dd></div>)}</dl>
        </div>
      )}
      {b.caption && <div className="gd-case__cap">{t(b.caption)}</div>}
      {b.text && <p className="gd-p" style={{ marginTop: 16 }}>{lines(b.text)}</p>}
      {(b.bought || b.offer) && (
        <div className="gd-case__nums">
          <div><small>Купил за</small><s><b>{b.bought}</b></s></div>
          <div><small>Лучшее предложение</small><b>{b.offer}</b></div>
        </div>
      )}
      {b.after && <p className="gd-p">{lines(b.after)}</p>}
      {b.quote && <p className="gd-quote gd-quote--light">{lines(b.quote)}</p>}
    </div>
  );
}

function Stat({ b }) {
  return (
    <Card>
      <div className="gd-stat"><b>{b.value}</b><span>{t(b.text)}</span></div>
      {b.source && <div className="gd-stat__src">{t(b.source)}</div>}
      {b.more && <div className="gd-stat__more">{lines(b.more)}</div>}
    </Card>
  );
}

// ─── Гид 3 ───────────────────────────────────────────────────────────────
function Route({ b }) {
  return (
    <Card>
      <div className="gd-route">
        <div className="gd-route__me"><div><div className="gd-name gd-name--s" style={{ fontSize: 18 }}>{t(b.title)}</div><p>{t(b.text)}</p></div></div>
        {b.side && <div className="gd-route__side">{t(b.side)}</div>}
        {(b.steps ?? []).map((s, i) => <div key={i} className="gd-route__step">{s}</div>)}
      </div>
    </Card>
  );
}

function Steps({ b }) {
  return (
    <ol className="gd-card gd-steps">
      {(b.items ?? []).map((s, i) => <li key={i}><i>{i + 1}</i><span><b>{t(s.title)}</b><p>{t(s.text)}</p></span></li>)}
    </ol>
  );
}

function Timeline({ b }) {
  return (
    <Card>
      <b className="gd-b-title">{t(b.title)}</b>
      <div className="gd-days">{(b.segments ?? []).slice(0, 3).map((s, i) => <div key={i}>{t(s.title)}<small>{t(s.text)}</small></div>)}</div>
      <div className="gd-days__scale"><span>{b.from}</span><span>{b.to}</span></div>
      {b.note && <p className="gd-note" style={{ marginTop: 10 }}>{lines(b.note)}</p>}
    </Card>
  );
}

function Cast({ b }) {
  return (
    <div className="gd-cast">
      {(b.items ?? []).map((c, i) => <div key={i}><span>{c.letter}</span><b>{t(c.name)}</b><small>{t(c.role)}</small></div>)}
    </div>
  );
}

function Chat({ b }) {
  return (
    <div className="gd-chat" role="img" aria-label={`Пример чата «${b.title}»`}>
      <div className="gd-chat__head"><span>{String(b.title ?? '').slice(0, 1)}</span><div><b>{t(b.title)}</b><small>{t(b.members)}</small></div></div>
      <div className="gd-chat__body">
        {(b.messages ?? []).map((m, i) => (m.me
          ? <div key={i} className="gd-msg gd-msg--me">{t(m.text)}</div>
          : <div key={i} className={`gd-msg${m.accent ? ' gd-msg--her' : ''}`}><small>{m.who}</small>{t(m.text)}</div>))}
      </div>
    </div>
  );
}

function Friends({ b }) {
  const [one, two] = b.items ?? [];
  const pts = [[30, 30], [30, 80], [80, 16], [96, 54], [82, 94], [126, 30], [128, 78], [118, 100], [60, 104], [110, 10]];
  const links = [[0, 1], [0, 2], [1, 4], [2, 3], [4, 3], [3, 5], [3, 6], [4, 7], [1, 8], [2, 9], [5, 9]];
  return (
    <Card className="gd-friends">
      <div>
        <svg viewBox="0 0 140 110" aria-hidden="true"><path d="M50 55H90" stroke="#DDD3C3" strokeWidth="1.5" /><circle cx="44" cy="55" r="12" fill="#061B1B" /><circle cx="96" cy="55" r="12" fill="#E9E1D3" /></svg>
        <b>{t(one?.title)}</b><small>{t(one?.text)}</small>
      </div>
      <div>
        <svg viewBox="0 0 140 110" aria-hidden="true">
          {links.map(([a, c]) => <path key={`${a}-${c}`} d={`M${pts[a][0]} ${pts[a][1]}L${pts[c][0]} ${pts[c][1]}`} stroke="#DDD3C3" strokeWidth="1.2" />)}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i < 2 ? 8 : 5} fill={i < 2 ? '#E9E1D3' : '#DDD3C3'} />)}
        </svg>
        <b>{t(two?.title)}</b><small>{t(two?.text)}</small>
      </div>
    </Card>
  );
}

/** Отметки живут в этом браузере: вернулся через неделю — список там же. */
function Checklist({ b }) {
  const { slug } = useGuide();
  const items = b.items ?? [];
  const key = `nd_guide_checklist_${slug}`;
  const [done, setDone] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')); }
    catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify([...done])); } catch { /* приватный режим */ }
  }, [done, key]);

  const toggle = (i) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i); else next.add(i);
    setDone(next);
    if (next.size === items.length && done.size < items.length) track(EVENTS.GUIDE_CTA, { guide: slug, target: 'checklist_done' });
  };

  return (
    <div className="gd-card gd-check" style={{ padding: '18px 18px 6px' }}>
      <div className="gd-check__top">Готово {done.size} из {items.length}<small>отметки сохраняются</small></div>
      <div className="gd-check__bar"><i style={{ width: `${items.length ? done.size / items.length * 100 : 0}%` }} /></div>
      <ul className="gd-check__list">
        {items.map((x, i) => <li key={i}><label><input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} /><span>{t(x)}</span></label></li>)}
      </ul>
    </div>
  );
}

function Final({ b }) {
  return (
    <div className="gd-dark" data-final="">
      <h2 className="gd-h2 gd-h2--light">{t(b.title)}</h2>
      {b.text && <p className="gd-p" style={{ marginTop: 10 }}>{lines(b.text)}</p>}
      {b.items?.length > 0 && <List kind="check" items={b.items.map(t)} />}
      {b.perks?.length > 0 && (
        <div className="gd-stack" style={{ marginTop: 20, gap: 14 }}>
          {b.perks.map((p, i) => <div key={i} className="gd-perk"><span className="gd-ic gd-ic--s"><Icon name={p.icon} /></span><div><b>{t(p.title)}</b><small>{t(p.text)}</small></div></div>)}
        </div>
      )}
      {b.showrooms && <div className="gd-addr">{SHOWROOMS.map(s => <div key={s.city}><b>{s.city}</b><small>{s.place}, {s.streetAddress}</small></div>)}</div>}
      {b.quote && <p className="gd-quote gd-quote--light">{lines(b.quote)}</p>}
      <div className="gd-btns">
        <CatalogButton variant="white" place="final">{t(b.primary) || 'Смотреть каталог'}</CatalogButton>
        <WaCta type={b.waType === 'help' ? 'help' : 'price'} place="guide_final">{t(b.wa) || 'Написать в WhatsApp'}</WaCta>
      </div>
    </div>
  );
}

const VIEWS = {
  h2: colOf(H2), h3: colOf(H3), p: colOf(Para), quote: colOf(QuoteB), list: colOf(ListB), cta: colOf(Cta),
  perk: colOf(Perk), terms: colOf(Terms), facts: colOf(Facts), clues: colOf(Clues),
  note: wideOf(Note), card: wideOf(CardB), image: wideOf(ImageB), collage: wideOf(Collage), compare: wideOf(Compare),
  places: wideOf(Places), matches: wideOf(Matches), sizer: wideOf(Sizer), engraving: wideOf(Engraving),
  shapes: wideOf(Shapes), equal: wideOf(Equal), carats: wideOf(Carats), swatches: wideOf(Swatches), kinds: wideOf(Kinds),
  sameMoney: wideOf(SameMoney), ladder: wideOf(Ladder), case: wideOf(Case), stat: wideOf(Stat),
  route: wideOf(Route), steps: wideOf(Steps), timeline: wideOf(Timeline), cast: wideOf(Cast), chat: wideOf(Chat),
  friends: wideOf(Friends), checklist: wideOf(Checklist), final: wideOf(Final),
};
const WIDE = new Set(['note', 'card', 'image', 'collage', 'compare', 'places', 'matches', 'sizer', 'engraving', 'shapes', 'equal', 'carats',
  'swatches', 'kinds', 'sameMoney', 'ladder', 'case', 'stat', 'route', 'steps', 'timeline', 'cast', 'chat', 'friends', 'checklist', 'final']);

/** Все блоки статьи подряд. Неизвестный тип пропускаем — старый сайт не ломается от нового блока. */
export default function GuideBlocks({ blocks }) {
  return (
    <div className="gd-body">
      {(blocks ?? []).map((b) => {
        const View = VIEWS[b.type];
        if (!View) return null;
        return (
          <div key={b.id} className={`gd-blk gd-blk--${b.type}${WIDE.has(b.type) ? ' gd-w' : ''}`} data-block={b.id}>
            <View b={b} />
          </div>
        );
      })}
    </div>
  );
}
