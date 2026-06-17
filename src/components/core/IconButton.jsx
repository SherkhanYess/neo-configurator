import React from "react";

const CSS = `
.nd-iconbtn{
  appearance:none; -webkit-appearance:none;
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--control-height-md); height:var(--control-height-md);
  border-radius:var(--radius-circle); border:1px solid transparent;
  cursor:pointer; color:var(--text-primary);
  transition:var(--transition-control);
}
.nd-iconbtn svg{ width:20px; height:20px; }
.nd-iconbtn--sm{ width:var(--control-height-sm); height:var(--control-height-sm); }
.nd-iconbtn--sm svg{ width:17px; height:17px; }
.nd-iconbtn--lg{ width:var(--control-height-lg); height:var(--control-height-lg); }
.nd-iconbtn:focus-visible{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.nd-iconbtn:disabled{ opacity:.42; cursor:not-allowed; }

.nd-iconbtn--glass{ background:var(--glass-fill); border-color:var(--glass-border); backdrop-filter:blur(var(--blur-md)); -webkit-backdrop-filter:blur(var(--blur-md)); }
.nd-iconbtn--glass:hover{ background:var(--glass-fill-strong); border-color:var(--glass-border-strong); }
.nd-iconbtn--ghost{ background:transparent; }
.nd-iconbtn--ghost:hover{ background:var(--glass-fill); }
.nd-iconbtn--solid{ background:var(--accent); color:var(--text-on-accent); box-shadow:var(--glow-ice-soft); }
.nd-iconbtn--solid:hover{ background:var(--accent-hover); }
.nd-iconbtn:active{ transform:translateY(1px); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Circular icon-only control. */
export function IconButton({
  variant = "glass",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}) {
  useInjectedCss("nd-iconbtn-css", CSS);
  const cls = [
    "nd-iconbtn",
    `nd-iconbtn--${variant}`,
    size !== "md" ? `nd-iconbtn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} aria-label={label} {...rest}>
      {children}
    </button>
  );
}
