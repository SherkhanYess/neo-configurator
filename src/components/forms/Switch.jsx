import React from "react";

const CSS = `
.nd-switch{ display:inline-flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
.nd-switch__track{
  position:relative; width:46px; height:28px; flex:none;
  background:var(--glass-fill-strong); border:1px solid var(--glass-border);
  border-radius:var(--radius-pill); transition:var(--transition-control);
}
.nd-switch__thumb{
  position:absolute; top:2px; left:2px; width:22px; height:22px;
  border-radius:50%; background:var(--text-primary);
  box-shadow:var(--shadow-sm); transition:transform var(--dur-base) var(--ease-out), background var(--dur-fast);
}
.nd-switch input{ position:absolute; opacity:0; width:0; height:0; }
.nd-switch input:checked + .nd-switch__track{ background:var(--accent); border-color:transparent; }
.nd-switch input:checked + .nd-switch__track .nd-switch__thumb{ transform:translateX(18px); background:var(--text-on-accent); }
.nd-switch input:focus-visible + .nd-switch__track{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.nd-switch--disabled{ opacity:.5; cursor:not-allowed; }
.nd-switch__label{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--text-primary); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** On/off toggle switch. */
export function Switch({ checked, defaultChecked, onChange, label, disabled, className = "", ...rest }) {
  useInjectedCss("nd-switch-css", CSS);
  return (
    <label className={["nd-switch", disabled ? "nd-switch--disabled" : "", className].filter(Boolean).join(" ")}>
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="nd-switch__track"><span className="nd-switch__thumb" /></span>
      {label ? <span className="nd-switch__label">{label}</span> : null}
    </label>
  );
}
