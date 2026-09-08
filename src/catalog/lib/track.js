// Event tracking for the catalog funnel.
//
// The catalog is a SPA: moving between screens leaves no trace, so until now
// there was no way to tell where visitors drop off, which shapes they pick or
// how many reach WhatsApp. This records those steps.
//
// Scope is /catalog only — the configurator on the root path is a separate
// journey and mixing the two would make the funnel meaningless.
//
// Privacy: the session id is a random value with no link to a person. Nothing
// identifying is collected here; the city is derived server-side from the
// request and never a precise location.

const SESSION_KEY = 'nd_sid';
const UTM_KEY     = 'nd_utm';

export const EVENTS = {
  SESSION_START: 'session_start',
  SHAPE_SELECT:  'shape_select',
  CATALOG_VIEW:  'catalog_view',
  PRODUCT_OPEN:  'product_open',
  CONFIG_CHANGE: 'config_change',
  BOOKING_OPEN:  'booking_open',
  WA_CLICK:      'wa_click',
};

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// One id per browser tab session. Cleared when the tab closes, so it measures
// a visit rather than following anyone over time.
function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch (_) {
    return 'no-storage';
  }
}

function getUtm() {
  try { return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? '{}') ?? {}; }
  catch (_) { return {}; }
}

// Guards against double-sends from React effects running twice in development
// and from a screen re-mounting without the visitor actually going anywhere.
const sentOnce = new Set();

export function track(event, props = {}, { once = false } = {}) {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/catalog')) return;

  if (once) {
    const key = `${event}:${JSON.stringify(props)}`;
    if (sentOnce.has(key)) return;
    sentOnce.add(key);
  }

  const payload = JSON.stringify({
    sessionId: getSessionId(),
    event,
    props,
    path: window.location.pathname,
    utm: getUtm(),
    ts: Date.now(),
  });

  try {
    // sendBeacon survives the page being closed or backgrounded, which matters
    // for wa_click — the visitor leaves for WhatsApp the same instant.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch (_) {
    // Analytics must never break the page.
  }
}
