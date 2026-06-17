import React from "react";

const CSS = `
.nd-tag{
  appearance:none; -webkit-appearance:none;
  display:inline-flex; align-items:center; gap:7px;
  height:34px; padding:0 14px;
  font-family:var(--font-sans); font-weight:var(--fw-medium); font-size:var(--text-sm);
  line-height:1; color:var(--text-primary); cursor:pointer; white-space:nowrap;
  background:var(--glass-fill); border:1px solid var(--glass-border);
  border-radius:var(--radius-pill);
  transition:var(--transition-control);
}
.nd-tag:hover{ background:var(--glass-fill-strong); border-color:var(--glass-border-strong); }
.nd-tag[aria-pressed="true"], .nd-tag--selected{
  background:var(--accent-soft); border-color:var(--accent); color:var(--ice-200);
}
.nd-tag--static{ cursor:default; }
.nd-tag__remove{
  display:inline-flex; align-items:center; justify-content:center;
  width:16px; height:16px; margin-right:-4px; border-radius:50%;
  color:var(--text-tertiary); background:transparent; border:0; cursor:pointer;
}
.nd-tag__remove:hover{ color:var(--text-primary); background:var(--glass-border); }
.nd-tag__remove svg{ width:12px; height:12px; }
.nd-tag__icon{ display:inline-flex; }
.nd-tag__icon svg{ width:15px; height:15px; }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Selectable chip / filter pill. */
export function Tag({
  selected = false,
  icon,
  onRemove,
  interactive = true,
  className = "",
  children,
  ...rest
}) {
  useInjectedCss("nd-tag-css", CSS);
  const cls = [
    "nd-tag",
    selected ? "nd-tag--selected" : "",
    !interactive ? "nd-tag--static" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button
      className={cls}
      aria-pressed={interactive ? selected : undefined}
      {...rest}
    >
      {icon ? <span className="nd-tag__icon">{icon}</span> : null}
      {children}
      {onRemove ? (
        <span
          className="nd-tag__remove"
          role="button"
          aria-label="Remove"
          onClick={(e) => { e.stopPropagation(); onRemove(e); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </span>
      ) : null}
    </button>
  );
}
