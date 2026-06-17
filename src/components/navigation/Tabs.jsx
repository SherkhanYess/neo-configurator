import React from "react";

const CSS = `
.nd-tabs{ display:flex; gap:4px; position:relative; border-bottom:1px solid var(--border-subtle); }
.nd-tabs__item{
  appearance:none; -webkit-appearance:none;
  position:relative; border:0; background:transparent; cursor:pointer;
  padding:12px 4px; margin:0 12px; font-family:var(--font-sans);
  font-weight:var(--fw-semibold); font-size:var(--text-md); color:var(--text-tertiary);
  transition:color var(--dur-fast) var(--ease-standard);
}
.nd-tabs__item:first-child{ margin-left:0; }
.nd-tabs__item:hover{ color:var(--text-secondary); }
.nd-tabs__item--active{ color:var(--text-primary); }
.nd-tabs__item--active::after{
  content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--accent); border-radius:var(--radius-pill);
}
.nd-tabs__count{ margin-left:7px; font-size:var(--text-xs); color:var(--text-tertiary); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Underline tab bar. */
export function Tabs({ tabs = [], value, defaultValue, onChange, className = "" }) {
  useInjectedCss("nd-tabs-css", CSS);
  const items = tabs.map((t) => (typeof t === "string" ? { value: t, label: t } : t));
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const current = value != null ? value : internal;
  return (
    <div className={["nd-tabs", className].filter(Boolean).join(" ")} role="tablist">
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={t.value === current}
          className={["nd-tabs__item", t.value === current ? "nd-tabs__item--active" : ""].filter(Boolean).join(" ")}
          onClick={(e) => { if (value == null) setInternal(t.value); onChange && onChange(t.value, e); }}
        >
          {t.label}
          {t.count != null ? <span className="nd-tabs__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
