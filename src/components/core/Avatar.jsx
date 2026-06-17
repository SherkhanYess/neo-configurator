import React from "react";

const CSS = `
.nd-avatar{
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:var(--radius-circle); overflow:hidden; flex:none;
  background:var(--glass-fill-strong); border:1px solid var(--glass-border);
  color:var(--text-primary); font-family:var(--font-sans); font-weight:var(--fw-semibold);
  position:relative;
}
.nd-avatar img{ width:100%; height:100%; object-fit:cover; display:block; }
.nd-avatar--xs{ width:28px; height:28px; font-size:11px; }
.nd-avatar--sm{ width:36px; height:36px; font-size:13px; }
.nd-avatar--md{ width:44px; height:44px; font-size:15px; }
.nd-avatar--lg{ width:60px; height:60px; font-size:20px; }
.nd-avatar__status{
  position:absolute; right:-1px; bottom:-1px; width:28%; height:28%;
  min-width:8px; min-height:8px; border-radius:50%;
  border:2px solid var(--navy-950); background:var(--success-500);
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

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

/** User / studio avatar with image or initials fallback. */
export function Avatar({ src, name = "", size = "md", status = false, className = "", ...rest }) {
  useInjectedCss("nd-avatar-css", CSS);
  const cls = ["nd-avatar", `nd-avatar--${size}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {src ? <img src={src} alt={name} /> : <span>{initials(name)}</span>}
      {status ? <span className="nd-avatar__status" /> : null}
    </span>
  );
}
