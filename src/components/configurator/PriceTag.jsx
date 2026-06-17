import React from "react";

const CSS = `
.nd-price{ display:inline-flex; align-items:baseline; gap:8px; font-family:var(--font-sans); white-space:nowrap; }
.nd-price__from{ font-size:var(--text-xs); color:var(--text-tertiary); font-weight:var(--fw-medium); }
.nd-price__value{ font-weight:var(--fw-bold); color:var(--text-primary); letter-spacing:-0.01em; line-height:1; }
.nd-price__old{ font-size:var(--text-sm); color:var(--text-tertiary); text-decoration:line-through; }
.nd-price--sm .nd-price__value{ font-size:var(--text-lg); }
.nd-price--md .nd-price__value{ font-size:var(--text-2xl); }
.nd-price--lg .nd-price__value{ font-size:var(--text-4xl); font-family:var(--font-display); font-weight:var(--fw-regular); letter-spacing:0; }
.nd-price--accent .nd-price__value{ color:var(--accent); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

function format(value, currency, locale) {
  if (typeof value !== "number") return value;
  const n = new Intl.NumberFormat(locale).format(value);
  return currency === "before" ? `$${n}` : `${n} ${currency}`;
}

/** Formatted price display. */
export function PriceTag({
  value,
  oldValue,
  currency = "₽",
  locale = "ru-RU",
  from = false,
  size = "md",
  accent = false,
  className = "",
  ...rest
}) {
  useInjectedCss("nd-price-css", CSS);
  return (
    <span className={["nd-price", `nd-price--${size}`, accent ? "nd-price--accent" : "", className].filter(Boolean).join(" ")} {...rest}>
      {from ? <span className="nd-price__from">от</span> : null}
      <span className="nd-price__value">{format(value, currency, locale)}</span>
      {oldValue != null ? <span className="nd-price__old">{format(oldValue, currency, locale)}</span> : null}
    </span>
  );
}
