import { usePrices, pricesKnown } from '../data/prices.js';
import { calcPrice, formatPrice } from '../data/priceCalc.js';
import { Sec, Wide, Col, P, Quote, List, Card, Final } from './parts.jsx';

// Гид 2 — «Всё, что мужчине нужно знать о помолвочном кольце, за 5 минут».
// Стадия 4 CJM: выбирает и боится, что ему продадут не то.

const SHAPE = (id) => `/assets/shapes/${id}.webp`;

function Terms() {
  return (
    <Sec title="Кольцо — это три вещи">
      <dl className="gd-terms">
        <div><dt>Оправа</dt><dd>То, что держит камень.</dd></div>
        <div><dt>Камень</dt><dd>То, на что смотрят все.</dd></div>
        <div><dt>Металл</dt><dd>То, что она будет чувствовать на пальце каждый день.</dd></div>
      </dl>
      <P>Всё. Вы уже знаете больше, чем половина мужчин у витрины.</P>
    </Sec>
  );
}

// Коллаж — примеры оправ из Pinterest, которые прислал владелец (09.11).
// Свои модели здесь не перечисляем: они в каталоге, а здесь — «можно любую».
const COLLAGE = ['three-stone', 'marquise', 'oval-wrap', 'pear-pave', 'oval-twist'];

function Settings() {
  return (
    <>
      <Sec title="Оправа: характер кольца">
        <P>Оправа — это дизайн кольца: как держится камень, есть ли вокруг него мелкие бриллианты, какая шинка. Один и тот же бриллиант в разных оправах — это разные кольца.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-collage">
          {COLLAGE.map(n => <img key={n} src={`/assets/guides/${n}.webp`} alt="" loading="lazy" decoding="async" />)}
        </div>
      </Wide>
      <Col className="gd-gap">
        <P>В каталоге — наши основные модели. Но сделать можем любую оправу: по фото из Pinterest, по эскизу или по вашей идее.</P>
      </Col>
    </>
  );
}

const SHAPES = [['round', 'Круг'], ['oval', 'Овал'], ['pear', 'Груша'], ['marquise', 'Маркиз'], ['heart', 'Сердце'],
                ['princess', 'Принцесса'], ['cushion', 'Кушон'], ['radiant', 'Радиант'], ['emerald', 'Изумруд'], ['asscher', 'Ашер']];

const FACTS = [
  [['round'], 'Круг — классика', 'Максимум блеска. С ним невозможно промахнуться.'],
  [['oval'], 'Овал — сейчас в тренде', 'Вытягивает пальцы и кажется крупнее круга.'],
  [['marquise'], 'Маркиз — самый крупный на вид', 'При той же каратности выглядит больше всех.'],
  [['radiant'], 'Радиант — прямоугольник с блеском', 'Самый блестящий из прямоугольных: сияет почти как круг.'],
  [['emerald', 'asscher'], 'Изумрудная и ашер не искрят', 'Грани идут широкими ступенями: вместо искр — спокойные глубокие блики, как в зеркальном коридоре.'],
];

function Shapes() {
  return (
    <>
      <Sec title="Форма камня: вкус в одном взгляде">
        <P>Форм десять, и любую можно поставить в любую оправу.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-shapes">
          {SHAPES.map(([id, name]) => (
            <figure key={id}><span><img src={SHAPE(id)} alt="" loading="lazy" /></span><figcaption>{name}</figcaption></figure>
          ))}
        </div>
      </Wide>
      <Col className="gd-s" >
        <h3 className="gd-h3">Что стоит знать</h3>
        <div className="gd-facts">
          {FACTS.map(([ids, t, d]) => (
            <div key={t} className="gd-fact">
              <span className="gd-fact__ic">{ids.map(id => <img key={id} src={SHAPE(id)} alt="" loading="lazy" />)}</span>
              <div><b>{t}</b><p>{d}</p></div>
            </div>
          ))}
        </div>
      </Col>
      <Wide className="gd-gap">
        <Card className="gd-center">
          <div className="gd-eq">
            <span><img src={SHAPE('round')} alt="Круг" /></span><i>=</i>
            <span><img src={SHAPE('marquise')} alt="Маркиз" /></span><i>=</i>
            <span><img src={SHAPE('heart')} alt="Сердце" /></span>
          </div>
          <b>У нас цена не зависит от формы</b>
          <p>Выбирайте сердцем, а не калькулятором.</p>
        </Card>
      </Wide>
    </>
  );
}

