// Обложки гидов. Юмор — не чужие мемы, а «скриншоты» из жизни того, кто
// готовит предложение: её доска «Свадьба» и подруга с размером, кольцо в
// разрезе, экран блокировки накануне. Узнаваемо и без чужих прав.
//
// Обложка рисуется в одном масштабе и для статьи, и для маленькой карточки в
// ленте: все размеры внутри — в долях ширины (единица --u в guides.css).

const RING = (name) => `/assets/rings/${name}.webp`;

function Secret({ loading }) {
  return (
    <>
      <div className="gc-board">
        <div className="gc-board__head"><b>Свадьба</b><span>48 сохранённых</span></div>
        <div className="gc-board__grid">
          {['sirius-round', 'halo-round', 'bezel-round', 'sirius-luxe-round'].map(n => (
            <img key={n} src={RING(n)} alt="" loading={loading} decoding="async" />
          ))}
        </div>
      </div>
      <div className="gc-note">
        <span className="gc-ava">А</span>
        <div><b>Айгерим, её подруга</b><p>Размер 16,5. Я тебе ничего не говорила</p></div>
      </div>
    </>
  );
}

function Anatomy({ loading }) {
  return (
    <>
      <div className="gc-photo"><img src={RING('sirius-oval')} alt="" loading={loading} decoding="async" /></div>
      <svg className="gc-lines" viewBox="0 0 366 300" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M202 112 L262 62 L292 62" /><path d="M172 100 L88 112 L40 112" /><path d="M150 196 L92 236 L40 236" />
        </g>
        <g fill="currentColor"><circle cx="202" cy="112" r="3" /><circle cx="172" cy="100" r="3" /><circle cx="150" cy="196" r="3" /></g>
      </svg>
      <span className="gc-tag" style={{ '--x': 298, '--y': 55 }}>Камень</span>
      <span className="gc-tag" style={{ '--x': 34, '--y': 92 }}>Оправа</span>
      <span className="gc-tag" style={{ '--x': 34, '--y': 216 }}>Металл</span>
      <span className="gc-caption">Три слова — и вы говорите с ювелиром на одном языке</span>
    </>
  );
}

const CLOCK = <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const PEN   = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;

function Notif({ app, when, title, text, icon }) {
  return (
    <div className="gc-notif">
      <span className="gc-notif__ic">{icon}</span>
      <div>
        <div className="gc-notif__meta"><span>{app}</span><span>{when}</span></div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Tomorrow() {
  return (
    <>
      <div className="gc-lock"><span>Вторник, 3 ноября</span><b>23:47</b></div>
      <div className="gc-notifs">
        <Notif app="Календарь" when="сейчас" title="Завтра: предложение" text="19:00, ресторан на крыше" icon={CLOCK} />
        <Notif app="Заметки" when="2 нед. назад" title="Купить кольцо" text="срочно!!! не забыть!!!" icon={PEN} />
      </div>
    </>
  );
}

const COVERS = { secret: Secret, anatomy: Anatomy, tomorrow: Tomorrow };

/** eager — для обложки в начале статьи: она на первом экране. */
export function GuideCover({ kind, eager = false }) {
  const Inner = COVERS[kind];
  return (
    <div className={`gc gc--${kind}`} aria-hidden="true">
      {Inner && <Inner loading={eager ? 'eager' : 'lazy'} />}
    </div>
  );
}
