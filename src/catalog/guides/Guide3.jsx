import { useEffect, useState } from 'react';
import { track, EVENTS } from '../lib/track.js';
import { SHOWROOMS } from '../data/org.js';
import { Sec, Wide, Col, P, Quote, List, Card, Icon, CatalogButton, Final } from './parts.jsx';
import { useGuide } from './guideCtx.js';

// Гид 3 — «Предложение руки и сердца: как организовать быстро и без стресса».
// Стадия 5 CJM: кольцо почти выбрано, впереди сам день.

function Tradition() {
  return (
    <>
      <Sec title="Как это устроено у нас">
        <P>У казахов путь до свадьбы — это не один вопрос на колене, а целая дорога между двумя семьями: сөз салу, құда түсу, сырға салу, қыз ұзату и той. Старшие знают этот маршрут наизусть.</P>
      </Sec>
      <Wide className="gd-gap">
        <Card>
          <div className="gd-route">
            <div className="gd-route__me"><div><div className="gd-name gd-name--s" style={{ fontSize: 18 }}>Её «да»</div><p>вы делаете предложение — лично, с кольцом</p></div></div>
            <div className="gd-route__side">дальше — дорога двух семей</div>
            {['Сөз салу', 'Құда түсу', 'Сырға салу', 'Қыз ұзату', 'Той'].map(s => <div key={s} className="gd-route__step">{s}</div>)}
          </div>
        </Card>
      </Wide>
      <Col className="gd-gap">
        <P>Но у многих пар сейчас всё начинается с одного момента, который принадлежит только вам двоим: вы делаете предложение ей — лично, красиво, с кольцом. Она говорит «да», и только потом в дело вступают семьи.</P>
        <Quote>Своё «да» она должна услышать от вас, а не от сватов.</Quote>
        <P>Вот про этот момент и поговорим.</P>
      </Col>
    </>
  );
}

const STEPS = [
  ['Кольцо', 'Самое важное, поэтому первое.'],
  ['Команда', 'Ваш друг и её подруга — о них чуть ниже.'],
  ['Место и время', 'И сразу запасной вариант на случай погоды.'],
  ['Слова', 'Не речь, а три фразы от себя.'],
  ['Что после «да»', 'Вечер вдвоём и звонок старшим.'],
];

function Order() {
  return (
    <>
      <Sec title="С чего начать"><P>Рекомендуем такой порядок:</P></Sec>
      <Wide className="gd-gap">
        <ol className="gd-card gd-steps" style={{ margin: 0, listStyle: 'none' }}>
          {STEPS.map(([t, d], i) => <li key={t}><i>{i + 1}</i><span><b>{t}</b><p>{d}</p></span></li>)}
        </ol>
      </Wide>
      <Col className="gd-gap">
        <div className="gd-card gd-card--soft">
          <b className="gd-b" style={{ fontSize: 16 }}>Самое главное правило — не откладывать</b>
          <p className="gd-p" style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.55 }}>Всё по порядку и грамотно: так вы избежите лишнего стресса и не превратите праздник в испытание.</p>
        </div>
      </Col>
    </>
  );
}

