import { Link } from 'react-router-dom';
import { track, EVENTS } from '../lib/track.js';
import { Sec, Wide, Col, P, Quote, List, Card, Icon, CatalogButton, Final } from './parts.jsx';
import { useGuide } from './guideCtx.js';

// Гид 1 — «Как не ошибиться с кольцом, если она не знает о предложении».
// Стадия 3 CJM мужчины: решил сделать предложение, ищет, где взять кольцо.

const RING = (n) => `/assets/rings/${n}.webp`;

function Place({ rank, title, pros, cons, best, children }) {
  return (
    <Card pick={best} className="gd-place">
      <div className="gd-place__rank">{rank}</div>
      <div className="gd-name">{title}</div>
      {children}
      <List kind={best ? 'check' : 'plus'} items={pros} />
      {best
        ? <p className="gd-place__minus">Минусы: мы искали.<br />Честно искали.</p>
        : <List kind="minus" items={cons} />}
    </Card>
  );
}

function Order() {
  return (
    <div className="gd-order">
      <div className="gd-order__head"><b>Заказ доставлен</b><span>2 товара, одна коробка</span></div>
      <div className="gd-order__item"><img className="gd-thumb" src={RING('sirius-round')} alt="" loading="lazy" /><span>Кольцо помолвочное, размер универсальный</span><b>4 990 ₸</b></div>
      <div className="gd-order__item"><span className="gd-thumb gd-thumb--icon"><Icon name="phone" /></span><span>Чехол прозрачный для телефона</span><b>1 290 ₸</b></div>
    </div>
  );
}

function Tag() {
  return (
    <div className="gd-tag">
      <div className="gd-tag__t">Только для вас</div>
      <div className="gd-tag__p"><s>850 000</s><b>700 000 ₸</b></div>
    </div>
  );
}

function SameRing() {
  return (
    <div className="gd-same">
      {['Она', 'Подруга', 'Подруга подруги'].map(w => <div key={w}><img src={RING('halo-round')} alt="" loading="lazy" />{w}</div>)}
    </div>
  );
}

function Receipt() {
  const row = (a, b) => <div key={a}><span>{a}</span><i /><b>{b}</b></div>;
  return (
    <div className="gd-receipt">
      {row('Камень', 'ищите сами')}{row('Срок', 'около месяца')}{row('Золото', 'по граммам')}
      <div className="gd-receipt__total">{row('Итого', 'узнаете в конце')}</div>
    </div>
  );
}

function Places() {
  return (
    <>
      <Sec title="Где вообще взять кольцо"><P>От худшего варианта к лучшему.</P></Sec>
      <Wide className="gd-gap">
        <div className="gd-stack">
          <Place rank="5-е место" title="Маркетплейс" pros={['Быстро, дёшево, привезут к двери.']}
                 cons={['Вживую кольцо вы впервые увидите вместе с ней — когда менять что-то уже поздно.',
                        'Это массовое производство, отсюда и цена, и качество.',
                        'И честно: вряд ли она мечтала о кольце, которое приехало в одной коробке с чехлом для телефона.']}>
            <Order />
          </Place>
          <Place rank="4-е место" title="Ювелирный ряд на Золотом базаре" pros={['Можно поторговаться и почувствовать себя героем.']}
                 cons={['Что именно вы купили, точно знает только продавец. Сертификатов и гарантий нет.',
                        'Крупных бриллиантов от 1 карата там практически не бывает: в основном «ереванские» украшения с мелкой россыпью.']}>
            <Tag />
          </Place>
          <Place rank="3-е место" title="Магазин в ТРЦ" pros={['Надёжно, понятно, с гарантией.']}
                 cons={['Вы платите не только за кольцо, но и за аренду бутика в центре торгового центра.',
                        'Индивидуальности ноль: такое же кольцо она уже видела на руке подруги. И на руке подруги подруги.']}>
            <SameRing />
          </Place>
          <Place rank="2-е место" title="Частный мастер" pros={['Сделает кольцо под заказ, по вашей идее.']}
                 cons={['Камень вы ищете сами: сперва мастера, потом продавца бриллиантов. Если вы не разбираетесь в камнях, удачи.',
                        'Мастер один, заказов много — срок часто месяц.',
                        'Цену считают по граммам золота, и сколько вы заплатите, станет понятно в конце.']}>
            <Receipt />
          </Place>
          <Place best rank="1-е место" title="Ювелирная студия"
                 pros={['Есть кольца в наличии — если вы спешите.',
                        'Можно сделать под неё или по вашей идее за 5–10 дней, а не за месяц.',
                        'Камень искать не нужно: подберём и покажем сами.',
                        'Живая примерка до покупки.',
                        'Цена известна заранее, всё по договору, с гарантиями.',
                        'Гравировка в подарок — и кольцо точно не будет как у подруги.']} />
        </div>
      </Wide>
      <Col className="gd-gap"><P muted>Да, мы как раз из этих. Но вы бы и сами догадались.</P></Col>
    </>
  );
}

function Clue({ icon, title, children }) {
  return (
    <div className="gd-clue">
      <span className="gd-ic"><Icon name={icon} /></span>
      <div><h3 className="gd-h3">{title}</h3><p>{children}</p></div>
    </div>
  );
}

