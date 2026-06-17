import React from "react";

const CSS = `
.nd-check{ display:inline-flex; align-items:flex-start; gap:10px; cursor:pointer; user-select:none; font-family:var(--font-sans); font-size:var(--text-sm); color:var(--text-primary); }
.nd-check input{ position:absolute; opacity:0; width:0; height:0; }
.nd-check__box{
  width:20px; height:20px; flex:none; margin-top:1px;
  border-radius:var(--radius-xs); background:var(--glass-fill);
  border:1px solid var(--glass-border-strong);
  display:inline-flex; align-items:center; justify-content:center;
  transition:var(--transition-control);
}
.nd-check__box svg{ width:13px; height:13px; color:var(--text-on-accent); opacity:0; transform:scale(.6); transition:opacity var(--dur-fast), transform var(--dur-fast) var(--ease-out); }
.nd-check input:checked + .nd-check__box{ background:var(--accent); border-color:transparent; }
.nd-check input:checked + .nd-check__box svg{ opacity:1; transform:scale(1); }
.nd-check input:focus-visible + .nd-check__box{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.nd-check--disabled{ opacity:.5; cursor:not-allowed; }

/* radio variant */
.nd-check--radio .nd-check__box{ border-radius:50%; }
.nd-check--radio .nd-check__dot{ width:9px; height:9px; border-radius:50%; background:var(--text-on-accent); opacity:0; transform:scale(.4); transition:opacity var(--dur-fast), transform var(--dur-fast) var(--ease-out); }
.nd-check--radio input:checked + .nd-check__box .nd-check__dot{ opacity:1; transform:scale(1); }
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

/** Checkbox or radio control with a label. */
export function Checkbox({ type = "checkbox", label, disabled, className = "", ...rest }) {
  useInjectedCss("nd-check-css", CSS);
  const isRadio = type === "radio";
  return (
    <label className={["nd-check", isRadio ? "nd-check--radio" : "", disabled ? "nd-check--disabled" : "", className].filter(Boolean).join(" ")}>
      <input type={type} disabled={disabled} {...rest} />
      <span className="nd-check__box">
        {isRadio ? <span className="nd-check__dot" /> : <Tick />}
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