function Delay() {
  return (
    <>
      <Sec title="Кольцо: что будет, если отложить">
        <P>К нам приходят мужчины, у которых до предложения остался день или два. Обычно с таким же выражением лица, как у студента в ночь перед экзаменом. Мы поможем и в такой ситуации. Но честно: так делать не надо.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-vs">
          <Card>
            <div className="gd-eyebrow">За день до</div>
            <List kind="x" small items={['Кольцо «какое было»', 'Маркетплейс с доставкой «завтра»', 'Без примерки', 'Без гравировки', 'Без истории']} />
          </Card>
          <Card pick>
            <div className="gd-eyebrow">За две недели</div>
            <List kind="check" small items={['Кольцо под её стиль', 'Примерка до покупки', 'Гравировка в подарок', 'Подскажем с размером', 'Ваша дата у нас в голове']} />
          </Card>
        </div>
      </Wide>
      <Col className="gd-gap">
        <P>Когда времени нет, выбираешь не то, что ей подходит, а то, что успеваешь купить.</P>
        <P>А она запомнит это кольцо навсегда. Внутри каждой девушки живёт девочка, которая с детства представляла этот момент. Ей не нужно самое дорогое кольцо.</P>
        <Quote>Ей важно почувствовать, что вы выбирали его для неё, а не захватили по дороге.</Quote>
        <h3 className="gd-h3" style={{ marginTop: 32 }}>Как правильно</h3>
        <P className="gd-p--tight">Напишите нам заранее — за 2 недели до даты. Кольцо изготавливается 5–10 дней, и этого хватит, чтобы спокойно выбрать и сделать гравировку.</P>
      </Col>
      <Wide className="gd-gap">
        <Card>
          <b className="gd-b" style={{ fontSize: 15 }}>Две недели до даты</b>
          <div className="gd-days">
            <div>Пишете нам<small>выбор, примерка</small></div>
            <div>Изготовление<small>5–10 дней, гравировка</small></div>
            <div>Её «да»<small>кольцо у вас</small></div>
          </div>
          <div className="gd-days__scale"><span>1 день</span><span>14 день</span></div>
          <p className="gd-note" style={{ marginTop: 10 }}>Уже всё горит — тоже пишите: есть срочное изготовление и кольца в наличии.</p>
        </Card>
      </Wide>
      <Col className="gd-gap">
        <P>Выбирать можно так, как удобно: присмотреть 2–3 модели в каталоге и написать нам или сразу приехать на живой показ. Если сюрприз не обязателен, приезжайте вместе с ней — так делают многие пары.</P>
        <div className="gd-btns" style={{ marginTop: 18 }}><CatalogButton place="delay">Смотреть каталог</CatalogButton></div>
      </Col>
    </>
  );
}

function Mission({ title, sub, tasks }) {
  return (
    <Card>
      <div className="gd-name gd-name--s" style={{ fontSize: 19 }}>{title}</div>
      <div className="gd-eyebrow" style={{ marginTop: 2, fontWeight: 400, fontSize: 13.5 }}>{sub}</div>
      <List kind="check" items={tasks} />
    </Card>
  );
}

function Chat() {
  const msg = (who, t, cls = '') => <div className={`gd-msg ${cls}`}><small>{who}</small>{t}</div>;
  return (
    <div className="gd-chat" role="img" aria-label="Пример общего чата друга и подруги">
      <div className="gd-chat__head"><span>Д</span><div><b>День рождения дяди Каната</b><small>Вы, Ерлан, Айгерим</small></div></div>
      <div className="gd-chat__body">
        {msg('Айгерим', 'Маникюр сделали. Сказала ей «просто так». Поверила', 'gd-msg--her')}
        {msg('Ерлан', 'Фотограф на месте, столик держат до 20:00')}
        {msg('Айгерим', 'Выехали. Она думает, что мы на ужин', 'gd-msg--her')}
        <div className="gd-msg gd-msg--me">Кольцо в кармане. Проверил три раза</div>
        {msg('Ерлан', 'Проверь четвёртый')}
      </div>
    </div>
  );
}

function OneFriend() {
  const pts = [[30, 30], [30, 80], [80, 16], [96, 54], [82, 94], [126, 30], [128, 78], [118, 100], [60, 104], [110, 10]];
  const links = [[0, 1], [0, 2], [1, 4], [2, 3], [4, 3], [3, 5], [3, 6], [4, 7], [1, 8], [2, 9], [5, 9]];
  return (
    <Card className="gd-friends" >
      <div>
        <svg viewBox="0 0 140 110" aria-hidden="true"><path d="M50 55H90" stroke="#DDD3C3" strokeWidth="1.5" /><circle cx="44" cy="55" r="12" fill="#061B1B" /><circle cx="96" cy="55" r="12" fill="#E9E1D3" /></svg>
        <b>Одна подруга</b><small>секрет</small>
      </div>
      <div>
        <svg viewBox="0 0 140 110" aria-hidden="true">
          {links.map(([a, b]) => <path key={`${a}-${b}`} d={`M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}`} stroke="#DDD3C3" strokeWidth="1.2" />)}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i < 2 ? 8 : 5} fill={i < 2 ? '#E9E1D3' : '#DDD3C3'} />)}
        </svg>
        <b>Две подруги</b><small>к вечеру знают все</small>
      </div>
    </Card>
  );
}