function Taste() {
  return (
    <Sec title="Её вкус: она давно всё показала">
      <P>Вам не нужно спрашивать. Нужно просто посмотреть внимательно.</P>
      <div className="gd-clues">
        <Clue icon="hand" title="Её руки">Что она носит каждый день: тонкие цепочки или крупные кольца, белый металл или жёлтый. Это уже половина ответа.</Clue>
        <Clue icon="book" title="Её сохранённое">Если в Pinterest у неё есть папка «свадьба» — поздравляем, техническое задание готово. Если нет, посмотрите, чьи украшения она лайкает в Instagram.</Clue>
        <Clue icon="user" title="Подруга-разведчица">Одна надёжная подруга, которая умеет молчать.</Clue>
      </div>
      <Quote>Именно одна. Две — это уже утечка.</Quote>
    </Sec>
  );
}

const MATCHES = [
  { img: 'sirius-round',      to: '/catalog/product/sirius/classic/round',      if: 'любит простые вещи и минимум украшений',     name: 'Солитер', what: 'Один камень, ничего лишнего' },
  { img: 'halo-round',        to: '/catalog/product/sirius/halo/round',         if: 'любит блеск и внимание',                     name: 'Ореол',   what: 'Камень в кольце из мелких бриллиантов — на руке крупнее' },
  { img: 'bezel-round',       to: '/catalog/product/bezel/bezel/round',         if: 'всё время в движении: спорт, работа руками', name: 'Ободок',  what: 'Камень в сплошном ободке, ничего не цепляется' },
  { img: 'sirius-luxe-round', to: '/catalog/product/sirius-luxe/classic/round', if: 'хочет, чтобы сверкало со всех сторон',       name: 'Дорожка', what: 'Бриллианты идут и по шинке' },
];

function Matches() {
  const { slug } = useGuide();
  return (
    <>
      <Sec title="Какое кольцо какой девушке" />
      <Wide className="gd-gap">
        <div className="gd-row2">
          {MATCHES.map(m => (
            <Link key={m.name} to={m.to} className="gd-match"
                  onClick={() => track(EVENTS.GUIDE_CTA, { guide: slug, target: 'product', place: 'match' })}>
              <img src={RING(m.img)} alt={`Кольцо: ${m.name.toLowerCase()}`} loading="lazy" decoding="async" />
              <div><small>Если она {m.if}</small><div className="gd-name">{m.name}</div><p>{m.what}</p></div>
            </Link>
          ))}
        </div>
        <div className="gd-btns" style={{ marginTop: 16 }}>
          <CatalogButton place="matches">Посмотреть модели в её стиле</CatalogButton>
        </div>
      </Wide>
    </>
  );
}

function Size() {
  return (
    <>
      <Sec title="Размер решается проще, чем кажется">
        <P>Вам помогут её подруги или её старое кольцо, которое она носит на безымянном пальце. Если сюрприз не совсем строгий, спросите её саму — многие девушки давно знают свой размер.</P>
      </Sec>
      <Wide className="gd-gap">
        <Card className="gd-sizer">
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
            <circle cx="52" cy="52" r="44" fill="none" stroke="#E9E1D3" strokeWidth="12" />
            <circle cx="52" cy="52" r="38" fill="none" stroke="#061B1B" strokeWidth="1" />
            <path d="M14 52h76" stroke="#6B5538" strokeWidth="1.2" />
            <path d="M19 48l-5 4 5 4M85 48l5 4-5 4" fill="none" stroke="#6B5538" strokeWidth="1.2" />
            <text x="52" y="44" textAnchor="middle" fontSize="11" fill="#061B1B" fontFamily="Manrope, sans-serif">16,5 мм</text>
          </svg>
          <div><b className="gd-b">Размер — это диаметр</b><p>Внутренний диаметр её кольца в миллиметрах и есть размер: 16,5 мм — размер 16,5.</p></div>
        </Card>
      </Wide>
      <Col className="gd-gap">
        <P>А лучше приведите её к нам на живую примерку. Скажите, что идёте «просто посмотреть» — это даже правда. Заодно точно узнаете, какое кольцо ей нравится.</P>
        <div className="gd-perk" style={{ marginTop: 18 }}>
          <span className="gd-ic gd-ic--s"><Icon name="size" /></span>
          <div><b>Первое изменение размера — бесплатно</b><small>Если не угадали, поправим</small></div>
        </div>
      </Col>
    </>
  );
}

function Engrave() {
  return (
    <>
      <Sec title="Чтобы кольцо было только её">
        <P>Внутри кольца можно оставить то, что понятно только вам двоим: дату, имя, одно слово.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-engr">
          <div className="gd-engr__k">Внутри кольца</div>
          <div className="gd-engr__band">Ты — мой дом · 04.11.26</div>
          <div className="gd-engr__p">Дата, имя или одно слово — в подарок</div>
        </div>
      </Wide>
      <Col className="gd-gap">
        <P>Мужчине это может показаться мелочью. Но по опыту можем сказать: для неё гравировка — одна из самых сильных эмоций во всём предложении. Именно её она покажет подругам второй, сразу после самого кольца.</P>
        <P>Гравировку мы делаем бесплатно, в подарок. Зачем от такого отказываться?</P>
        <Quote>А через двадцать лет она будет снимать кольцо перед тем, как помыть посуду, — и улыбаться.</Quote>
      </Col>
    </>
  );
}

export default function Guide1() {
  return (
    <>
      <Places />
      <Taste />
      <Matches />
      <Size />
      <Engrave />
      <Final title="Осталось выбрать её кольцо" primary="Подобрать кольцо в её стиле" waText="Помогите с выбором" waType="help">
        <p className="gd-p">Девять моделей с ценами. Если сомневаетесь — расскажите о ней, подберём два-три варианта.</p>
      </Final>
    </>
  );
}
