import React from "react";

const CSS = `
.nd-slider{ display:flex; flex-direction:column; gap:10px; width:100%; }
.nd-slider__head{ display:flex; justify-content:space-between; align-items:baseline; }
.nd-slider__label{ font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm); color:var(--text-secondary); }
.nd-slider__value{ font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm); color:var(--text-primary); }
.nd-slider__input{
  -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:var(--radius-pill);
  background:var(--track, var(--glass-fill-strong)); outline:none; cursor:pointer;
}
.nd-slider__input::-webkit-slider-thumb{
  -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%;
  background:var(--white); border:2px solid var(--accent);
  box-shadow:var(--shadow-sm), var(--glow-ice-soft); cursor:grab; transition:transform var(--dur-fast) var(--ease-out);
}
.nd-slider__input::-webkit-slider-thumb:active{ transform:scale(1.12); cursor:grabbing; }
.nd-slider__input::-moz-range-thumb{
  width:22px; height:22px; border-radius:50%; background:var(--white);
  border:2px solid var(--accent); box-shadow:var(--shadow-sm); cursor:grab;
}
.nd-slider__input:focus-visible{ outline:2px solid var(--focus-ring); outline-offset:6px; }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Range slider with a filled ice track. */
export function Slider({
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue,
  className = "",
  ...rest
}) {
  useInjectedCss("nd-slider-css", CSS);
  const [internal, setInternal] = React.useState(defaultValue ?? min);
  const v = value != null ? value : internal;
  const pct = ((v - min) / (max - min)) * 100;
  const track = `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${pct}%, var(--glass-fill-strong) ${pct}%, var(--glass-fill-strong) 100%)`;
  const display = formatValue ? formatValue(v) : v;
  return (
    <div className={["nd-slider", className].filter(Boolean).join(" ")}>
      {(label || display != null) && (
        <div className="nd-slider__head">
          {label ? <span className="nd-slider__label">{label}</span> : <span />}
          <span className="nd-slider__value">{display}</span>
        </div>
      )}
      <input
        type="range"
        className="nd-slider__input"
        style={{ "--track": track }}
        min={min} max={max} step={step} value={v}
        onChange={(e) => { const nv = Number(e.target.value); if (value == null) setInternal(nv); onChange && onChange(nv, e); }}
        {...rest}
      />
    </div>
  );
}
