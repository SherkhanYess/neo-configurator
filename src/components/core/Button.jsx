import React from "react";

const CSS = `
.nd-btn{
  --_h: var(--control-height-md);
  appearance:none; -webkit-appearance:none;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:var(--_h); padding:0 20px;
  font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm);
  letter-spacing:.01em; line-height:1; white-space:nowrap;
  border-radius:var(--radius-pill); border:1px solid transparent;
  cursor:pointer; user-select:none; text-decoration:none;
  transition:var(--transition-control);
}
.nd-btn:disabled, .nd-btn[aria-disabled="true"]{ opacity:.42; cursor:not-allowed; pointer-events:none; }
.nd-btn:focus-visible{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.nd-btn--sm{ --_h:var(--control-height-sm); padding:0 14px; font-size:var(--text-xs); }
.nd-btn--lg{ --_h:var(--control-height-lg); padding:0 28px; font-size:var(--text-md); }
.nd-btn--full{ width:100%; }

.nd-btn--primary{ background:var(--accent); color:var(--text-on-accent); box-shadow:var(--glow-ice-soft); }
.nd-btn--primary:hover{ background:var(--accent-hover); }
.nd-btn--primary:active{ background:var(--accent-press); transform:translateY(1px); }

.nd-btn--secondary{ background:var(--glass-fill-strong); color:var(--text-primary); border-color:var(--glass-border); backdrop-filter:blur(var(--blur-md)); -webkit-backdrop-filter:blur(var(--blur-md)); }
.nd-btn--secondary:hover{ background:var(--surface-2); border-color:var(--glass-border-strong); }
.nd-btn--secondary:active{ transform:translateY(1px); }

.nd-btn--ghost{ background:transparent; color:var(--text-primary); }
.nd-btn--ghost:hover{ background:var(--glass-fill); }
.nd-btn--ghost:active{ transform:translateY(1px); }

.nd-btn--outline{ background:transparent; color:var(--accent); border-color:var(--accent); }
.nd-btn--outline:hover{ background:var(--accent-soft); }
.nd-btn--outline:active{ transform:translateY(1px); }

.nd-btn__icon{ display:inline-flex; width:1.15em; height:1.15em; }
.nd-btn__icon svg{ width:100%; height:100%; }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/**
 * Neo Diamond primary action button. Pill-shaped, glass or solid-ice.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  as = "button",
  className = "",
  children,
  ...rest
}) {
  useInjectedCss("nd-btn-css", CSS);
  const Tag = as;
  const cls = [
    "nd-btn",
    `nd-btn--${variant}`,
    size !== "md" ? `nd-btn--${size}` : "",
    fullWidth ? "nd-btn--full" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <Tag className={cls} {...rest}>
      {iconLeft ? <span className="nd-btn__icon">{iconLeft}</span> : null}
      {children}
      {iconRight ? <span className="nd-btn__icon">{iconRight}</span> : null}
    </Tag>
  );
}
