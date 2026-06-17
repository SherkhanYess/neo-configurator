/* Neo Diamond — Constructor (configurator) screen. Interactive. */
let Button, IconButton, Badge, Tag, Avatar, Slider, Input, Switch, StepIndicator, OptionSwatch, PriceTag;
const I = window.NDIcons;

const STEPS = ["Огранка", "Камень", "Металл", "Оправа", "Гравировка"];

const CUTS = [
  { id: "round", label: "Круглая", d: 0 },
  { id: "princess", label: "Принцесса", d: 4000 },
  { id: "oval", label: "Овал", d: 6000 },
  { id: "emerald", label: "Изумруд", d: 9000 },
  { id: "pear", label: "Груша", d: 7000 },
  { id: "cushion", label: "Кушон", d: 5000 },
];
const CLARITY = [
  { id: "vs2", label: "VS2", d: 0 },
  { id: "vs1", label: "VS1", d: 12000 },
  { id: "vvs2", label: "VVS2", d: 26000 },
  { id: "vvs1", label: "VVS1", d: 41000 },
];
const METALS = [
  { id: "wg", label: "Белое", sub: "750", color: "#E8ECF1", d: 0 },
  { id: "yg", label: "Жёлтое", sub: "585", color: "#E8C66A", d: 0 },
  { id: "rg", label: "Розовое", sub: "585", color: "#E7C3B0", d: 8000 },
  { id: "pt", label: "Платина", sub: "950", color: "#DDE2E8", d: 24000 },
];
const SETTINGS = [
  { id: "solitaire", label: "Солитер", note: "Классика на 4–6 крапанах", d: 0 },
  { id: "pave", label: "Паве", note: "Дорожка из камней по шинке", d: 18000 },
  { id: "halo", label: "Halo", note: "Ореол мелких бриллиантов", d: 28000 },
];

const BASE = 84500;
const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

