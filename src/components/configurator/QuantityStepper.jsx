import React from "react";

const CSS = `
.nd-qty{ display:inline-flex; align-items:center; gap:4px; padding:4px; background:var(--glass-fill); border:1px solid var(--glass-border); border-radius:var(--radius-pill); }
.nd-qty__btn{
  appearance:none; -webkit-appearance:none;
  width:32px; height:32px; border-radius:50%; border:0; cursor:pointer;
  background:transparent; color:var(--text-primary);
  display:inline-flex; align-items:center; justify-content:center;
  transition:var(--transition-control);
}
.nd-qty__btn:hover:not(:disabled){ background:var(--glass-fill-strong); }
.nd-qty__btn:active:not(:disabled){ transform:scale(.92); }
.nd-qty__btn:disabled{ opacity:.35; cursor:not-allowed; }
.nd-qty__btn svg{ width:16px; height:16px; }
.nd-qty__value{ min-width:28px; text-align:center; font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-md); color:var(--text-primary); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

const Minus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>;
const Plus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;

/** Compact −/+ quantity stepper. */
export function QuantityStepper({ value, defaultValue = 1, min = 1, max = 99, onChange, className = "" }) {
  useInjectedCss("nd-qty-css", CSS);
  const [internal, setInternal] = React.useState(defaultValue);
  const v = value != null ? value : internal;
  const set = (nv) => { const c = Math.min(max, Math.max(min, nv)); if (value == null) setInternal(c); onChange && onChange(c); };
  return (
    <div className={["nd-qty", className].filter(Boolean).join(" ")}>
      <button className="nd-qty__btn" aria-label="Меньше" disabled={v <= min} onClick={() => set(v - 1)}><Minus /></button>
      <span className="nd-qty__value">{v}</span>
      <button className="nd-qty__btn" aria-label="Больше" disabled={v >= max} onClick={() => set(v + 1)}><Plus /></button>
    </div>
  );
}
