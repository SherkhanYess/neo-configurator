import React from "react";

const CSS = `
.nd-card{
  position:relative; display:flex; flex-direction:column;
  background:var(--glass-fill); border:1px solid var(--glass-border);
  border-radius:var(--radius-xl); overflow:hidden;
  backdrop-filter:blur(var(--blur-md)) saturate(140%); -webkit-backdrop-filter:blur(var(--blur-md)) saturate(140%);
  box-shadow:var(--shadow-md), var(--inset-top-light);
}
.nd-card--solid{ background:var(--surface-solid); backdrop-filter:none; -webkit-backdrop-filter:none; }
.nd-card--flat{ box-shadow:var(--inset-hairline); }
.nd-card--interactive{ cursor:pointer; transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base); }
.nd-card--interactive:hover{ transform:translateY(-3px); box-shadow:var(--shadow-lg), var(--inset-top-light); border-color:var(--glass-border-strong); }
.nd-card--selected{ border-color:var(--accent); box-shadow:var(--glow-ice); }
.nd-card__media{ position:relative; width:100%; aspect-ratio:var(--media-ratio,4/3); overflow:hidden; background:var(--navy-850); }
.nd-card__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.nd-card__body{ padding:var(--card-pad, 22px); display:flex; flex-direction:column; gap:8px; }
.nd-card--pad-sm .nd-card__body{ --card-pad:16px; }
.nd-card--pad-lg .nd-card__body{ --card-pad:28px; }
`;

function useInjectedCss(id, css) {
  (React.useInsertionEffect || React.useLayoutEffect || React.useEffect)(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}

/** Glass surface container with optional media. */
export function Card({
  variant = "glass",
  padding = "md",
  interactive = false,
  selected = false,
  media,
  mediaRatio,
  className = "",
  children,
  bodyProps,
  ...rest
}) {
  useInjectedCss("nd-card-css", CSS);
  const cls = [
    "nd-card",
    variant !== "glass" ? `nd-card--${variant}` : "",
    padding !== "md" ? `nd-card--pad-${padding}` : "",
    interactive ? "nd-card--interactive" : "",
    selected ? "nd-card--selected" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {media ? (
        <div className="nd-card__media" style={mediaRatio ? { "--media-ratio": mediaRatio } : undefined}>{media}</div>
      ) : null}
      {children != null ? <div className="nd-card__body" {...bodyProps}>{children}</div> : null}
    </div>
  );
}