const GLASSES = (
  <svg viewBox="0 0 70 22" aria-hidden="true">
    <path d="M2 6h66" stroke="#0B2040" strokeWidth="2" />
    <rect x="6" y="5" width="24" height="14" rx="6" fill="#0B2040" /><rect x="40" y="5" width="24" height="14" rx="6" fill="#0B2040" />
  </svg>
);

function Carats() {
  const stone = (px, ct, mm, cap, glasses) => (
    <div className="gd-carat" key={ct}>
      <div className="gd-carat__stone"><span style={{ width: px, height: px }}><img src={SHAPE('round')} alt="" loading="lazy" />{glasses && GLASSES}</span></div>
      <b>{ct}</b><small>{mm}</small><p>{cap}</p>
    </div>
  );
  return (
    <>
      <Sec title="Каратность: цифра про вес, на руке — про размер" />
      <Wide className="gd-gap">
        <Card className="gd-carats" >
          {stone(54, '1 ct', '≈ 6,5 мм', 'заметно и элегантно')}
          {stone(68, '2 ct', '≈ 8,2 мм', 'подруги говорят «ого»')}
          {stone(78, '3 ct', '≈ 9,4 мм', 'подругам понадобятся солнечные очки', true)}
        </Card>
      </Wide>
      <Col className="gd-gap">
        <P>Хочется больше? Делаем и до 20 карат — нам без разницы, вашей руке тоже скорее всего.</P>
        <P>Чаще всего для предложения выбирают 2–3 карата. 1 карат — тоже грамотный выбор, а с ореолом он будет смотреться ещё лучше.</P>
      </Col>
    </>
  );
}

// ─── Лабораторный или природный ──────────────────────────────────────────
// Цены лабораторных — из прайса сайта, природный Sirius 1 ct со средними
// характеристиками ≈ 2 млн ₸ — оценка владельца (09.11.2026). На те же деньги
// показываем Neo Halo Luxe с 5 ct — самый нарядный вариант, что в них влезает.
const NATURAL_SIRIUS = 2_000_000;

function Bar({ label, sub, price, share, ink }) {
  return (
    <div className={`gd-bar${ink ? ' gd-bar--ink' : ''}`}>
      <div className="gd-bar__top"><span>{label}</span><span className="gd-price">{price}</span></div>
      <small>{sub}</small>
      <div className="gd-bar__track"><i style={{ width: `${share}%` }} /></div>
    </div>
  );
}

function SameMoney() {
  const prices = usePrices();
  const known = pricesKnown();
  const lab1 = known ? calcPrice({ shankLabel: 'Sirius', cast: 'classic', carat: 1 }, prices) : null;
  const lab5 = known ? calcPrice({ shankLabel: 'Neo Luxe', cast: 'halo', carat: 5 }, prices) : null;
  const money = (n) => (n ? formatPrice(n) : '—');
  return (
    <Card>
      <b className="gd-b" style={{ fontSize: 15.5 }}>Один и тот же Sirius, 1 карат</b>
      <Bar ink label="С лабораторным" sub="та же красота" price={money(lab1)} share={lab1 ? Math.round(lab1 / NATURAL_SIRIUS * 100) : 28} />
      <Bar label="С природным" sub="средние характеристики" price={`≈ ${formatPrice(NATURAL_SIRIUS)}`} share={100} />
      <div className="gd-split">
        <b className="gd-b" style={{ fontSize: 15.5 }}>А на те же 2 миллиона</b>
        <div className="gd-stones">
          <div><span className="gd-stones__img"><img src={SHAPE('round')} alt="" style={{ width: 46, height: 46 }} /></span>Sirius с природным<br />1 карат<br /><span className="gd-price">≈ {formatPrice(NATURAL_SIRIUS)}</span></div>
          <div><span className="gd-stones__img"><img src={SHAPE('round')} alt="" style={{ width: 88, height: 88 }} /></span>Neo Halo Luxe с лабораторным<br />5 карат<br /><span className="gd-price">{money(lab5)}</span></div>
        </div>
      </div>
    </Card>
  );
}

