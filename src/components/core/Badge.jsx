import React from "react";

const CSS = `
.nd-badge{
  display:inline-flex; align-items:center; gap:5px;
  height:22px; padding:0 9px;
  font-family:var(--font-sans); font-weight:var(--fw-semibold);
  font-size:var(--text-2xs); letter-spacing:.03em; line-height:1;
  border-radius:var(--radius-pill); border:1px solid transparent; white-space:nowrap;
}
.nd-badge--dot::before{ content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.nd-badge--neutral{ background:var(--glass-fill-strong); color:var(--text-secondary); border-color:var(--glass-border); }
.nd-badge--accent{ background:var(--accent-soft); color:var(--ice-300); border-color:rgba(70,177,224,.4); }
.nd-badge--success{ background:var(--success-bg); color:var(--success-500); }
.nd-badge--warning{ background:var(--warning-bg); color:var(--warning-500); }
.nd-badge--danger{ background:var(--danger-bg); color:var(--danger-500); }
.nd-badge--champagne{ background:rgba(216,189,132,.16); color:var(--champagne-400); border-color:rgba(216,189,132,.4); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Small status / category label. */
export function Badge({ tone = "neutral", dot = false, className = "", children, ...rest }) {
  useInjectedCss("nd-badge-css", CSS);
  const cls = ["nd-badge", `nd-badge--${tone}`, dot ? "nd-badge--dot" : "", className]
    .filter(Boolean).join(" ");
  return <span className={cls} {...rest}>{children}</span>;
}
