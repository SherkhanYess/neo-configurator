import React from "react";

const CSS = `
.nd-steps{ display:flex; align-items:flex-start; width:100%; }
.nd-steps__node{ display:flex; flex-direction:column; align-items:center; gap:8px; flex:none; width:var(--node-w,84px); text-align:center; }
.nd-steps__dot{
  width:32px; height:32px; border-radius:50%; flex:none;
  display:inline-flex; align-items:center; justify-content:center;
  font-family:var(--font-sans); font-weight:var(--fw-semibold); font-size:var(--text-sm);
  background:var(--glass-fill); border:1px solid var(--glass-border); color:var(--text-tertiary);
  transition:var(--transition-control);
}
.nd-steps__node--clickable{ cursor:pointer; }
.nd-steps__node--current .nd-steps__dot{ background:var(--accent); border-color:transparent; color:var(--text-on-accent); box-shadow:var(--glow-ice-soft); }
.nd-steps__node--done .nd-steps__dot{ background:var(--accent-soft); border-color:var(--accent); color:var(--ice-200); }
.nd-steps__dot svg{ width:15px; height:15px; }
.nd-steps__label{ font-family:var(--font-sans); font-size:var(--text-xs); color:var(--text-tertiary); line-height:1.25; }
.nd-steps__node--current .nd-steps__label{ color:var(--text-primary); font-weight:var(--fw-semibold); }
.nd-steps__node--done .nd-steps__label{ color:var(--text-secondary); }
.nd-steps__bar{ flex:1; height:2px; margin-top:15px; background:var(--border-subtle); border-radius:2px; position:relative; overflow:hidden; }
.nd-steps__bar--done::after{ content:""; position:absolute; inset:0; background:var(--accent); }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
);

/** Horizontal step indicator for the constructor flow. */
export function StepIndicator({ steps = [], current = 0, onStepClick, className = "" }) {
  useInjectedCss("nd-steps-css", CSS);
  const labels = steps.map((s) => (typeof s === "string" ? s : s.label));
  return (
    <div className={["nd-steps", className].filter(Boolean).join(" ")}>
      {labels.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <React.Fragment key={i}>
            <div
              className={["nd-steps__node", `nd-steps__node--${state}`, onStepClick ? "nd-steps__node--clickable" : ""].filter(Boolean).join(" ")}
              onClick={onStepClick ? () => onStepClick(i) : undefined}
            >
              <span className="nd-steps__dot">{state === "done" ? <Check /> : i + 1}</span>
              <span className="nd-steps__label">{label}</span>
            </div>
            {i < labels.length - 1 ? <div className={["nd-steps__bar", i < current ? "nd-steps__bar--done" : ""].filter(Boolean).join(" ")} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
