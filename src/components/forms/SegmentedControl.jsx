import React from "react";

const CSS = `
.nd-seg{
  display:inline-flex; padding:4px; gap:2px;
  background:var(--glass-fill); border:1px solid var(--glass-border);
  border-radius:var(--radius-pill); position:relative;
  backdrop-filter:blur(var(--blur-md)); -webkit-backdrop-filter:blur(var(--blur-md));
}
.nd-seg--full{ display:flex; width:100%; }
.nd-seg__item{
  appearance:none; -webkit-appearance:none;
  position:relative; z-index:1; flex:1; border:0; background:transparent; cursor:pointer;
  height:36px; padding:0 18px; border-radius:var(--radius-pill);
  font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm);
  color:var(--text-secondary); white-space:nowrap;
  transition:color var(--dur-fast) var(--ease-standard);
}
.nd-seg__item:hover{ color:var(--text-primary); }
.nd-seg__item--active{ color:var(--text-on-accent); }
.nd-seg__thumb{
  position:absolute; z-index:0; top:4px; bottom:4px; left:0;
  background:var(--accent); border-radius:var(--radius-pill);
  box-shadow:var(--glow-ice-soft);
  transition:transform var(--dur-base) var(--ease-out), width var(--dur-base) var(--ease-out);
}
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Apple-style segmented control / single-select toggle group. */
export function SegmentedControl({ options = [], value, defaultValue, onChange, fullWidth = false, className = "" }) {
  useInjectedCss("nd-seg-css", CSS);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const [internal, setInternal] = React.useState(defaultValue ?? opts[0]?.value);
  const current = value != null ? value : internal;
  const idx = Math.max(0, opts.findIndex((o) => o.value === current));
  const ref = React.useRef(null);
  const [thumb, setThumb] = React.useState({ left: 0, width: 0 });

  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelectorAll(".nd-seg__item")[idx];
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [idx, opts.length, fullWidth]);

  return (
    <div ref={ref} className={["nd-seg", fullWidth ? "nd-seg--full" : "", className].filter(Boolean).join(" ")}>
      <span className="nd-seg__thumb" style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }} />
      {opts.map((o, i) => (
        <button
          key={o.value}
          type="button"
          className={["nd-seg__item", i === idx ? "nd-seg__item--active" : ""].filter(Boolean).join(" ")}
          onClick={(e) => { if (value == null) setInternal(o.value); onChange && onChange(o.value, e); }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
