import React from "react";

const CSS = `
.nd-field{ display:flex; flex-direction:column; gap:7px; }
.nd-field__label{ font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm); color:var(--text-secondary); }
.nd-input-wrap{ position:relative; display:flex; align-items:center; }
.nd-input{
  appearance:none; -webkit-appearance:none;
  width:100%; height:var(--control-height-md); box-sizing:border-box;
  padding:0 16px; font-family:var(--font-sans); font-size:var(--text-md);
  color:var(--text-primary); background:var(--glass-fill); border:1px solid var(--glass-border);
  border-radius:var(--radius-md); outline:none;
  transition:var(--transition-control);
}
.nd-input::placeholder{ color:var(--text-tertiary); }
.nd-input:hover{ border-color:var(--glass-border-strong); }
.nd-input:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:var(--surface-1); }
.nd-input--has-left{ padding-left:42px; }
.nd-input--has-right{ padding-right:42px; }
.nd-input--invalid{ border-color:var(--danger-500); }
.nd-input--invalid:focus{ box-shadow:0 0 0 3px var(--danger-bg); }
.nd-input:disabled{ opacity:.5; cursor:not-allowed; }
.nd-input__icon{ position:absolute; display:inline-flex; color:var(--text-tertiary); pointer-events:none; }
.nd-input__icon svg{ width:18px; height:18px; }
.nd-input__icon--left{ left:14px; }
.nd-input__icon--right{ right:14px; }
.nd-field__hint{ font-size:var(--text-xs); color:var(--text-tertiary); }
.nd-field__hint--error{ color:var(--danger-500); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Text input with label, icons, and validation. */
export function Input({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  id,
  className = "",
  ...rest
}) {
  useInjectedCss("nd-input-css", CSS);
  const autoId = React.useId();
  const fieldId = id || autoId;
  const invalid = Boolean(error);
  const inputCls = [
    "nd-input",
    iconLeft ? "nd-input--has-left" : "",
    iconRight ? "nd-input--has-right" : "",
    invalid ? "nd-input--invalid" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={["nd-field", className].filter(Boolean).join(" ")}>
      {label ? <label className="nd-field__label" htmlFor={fieldId}>{label}</label> : null}
      <div className="nd-input-wrap">
        {iconLeft ? <span className="nd-input__icon nd-input__icon--left">{iconLeft}</span> : null}
        <input id={fieldId} className={inputCls} aria-invalid={invalid} {...rest} />
        {iconRight ? <span className="nd-input__icon nd-input__icon--right">{iconRight}</span> : null}
      </div>
      {error ? <span className="nd-field__hint nd-field__hint--error">{error}</span>
        : hint ? <span className="nd-field__hint">{hint}</span> : null}
    </div>
  );
}
