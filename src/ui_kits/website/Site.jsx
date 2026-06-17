/* Neo Diamond — marketing website (storefront home + catalog). Interactive. */
let Button, IconButton, Badge, Tag, Avatar, Tabs, Card, PriceTag;

const ic = {
  Gem: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>,
  Sliders: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>,
  Sparkle: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/></svg>,
  Pen: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  Shield: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>,
  Truck: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 6h13v11H1zM14 9h4l3 3v5h-7"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>,
  Refresh: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>,
  Bag: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
};

const PIECES = [
  { id: 1, cat: "rings", name: "Аврора", tone: "champagne", tag: "Premium", metal: "#E8ECF1", price: 189000 },
  { id: 2, cat: "rings", name: "Сияние", tone: "accent", tag: "VVS1", metal: "#DDE2E8", price: 142000 },
  { id: 3, cat: "rings", name: "Льдинка", tone: "neutral", tag: "VS2", metal: "#E8ECF1", price: 94500 },
  { id: 4, cat: "earrings", name: "Капли", tone: "accent", tag: "Пара", metal: "#E8C66A", price: 168000 },
  { id: 5, cat: "earrings", name: "Иней", tone: "neutral", tag: "Пусеты", metal: "#DDE2E8", price: 78000 },
  { id: 6, cat: "pendants", name: "Север", tone: "champagne", tag: "Цепь 750", metal: "#E7C3B0", price: 121000 },
];

const HOW = [
  { icon: "Gem", t: "Огранка", d: "Шесть форм бриллианта — от классики до авторских." },
  { icon: "Sliders", t: "Камень", d: "Вес и чистота под ваш бюджет, без переплат." },
  { icon: "Sparkle", t: "Металл", d: "Белое, жёлтое, розовое золото или платина." },
  { icon: "Pen", t: "Гравировка", d: "Личная надпись внутри — бесплатно к любой сборке." },
];

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

function Ring({ metal, size = 150 }) {
  return (
    <div className="wb-ring" style={{ "--metal": metal, width: size, height: size }}>
      <ic.Gem />
    </div>
  );
}