function Ladder() {
  const row = (t, d, keep, verdict, good) => (
    <div key={t} className={`gd-ladder__row${good ? ' gd-ladder__row--good gd-bar--ink' : ''}`}>
      <div className="gd-ladder__top">{t}<span>{verdict}</span></div>
      <p>{d}</p>
      <div className="gd-bar__track"><i style={{ width: `${keep}%` }} /></div>
    </div>
  );
  return (
    <Card>
      <b className="gd-b" style={{ fontSize: 15.5 }}>Сколько вернётся при перепродаже</b>
      <div style={{ marginTop: 4 }}>
        {row('Редкие цветные, от 3–5 карат', 'Розовые, голубые, красные. Аукционы Christie’s и Sotheby’s, миллионы долларов за камень.', 100, 'может расти', true)}
        {row('От 3 карат, топовые характеристики', 'Цвет от F, чистота от VVS1, без флюоресценции. От 15–20 млн ₸.', 45, 'минус 40–70%')}
        {row('До 3 карат, средние характеристики', 'То, что продают в обычных ювелирных магазинах.', 10, 'минус до 90%')}
      </div>
      <p className="gd-note">Ломбарды бриллианты не принимают. Продать можно только дилеру — через алмазную биржу.</p>
    </Card>
  );
}

function Case() {
  return (
    <div className="gd-dark">
      <div className="gd-eyebrow">История из нашей практики</div>
      <h3 className="gd-h2 gd-h2--light" style={{ marginTop: 6 }}>Камень за 890 тысяч долларов</h3>
      <div className="gd-case__cert">
        <img src="/assets/guides/gia-5-88.webp" alt="Сертификат GIA: 5,88 карата, цвет D, чистота Flawless" loading="lazy" />
        <dl>
          <div><dt>Вес</dt><dd>5,88 ct</dd></div>
          <div><dt>Цвет</dt><dd>D</dd></div>
          <div><dt>Чистота</dt><dd>FL</dd></div>
          <div><dt>Огранка</dt><dd>Excellent</dd></div>
          <div><dt>Флюор.</dt><dd>нет</dd></div>
        </dl>
      </div>
      <div className="gd-case__cap">Сертификат GIA, номер отчёта скрыт</div>
      <p className="gd-p" style={{ marginTop: 16 }}>Известный предприниматель купил этот камень в De Beers в 2015 году. Высший цвет D, чистота Flawless — без единого включения, идеальная огранка. Пришёл к нам, чтобы продать. Мы вышли напрямую на алмазных дилеров — профессионалов, которые охотятся за такими камнями.</p>
      <div className="gd-case__nums">
        <div><small>Купил за</small><s><b>$890 000</b></s></div>
        <div><small>Лучшее предложение</small><b>$150 000</b></div>
      </div>
      <p className="gd-p">Минус 83%. Он решил не продавать: «Ладно, пусть лежит». Кольцо до сих пор носит его жена.</p>
      <Quote light>Если так дешевеет идеальный камень за 890 тысяч долларов, об инвестиции в природный за 2 миллиона тенге говорить не приходится.</Quote>
    </div>
  );
}