function Team() {
  return (
    <>
      <Sec title="Главных участников не двое, а четверо">
        <P>Кажется, что предложение — это история про вас двоих. На самом деле за кулисами работают ещё двое: ваш друг и её подруга. Без них сюрприз либо раскроется раньше времени, либо пойдёт не по плану.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-cast">
          <div><span>Вы</span><b>Вы</b><small>задаёте вопрос</small></div>
          <div><span>Она</span><b>Она</b><small>говорит «да»</small></div>
          <div><span>Д</span><b>Ваш друг</b><small>штаб</small></div>
          <div><span>П</span><b>Её подруга</b><small>разведчица и союзница</small></div>
        </div>
      </Wide>
      <Wide className="gd-gap-s">
        <div className="gd-stack gd-stack--10">
          <Mission title="Ваш друг" sub="Штаб" tasks={[
            'Бронирует место и ужин на после «да».',
            'Находит фотографа и приводит его за полчаса. Или снимает сам, если рука не дрожит.',
            'Забирает цветы и всё для декора, приезжает раньше всех.',
            'Решает форс-мажоры, пока вы стоите на одном колене. Дождь, опоздавший фотограф, закрытая калитка — теперь это его проблемы.',
            'Не даёт вам сорваться: напоминает, что она скажет «да», и выдаёт стакан воды.',
          ]} />
          <Mission title="Её подруга" sub="Разведчица и союзница" tasks={[
            'Заранее узнаёт её вкус: какие кольца она сохраняет, какой металл любит.',
            'Аккуратно выясняет размер — между прочим, за примеркой её же колец.',
            'Уговаривает сделать маникюр накануне. «Давай сделаем, просто так» — её главное оружие.',
            'Придумывает повод, чтобы она оделась красиво и ничего не заподозрила.',
            'Первой обнимает её после «да». И держит секрет — самая сложная часть работы.',
          ]} />
        </div>
      </Wide>
      <Col className="gd-gap"><P>Познакомьте их друг с другом и заведите общий чат. Назовите его понезаметнее — «День рождения дяди Каната» подойдёт.</P></Col>
      <Wide className="gd-gap"><Chat /></Wide>
      <Col className="gd-s" >
        <h3 className="gd-h3">Правило одной подруги</h3>
        <P className="gd-p--tight">С каждой стороны — строго по одному человеку. Особенно с её: не две подруги, а одна. Две подруги — это уже утечка информации и конец секрету.</P>
      </Col>
      <Wide className="gd-gap"><OneFriend /></Wide>
    </>
  );
}

function Manners() {
  return (
    <>
      <Sec title="Как принято и как не принято" />
      <Wide className="gd-gap">
        <div className="gd-stack gd-stack--10">
          <Card>
            <b className="gd-b" style={{ fontSize: 16 }}>Принято</b>
            <List kind="check" items={[
              'Делать предложение наедине или в кругу самых близких.',
              'Сказать слова от себя: что чувствуете, что обещаете и сам вопрос.',
              'Запечатлеть момент — его она будет пересматривать чаще, чем фото со свадьбы.',
              'Предупредить своих родителей заранее: дальше очередь старших.',
            ]} />
          </Card>
          <Card>
            <b className="gd-b" style={{ fontSize: 16 }}>Лучше не надо</b>
            <List kind="x" items={[
              'Публичное предложение, если она стеснительная. Флешмоб на стадионе хорош только в кино.',
              'Прятать кольцо в торт или бокал. Стоматологи скажут вам спасибо, она — вряд ли.',
              'Делать предложение на чужом празднике: в этот день внимание должно быть только у неё.',
              'Оставлять всё на последнюю неделю. Погода, пробки и её планы любят сюрпризы больше, чем вы.',
            ]} />
          </Card>
        </div>
      </Wide>
    </>
  );
}