function Site() {
  const [cat, setCat] = React.useState("rings");
  const pieces = PIECES.filter((p) => p.cat === cat);
  return (
    <div className="wb">
      <header className="wb-header">
        <img className="wb-logo" src="../../assets/logo/neo-diamond-logo-white.png" alt="Neo Diamond" />
        <nav className="wb-nav">
          <a className="is-active">Конструктор</a><a>Каталог</a><a>О студии</a><a>Журнал</a>
        </nav>
        <div className="wb-header-right">
          <IconButton label="Корзина" variant="ghost"><ic.Bag /></IconButton>
          <Button variant="primary" size="sm" iconRight={<ic.Arrow />}>Собрать</Button>
        </div>
      </header>

      <section className="wb-hero">
        <div className="wb-hero-glow" />
        <div className="wb-hero-copy">
          <span className="nd-eyebrow">Ювелирная студия-конструктор</span>
          <h1 className="wb-hero-title">Кольцо, которое говорит<br/><em>вашими словами</em></h1>
          <p className="wb-hero-sub">Соберите украшение под себя: выберите огранку бриллианта, металл и оправу. Мы изготовим его в студии и пришлём с сертификатом.</p>
          <div className="wb-hero-cta">
            <Button variant="primary" size="lg" iconRight={<ic.Arrow />}>Собрать своё</Button>
            <Button variant="secondary" size="lg">Смотреть каталог</Button>
          </div>
          <div className="wb-hero-meta">
            <span><strong>6</strong> огранок</span><i/>
            <span><strong>4</strong> металла</span><i/>
            <span><strong>GIA</strong> сертификат</span>
          </div>
        </div>
        <div className="wb-hero-art">
          <div className="wb-hero-stage">
            <Ring metal="#E8ECF1" size={230} />
            <div className="wb-hero-chip nd-glass" style={{ top: "14%", left: "-6%" }}><ic.Gem /> Круглая · 1.0 кар</div>
            <div className="wb-hero-chip nd-glass" style={{ bottom: "16%", right: "-4%" }}><ic.Sparkle /> Белое золото 750</div>
            <div className="wb-hero-price nd-glass"><span>от</span> <b>94 500 ₽</b></div>
          </div>
        </div>
      </section>

      <section className="wb-how">
        <div className="wb-how-head">
          <span className="nd-eyebrow">Конструктор за 4 шага</span>
          <h2 className="wb-h2">Собирается как конструктор — звучит как вы</h2>
        </div>
        <div className="wb-how-grid">
          {HOW.map((h, i) => {
            const Ico = ic[h.icon];
            return (
              <div className="wb-how-card nd-glass" key={h.t}>
                <span className="wb-how-num">0{i + 1}</span>
                <span className="wb-how-ic"><Ico /></span>
                <h3 className="wb-how-t">{h.t}</h3>
                <p className="wb-how-d">{h.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wb-cat">
        <div className="wb-cat-head">
          <div>
            <span className="nd-eyebrow">Витрина</span>
            <h2 className="wb-h2">Готовые сборки</h2>
          </div>
          <Tabs value={cat} onChange={setCat} tabs={[
            { value: "rings", label: "Кольца" },
            { value: "earrings", label: "Серьги" },
            { value: "pendants", label: "Подвески" },
          ]} />
        </div>
        <div className="wb-cat-grid">
          {pieces.map((p) => (
            <Card key={p.id} className="wb-piece" media={<div className="wb-piece-media"><Ring metal={p.metal} size={130} /></div>} interactive>
              <div className="wb-piece-top">
                <Badge tone={p.tone}>{p.tag}</Badge>
                <IconButton label="В избранное" variant="ghost" size="sm"><HeartIcon /></IconButton>
              </div>
              <h3 className="wb-piece-name">{p.name}</h3>
              <div className="wb-piece-foot">
                <PriceTag from value={p.price} size="sm" />
                <Button variant="secondary" size="sm" iconRight={<ic.Arrow />}>Открыть</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="wb-trust">
        {[["Shield", "Сертификат GIA", "На каждый бриллиант от 0.3 карата"],
          ["Truck", "Доставка 3–5 дней", "Бесплатно и застраховано по России"],
          ["Refresh", "Возврат 30 дней", "Передумали — вернём без вопросов"]].map(([icn, t, d]) => {
          const Ico = ic[icn];
          return (
            <div className="wb-trust-item" key={t}>
              <span className="wb-trust-ic"><Ico /></span>
              <div><div className="wb-trust-t">{t}</div><div className="wb-trust-d">{d}</div></div>
            </div>
          );
        })}
      </section>

      <section className="wb-final">
        <div className="wb-final-inner nd-glass">
          <span className="nd-eyebrow">Готовы начать?</span>
          <h2 className="wb-final-title">Соберите своё за 5 минут</h2>
          <Button variant="primary" size="lg" iconRight={<ic.Arrow />}>Открыть конструктор</Button>
        </div>
      </section>

      <footer className="wb-footer">
        <img className="wb-logo" src="../../assets/logo/neo-diamond-logo-white.png" alt="Neo Diamond" />
        <div className="wb-footer-cols">
          <div><h4>Каталог</h4><a>Кольца</a><a>Серьги</a><a>Подвески</a></div>
          <div><h4>Студия</h4><a>О нас</a><a>Мастерская</a><a>Контакты</a></div>
          <div><h4>Помощь</h4><a>Размер кольца</a><a>Доставка</a><a>Возврат</a></div>
        </div>
        <span className="wb-copy">© 2026 Neo Diamond</span>
      </footer>
    </div>
  );
}

function HeartIcon(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>;
}

window.NDSiteMount = function () {
  const NS = window.NeoDiamondDesignSystem_7b0c33;
  ({ Button, IconButton, Badge, Tag, Avatar, Tabs, Card, PriceTag } = NS);
  ReactDOM.createRoot(document.getElementById("root")).render(<Site />);
};