function Origin() {
  return (
    <>
      <Sec title="Бриллиант: лабораторный или природный">
        <P>Оба настоящие. Разница — в происхождении и в цене. Спокойно разберёмся, за что вы платите.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-card" style={{ padding: '12px 12px 16px' }}>
          <div className="gd-kinds">
            <div><div className="gd-name gd-name--s">Природный</div><p>Рос миллиарды лет под землёй. Добывают в шахтах.</p></div>
            <div><div className="gd-name gd-name--s">Лабораторный</div><p>Тот же процесс, только в реакторе и за недели.</p></div>
          </div>
          <p className="gd-p" style={{ margin: '14px 2px 0', fontSize: 14, lineHeight: 1.55 }}>
            <b>Одинаковые во всём:</b> состав, кристалл, блеск, твёрдость. На глаз и даже обычным тестером их не отличить — только прибором в геммологической лаборатории.
          </p>
        </div>
      </Wide>
      <Wide className="gd-gap-s"><SameMoney /></Wide>

      <Col className="gd-s" >
        <h3 className="gd-h3">«Но природный — это же инвестиция»</h3>
        <P className="gd-p--tight">Нет. Инвестиция — только редчайшие камни, которые продают на аукционах за миллионы долларов. Всё остальное при перепродаже теряет в цене.</P>
      </Col>
      <Wide className="gd-gap"><Ladder /></Wide>
      <Wide className="gd-gap-s"><Case /></Wide>
      <Wide className="gd-gap-s">
        <div className="gd-card gd-card--soft">
          <b className="gd-b" style={{ fontSize: 15.5 }}>Россыпь природных — худшая сделка</b>
          <p className="gd-p" style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.55 }}>Кольцо из множества мелких природных камней стоит как цельный лабораторный бриллиант. Ценности в ней нет — это крошка, а не камень. Статуса «природного бриллианта» тоже нет: цельного камня нет. Такие кольца и продают на базарах.</p>
        </div>
      </Wide>

      <Col className="gd-s">
        <h3 className="gd-h3">Лабораторный — это вообще нормально дарить?</h3>
        <P className="gd-p--tight">Больше чем нормально: это уже выбор большинства.</P>
      </Col>
      <Wide className="gd-gap">
        <Card>
          {/* The Knot, Real Weddings Study 2025: 10 474 пары в США. */}
          <div className="gd-stat"><b>61%</b><span>пар в США в 2025 году выбрали для помолвки лабораторный бриллиант</span></div>
          <div className="gd-stat__src">По данным The Knot, свадебного портала</div>
          <div className="gd-stat__more">Pandora, крупнейший ювелирный бренд мира, с 2021 года работает только с лабораторными бриллиантами.</div>
        </Card>
      </Wide>
      <Col className="gd-gap"><P>А вот что дарить не стоит — муассанит.</P></Col>
      <Wide className="gd-gap-s">
        <Card>
          <div className="gd-name gd-name--s" style={{ fontSize: 19 }}>Муассанит — не бриллиант</div>
          <List kind="x" items={[
            'Другой минерал — карбид кремния. Ни по составу, ни по ценности не бриллиант.',
            'Блестит радужно, как диско-шар — опытный глаз видит разницу сразу.',
            'Обычный тестер показывает его как бриллиант. Поэтому им подменяют лабораторные — и продают по их цене.',
          ]} />
          <p className="gd-quote" style={{ marginTop: 14, fontSize: 23, lineHeight: 1.2 }}>Лабораторный бриллиант — настоящий. Муассанит — имитация, как реплика часов.</p>
          <p className="gd-note" style={{ marginTop: 12 }}>Как проверить: у настоящего лабораторного бриллианта есть сертификат IGI с номером, который выгравирован на самом камне.</p>
        </Card>
      </Wide>

      <Col className="gd-s">
        <h3 className="gd-h3">Как выбрать</h3>
        <P className="gd-p--tight">Решайте осознанно — оба выбора нормальные, если вы знаете, за что платите.</P>
      </Col>
      <Wide className="gd-gap">
        <div className="gd-stack gd-stack--10">
          <Card pick>
            <div className="gd-name gd-name--s">Лабораторный, если</div>
            <List kind="check" items={['хотите тот же блеск в 3–4 раза дешевле', 'на те же деньги — камень крупнее и оправу интереснее', 'важно, что камень без шахт и карьеров']} />
          </Card>
          <Card>
            <div className="gd-name gd-name--s">Природный, если</div>
            <List kind="dot" items={['важно, что камню миллиарды лет', 'готовы переплатить в 3–4 раза — и понимаете, что это не инвестиция']} />
          </Card>
        </div>
      </Wide>
    </>
  );
}

function Metal() {
  const sw = (c, n, t) => <div className="gd-swatch" key={n}><span style={{ background: c }} /><b>{n}</b><small>{t}</small></div>;
  return (
    <>
      <Sec title="Металл: то, что останется с ней каждый день" />
      <Wide className="gd-gap">
        <Card className="gd-swatches" >
          {sw('#E3E6EA', 'Белое золото', 'холодный блеск, классика')}
          {sw('#D9B970', 'Жёлтое', 'тепло и немного винтажа')}
          {sw('#D9A28E', 'Розовое', 'самое нежное из трёх')}
        </Card>
      </Wide>
      <Col className="gd-gap"><P>Проба — это сколько в сплаве золота.</P></Col>
      <Wide className="gd-gap-s">
        <div className="gd-proba">
          <Card pick><div className="gd-proba__n"><b>585</b><small>советуем</small></div><p>Прочнее, спокойно переживёт спортзал и мытьё посуды.</p></Card>
          <Card><div className="gd-proba__n"><b>750</b></div><p>Больше золота, насыщеннее цвет, но мягче.</p></Card>
        </div>
      </Wide>
    </>
  );
}

export default function Guide2() {
  return (
    <>
      <Terms />
      <Settings />
      <Shapes />
      <Carats />
      <Origin />
      <Metal />
      <Final title="Хватит теории — посмотрите на кольца" primary="Смотреть каталог" waText="Написать нам">
        <List kind="check" items={[
          'Выбираете стиль кольца, который вам нравится.',
          'Меняете форму и каратность прямо на экране — кольцо меняется в 3D.',
          'Цена видна сразу, без «уточните у менеджера».',
          'Понравилось — одна кнопка, и мы на связи. Хотите вживую — запишем на показ.',
        ]} />
        <Quote light>Пять минут в каталоге — и у вас уже не «какое-то кольцо», а её кольцо.</Quote>
      </Final>
    </>
  );
}
