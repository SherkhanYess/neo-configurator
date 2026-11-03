/* eslint-disable react-refresh/only-export-components -- мелкие хуки живут рядом с деталями, которым они нужны */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Общие детали админки: кнопки, переключатели, поля, панель сохранения,
// уведомления. Внешний вид — в studio.css.

export function Button({ variant = 'primary', size, busy, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`st-btn st-btn--${variant}${size ? ` st-btn--${size}` : ''}${busy ? ' is-busy' : ''} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`st-toggle${on ? ' is-on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="st-toggle__knob" />
    </button>
  );
}

export function Field({ label, hint, counter, children }) {
  return (
    <label className="st-field">
      <span className="st-field__top">
        <span className="st-field__label">{label}</span>
        {counter}
      </span>
      {children}
      {hint && <span className="st-field__hint">{hint}</span>}
    </label>
  );
}

/** Счётчик знаков: зелёный в норме, янтарный ближе к пределу, красный сверх. */
export function Counter({ value, soft, hard }) {
  const n = [...(value ?? '')].length;
  const state = n > hard ? 'over' : n > soft ? 'near' : 'ok';
  return <span className={`st-counter is-${state}`}>{n} / {soft}</span>;
}

export function Card({ title, aside, children, className = '' }) {
  return (
    <section className={`st-card ${className}`}>
      {(title || aside) && (
        <header className="st-card__head">
          {title && <h2 className="st-card__title">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, sub, actions }) {
  return (
    <header className="st-page-head">
      <div>
        <h1 className="st-h1">{title}</h1>
        {sub && <p className="st-sub">{sub}</p>}
      </div>
      {actions && <div className="st-page-head__actions">{actions}</div>}
    </header>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="st-empty">
      <p className="st-empty__t">{title}</p>
      {children && <p className="st-empty__p">{children}</p>}
    </div>
  );
}

export function Loading({ label = 'Загружаем…' }) {
  return <div className="st-loading"><span className="st-spinner" />{label}</div>;
}

export function ErrorNote({ children }) {
  return children ? <div className="st-error" role="alert">{children}</div> : null;
}

/**
 * Панель внизу экрана, пока есть несохранённые правки. Закрыть вкладку с
 * правками — браузер переспросит.
 */
export function SaveBar({ dirty, saving, onSave, onReset, note }) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <div className={`st-savebar${dirty ? ' is-shown' : ''}`} aria-hidden={!dirty}>
      <span className="st-savebar__note">{note ?? 'Есть несохранённые изменения'}</span>
      <div className="st-savebar__actions">
        <Button variant="ghost" onClick={onReset} disabled={saving} tabIndex={dirty ? 0 : -1}>Отменить</Button>
        <Button onClick={onSave} busy={saving} tabIndex={dirty ? 0 : -1}>{saving ? 'Сохраняем…' : 'Сохранить'}</Button>
      </div>
    </div>
  );
}

// ─── Уведомления ─────────────────────────────────────────────────────────────

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);
  const push = useCallback((text, kind = 'ok') => {
    const id = ++seq.current;
    setItems(list => [...list, { id, text, kind }]);
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), kind === 'error' ? 6000 : 2800);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="st-toasts" aria-live="polite">
        {items.map(t => <div key={t.id} className={`st-toast is-${t.kind}`}>{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

/** Черновик с исходником: dirty — есть отличия, reset — вернуть сохранённое. */
export function useDraft(initial) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const dirty = saved !== null && JSON.stringify(saved) !== JSON.stringify(draft);
  const load = useCallback((value) => { setSaved(value); setDraft(value); }, []);
  const reset = useCallback(() => setDraft(saved), [saved]);
  return { saved, draft, setDraft, dirty, load, reset };
}

export const Icon = {
  feed: <path d="M4 5h16M4 12h16M4 19h10" />,
  hints: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></>,
  reviews: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  stats: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  catalog: <><circle cx="12" cy="13" r="6" /><path d="M9 3h6l-3 4z" /></>,
  links: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  out: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  grip: <><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  photo: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 16l-5-5-8 8" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  wa: <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 6l-6 6 6 6" />,
  wand: <><path d="M4 20L15 9" /><path d="M15 3v2M15 13v2M19 7h2M9 7h2M18 4l-1.4 1.4M18 12l-1.4-1.4" /></>,
};

export function Svg({ name, size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {Icon[name]}
    </svg>
  );
}