const CHECKLIST = [
  'Кольцо — в футляре и у вас в кармане (да, люди забывают). Летите за границу — только в ручной клади',
  'Друг и её подруга в курсе и на связи',
  'Место, время и запасной вариант на случай погоды. За границей — билеты, бронь и местный фотограф заранее',
  'Три фразы в голове: что чувствуете, что обещаете и сам вопрос',
  'Кто-то с камерой — фотограф или друг с твёрдой рукой',
  'План на после «да» — ужин или вечер вдвоём',
  'Предупреждённые родители — дальше их очередь',
];
const CHECK_KEY = 'nd_guide_checklist';

/** Отметки живут в этом браузере: вернулся через неделю — список там же. */
function Checklist() {
  const { slug } = useGuide();
  const [done, setDone] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CHECK_KEY) ?? '[]')); }
    catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem(CHECK_KEY, JSON.stringify([...done])); } catch { /* приватный режим */ }
  }, [done]);

  const toggle = (i) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i); else next.add(i);
    setDone(next);
    if (next.size === CHECKLIST.length && done.size < CHECKLIST.length) track(EVENTS.GUIDE_CTA, { guide: slug, target: 'checklist_done' });
  };

  return (
    <>
      <Sec title="Что обязательно должно быть в день предложения">
        <P>Соберём всё в один список. Всё отмечено — вы готовы.</P>
      </Sec>
      <Wide className="gd-gap">
        <div className="gd-card gd-check" style={{ padding: '18px 18px 6px' }}>
          <div className="gd-check__top">Готово {done.size} из {CHECKLIST.length}<small>отметки сохраняются</small></div>
          <div className="gd-check__bar"><i style={{ width: `${done.size / CHECKLIST.length * 100}%` }} /></div>
          <ul className="gd-check__list">
            {CHECKLIST.map((t, i) => (
              <li key={i}><label><input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} /><span>{t}</span></label></li>
            ))}
          </ul>
        </div>
      </Wide>
    </>
  );
}

const PERKS = [
  ['clock', 'В наличии или на заказ', 'Срочно — если горит, 5–10 дней — если всё вовремя'],
  ['pin', 'Живой показ', 'Шоурумы в Алматы и Астане'],
  ['pen', 'Индивидуальная гравировка', 'в подарок'],
  ['size', 'Первое изменение размера', 'бесплатно'],
  ['spark', 'Пожизненный уход', 'чистка и родирование — бесплатно, навсегда'],
];

export default function Guide3() {
  return (
    <>
      <Tradition />
      <Order />
      <Delay />
      <Team />
      <Manners />
      <Checklist />
      <Final title="Список есть, команда есть. Осталось кольцо" primary="Смотреть каталог" waText="Обсудить кольцо в WhatsApp">
        <p className="gd-p" style={{ marginTop: 10 }}>Мы знаем про помолвочные кольца всё. С нами самая сложная часть подготовки становится самой простой.</p>
        <div className="gd-stack" style={{ marginTop: 20, gap: 14 }}>
          {PERKS.map(([ic, t, s]) => (
            <div key={t} className="gd-perk"><span className="gd-ic gd-ic--s"><Icon name={ic} /></span><div><b>{t}</b><small>{s}</small></div></div>
          ))}
        </div>
        <div className="gd-addr">
          {SHOWROOMS.map(s => <div key={s.city}><b>{s.city}</b><small>{s.place}, {s.streetAddress}</small></div>)}
        </div>
        <Quote light>Вы берёте на себя слова и смелость. Кольцо возьмём на себя мы.</Quote>
      </Final>
    </>
  );
}
