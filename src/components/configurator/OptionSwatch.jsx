import React from "react";

const CSS = `
.nd-swatch{
  appearance:none; -webkit-appearance:none;
  position:relative; display:flex; flex-direction:column; align-items:center; gap:10px;
  width:100%; padding:16px 12px 14px; cursor:pointer; text-align:center;
  background:var(--glass-fill); border:1px solid var(--glass-border);
  border-radius:var(--radius-lg); transition:var(--transition-control);
}
.nd-swatch:hover{ background:var(--glass-fill-strong); border-color:var(--glass-border-strong); transform:translateY(-2px); }
.nd-swatch--selected{ border-color:var(--accent); box-shadow:var(--glow-ice); background:var(--accent-soft); }
.nd-swatch__visual{
  width:var(--visual,52px); height:var(--visual,52px); border-radius:var(--visual-radius,50%);
  display:inline-flex; align-items:center; justify-content:center; flex:none;
  background:var(--glass-fill-strong); color:var(--text-primary); overflow:hidden;
  box-shadow:var(--inset-hairline);
}
.nd-swatch__visual img{ width:100%; height:100%; object-fit:cover; }
.nd-swatch__visual svg{ width:26px; height:26px; }
.nd-swatch__label{ font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm); color:var(--text-primary); line-height:1.2; }
.nd-swatch__sub{ font-family:var(--font-sans); font-size:var(--text-xs); color:var(--text-tertiary); margin-top:-4px; }
.nd-swatch__price{ font-family:var(--font-sans); font-size:var(--text-xs); color:var(--text-secondary); }
.nd-swatch__tick{
  position:absolute; top:8px; right:8px; width:18px; height:18px; border-radius:50%;
  background:var(--accent); color:var(--text-on-accent);
  display:none; align-items:center; justify-content:center;
}
.nd-swatch--selected .nd-swatch__tick{ display:inline-flex; }
.nd-swatch__tick svg{ width:11px; height:11px; }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
);

/** Selectable option tile for the constructor — cut, metal, stone, setting. */
export function OptionSwatch({
  label,
  sublabel,
  price,
  color,
  image,
  icon,
  shape = "circle",
  selected = false,
  className = "",
  ...rest
}) {
  useInjectedCss("nd-swatch-css", CSS);
  const visualStyle = {};
  if (color) visualStyle.background = color;
  if (shape === "rounded") visualStyle["--visual-radius"] = "12px";
  return (
    <button
      type="button"
      className={["nd-swatch", selected ? "nd-swatch--selected" : "", className].filter(Boolean).join(" ")}
      aria-pressed={selected}
      {...rest}
    >
      <span className="nd-swatch__tick"><Tick /></span>
      <span className="nd-swatch__visual" style={visualStyle}>
        {image ? <img src={image} alt="" /> : icon ? icon : null}
      </span>
      <span className="nd-swatch__label">{label}</span>
      {sublabel ? <span className="nd-swatch__sub">{sublabel}</span> : null}
      {price ? <span className="nd-swatch__price">{price}</span> : null}
    </button>
  );
}