function App() {
  const [step, setStep] = React.useState(0);
  const [cut, setCut] = React.useState("round");
  const [carat, setCarat] = React.useState(1.0);
  const [clarity, setClarity] = React.useState("vs1");
  const [metal, setMetal] = React.useState("wg");
  const [setting, setSetting] = React.useState("solitaire");
  const [engraving, setEngraving] = React.useState("");
  const [giftReady, setGiftReady] = React.useState(true);
  const [angle, setAngle] = React.useState(0);
  const [liked, setLiked] = React.useState(false);

  const cutObj = CUTS.find((c) => c.id === cut);
  const clObj = CLARITY.find((c) => c.id === clarity);
  const metalObj = METALS.find((m) => m.id === metal);
  const setObj = SETTINGS.find((s) => s.id === setting);

  const caratPrice = Math.pow(carat, 1.7) * 78000;
  const total = BASE + caratPrice + cutObj.d + clObj.d + metalObj.d + setObj.d + (engraving ? 3500 : 0);

  const go = (d) => setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d)));

  const spec = [
    ["Огранка", cutObj.label],
    ["Вес", carat.toFixed(2) + " кар"],
    ["Чистота", clObj.label],
    ["Металл", metalObj.label + " " + metalObj.sub],
    ["Оправа", setObj.label],
    engraving ? ["Гравировка", "«" + engraving + "»"] : null,
  ].filter(Boolean);

  return (
    <div className="cx">
      <Header liked={liked} setLiked={setLiked} />
      <div className="cx-body">
        <Stage cutObj={cutObj} metalObj={metalObj} angle={angle} setAngle={setAngle} liked={liked} setLiked={setLiked} />
        <aside className="cx-panel nd-glass">
          <div className="cx-panel-scroll">
            <StepIndicator steps={STEPS} current={step} onStepClick={setStep} />
            <div className="cx-step">
              <div className="cx-step-head">
                <span className="nd-eyebrow">Шаг {step + 1} из {STEPS.length}</span>
                <h2 className="cx-step-title">{STEP_TITLE[step]}</h2>
                <p className="cx-step-sub">{STEP_SUB[step]}</p>
              </div>
              {step === 0 && (
                <div className="cx-grid4">
                  {CUTS.map((c) => (
                    <OptionSwatch key={c.id} label={c.label} icon={<I.Gem />} selected={cut === c.id}
                      price={c.d ? "+" + fmt(c.d) : null} onClick={() => setCut(c.id)} />
                  ))}
                </div>
              )}
              {step === 1 && (
                <div className="cx-stack">
                  <Slider label="Вес камня" min={0.3} max={3} step={0.05} value={carat}
                    onChange={setCarat} formatValue={(v) => v.toFixed(2) + " кар"} />
                  <div>
                    <div className="cx-label">Чистота</div>
                    <div className="cx-chips">
                      {CLARITY.map((c) => (
                        <Tag key={c.id} selected={clarity === c.id} onClick={() => setClarity(c.id)}>{c.label}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="cx-grid4">
                  {METALS.map((m) => (
                    <OptionSwatch key={m.id} label={m.label} sublabel={m.sub} color={m.color} selected={metal === m.id}
                      price={m.d ? "+" + fmt(m.d) : null} onClick={() => setMetal(m.id)} />
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="cx-settings">
                  {SETTINGS.map((s) => (
                    <button key={s.id} className={"cx-setting" + (setting === s.id ? " is-sel" : "")} onClick={() => setSetting(s.id)}>
                      <span className="cx-setting-tick">{setting === s.id ? <I.Check /> : null}</span>
                      <span className="cx-setting-name">{s.label}</span>
                      <span className="cx-setting-note">{s.note}</span>
                      <span className="cx-setting-price">{s.d ? "+" + fmt(s.d) : "включено"}</span>
                    </button>
                  ))}
                </div>
              )}
              {step === 4 && (
                <div className="cx-stack">
                  <Input label="Гравировка внутри кольца" maxLength={20}
                    placeholder="Дата, имя или фраза" value={engraving}
                    onChange={(e) => setEngraving(e.target.value)}
                    hint={engraving ? "+3 500 ₽ · " + (20 - engraving.length) + " символов осталось" : "До 20 символов · +3 500 ₽"} />
                  <Switch label="Подарочная упаковка и сертификат" checked={giftReady}
                    onChange={(e) => setGiftReady(e.target.checked)} />
                </div>
              )}
            </div>

            <div className="cx-spec">
              <div className="cx-spec-title">Ваша сборка</div>
              {spec.map(([k, v]) => (
                <div className="cx-spec-row" key={k}><span>{k}</span><span>{v}</span></div>
              ))}
            </div>

            <div className="cx-assure">
              <span><I.Shield /> Сертификат GIA</span>
              <span><I.Truck /> Доставка 3–5 дней</span>
            </div>
          </div>

          <div className="cx-footer">
            <div className="cx-total">
              <span className="cx-total-label">Итого</span>
              <PriceTag value={total} size="lg" accent />
            </div>
            <div className="cx-actions">
              {step > 0 && <Button variant="ghost" iconLeft={<I.Back />} onClick={() => go(-1)}>Назад</Button>}
              {step < STEPS.length - 1
                ? <Button variant="primary" iconRight={<I.Arrow />} onClick={() => go(1)}>Далее</Button>
                : <Button variant="primary" iconRight={<I.Bag />}>В корзину</Button>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const STEP_TITLE = ["Выберите огранку", "Подберите камень", "Выберите металл", "Выберите оправу", "Добавьте гравировку"];
const STEP_SUB = [
  "Форма определяет характер кольца. Все огранки — природные бриллианты с сертификатом.",
  "Вес и чистота влияют на игру света и на стоимость.",
  "Цвет и проба металла. Подбираем под оттенок камня.",
  "Способ закрепки. От лаконичного солитера до сияющего ореола.",
  "Сделайте кольцо личным — короткая надпись внутри шинки.",
];

function Header({ liked, setLiked }) {
  return (
    <header className="cx-header">
      <img className="cx-logo" src="../../assets/logo/neo-diamond-logo-white.png" alt="Neo Diamond" />
      <nav className="cx-nav">
        <a className="is-active">Конструктор</a>
        <a>Каталог</a>
        <a>О студии</a>
        <a>Доставка</a>
      </nav>
      <div className="cx-header-right">
        <IconButton label="Избранное" variant="ghost" onClick={() => setLiked(!liked)}>
          <I.Heart style={liked ? { fill: "var(--accent)", stroke: "var(--accent)" } : null} />
        </IconButton>
        <IconButton label="Корзина" variant="ghost"><I.Bag /></IconButton>
        <Avatar name="Анна Кей" size="sm" />
      </div>
    </header>
  );
}

function Stage({ cutObj, metalObj, angle, setAngle, liked, setLiked }) {
  return (
    <section className="cx-stage">
      <div className="cx-stage-glow" />
      <div className="cx-stage-top">
        <Badge tone="champagne">Авторская сборка</Badge>
        <IconButton label="Сохранить" variant="glass" onClick={() => setLiked(!liked)}>
          <I.Heart style={liked ? { fill: "var(--accent)", stroke: "var(--accent)" } : null} />
        </IconButton>
      </div>
      <div className="cx-render">
        <div className="cx-render-ring" style={{ "--metal": metalObj.color }}>
          <I.Gem />
        </div>
        <div className="cx-render-cap">Предпросмотр · {cutObj.label.toLowerCase()} · {metalObj.label.toLowerCase()} золото</div>
      </div>
      <div className="cx-angles">
        {[0, 1, 2, 3].map((i) => (
          <button key={i} className={"cx-angle" + (angle === i ? " is-sel" : "")} onClick={() => setAngle(i)}>
            <I.Gem />
          </button>
        ))}
        <button className="cx-angle cx-angle-360" onClick={() => setAngle((angle + 1) % 4)}><I.Rotate /></button>
      </div>
    </section>
  );
}

window.NDConstructorMount = function () {
  const NS = window.NeoDiamondDesignSystem_7b0c33;
  ({ Button, IconButton, Badge, Tag, Avatar, Slider, Input, Switch, StepIndicator, OptionSwatch, PriceTag } = NS);
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
};
