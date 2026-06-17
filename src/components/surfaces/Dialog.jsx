import React from "react";

const CSS = `
.nd-dialog__scrim{
  position:fixed; inset:0; z-index:var(--z-modal);
  background:rgba(6,13,29,.62);
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; padding:24px;
  animation:nd-fade var(--dur-base) var(--ease-out);
}
.nd-dialog{
  width:100%; max-width:var(--dialog-w,480px); max-height:90vh; overflow:auto;
  background:var(--surface-solid); border:1px solid var(--glass-border-strong);
  border-radius:var(--radius-2xl); box-shadow:var(--shadow-xl), var(--inset-top-light);
  animation:nd-pop var(--dur-slow) var(--ease-out);
}
.nd-dialog__head{ display:flex; align-items:flex-start; gap:16px; padding:24px 24px 0; }
.nd-dialog__titles{ flex:1; display:flex; flex-direction:column; gap:4px; }
.nd-dialog__title{ font-family:var(--font-display); font-weight:var(--fw-regular); font-size:var(--text-2xl); line-height:1.1; }
.nd-dialog__desc{ font-size:var(--text-sm); color:var(--text-secondary); }
.nd-dialog__close{
  appearance:none; -webkit-appearance:none;
  flex:none; width:34px; height:34px; border-radius:50%; border:0; cursor:pointer;
  background:var(--glass-fill-strong); color:var(--text-secondary);
  display:inline-flex; align-items:center; justify-content:center;
}
.nd-dialog__close:hover{ color:var(--text-primary); background:var(--surface-2); }
.nd-dialog__close svg{ width:17px; height:17px; }
.nd-dialog__body{ padding:18px 24px; color:var(--text-secondary); font-size:var(--text-md); line-height:1.6; }
.nd-dialog__footer{ display:flex; justify-content:flex-end; gap:10px; padding:6px 24px 24px; }
@keyframes nd-fade{ from{opacity:0} to{opacity:1} }
@keyframes nd-pop{ from{opacity:0; transform:translateY(12px) scale(.98)} to{opacity:1; transform:none} }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

const X = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);

/** Centered modal dialog over a blurred scrim. */
export function Dialog({ open = true, onClose, title, description, footer, width, className = "", children }) {
  useInjectedCss("nd-dialog-css", CSS);
  if (!open) return null;
  return (
    <div className="nd-dialog__scrim" onClick={onClose}>
      <div
        className={["nd-dialog", className].filter(Boolean).join(" ")}
        style={width ? { "--dialog-w": typeof width === "number" ? `${width}px` : width } : undefined}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description || onClose) && (
          <div className="nd-dialog__head">
            <div className="nd-dialog__titles">
              {title ? <div className="nd-dialog__title">{title}</div> : null}
              {description ? <div className="nd-dialog__desc">{description}</div> : null}
            </div>
            {onClose ? <button className="nd-dialog__close" aria-label="Закрыть" onClick={onClose}><X /></button> : null}
          </div>
        )}
        {children != null ? <div className="nd-dialog__body">{children}</div> : null}
        {footer ? <div className="nd-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
