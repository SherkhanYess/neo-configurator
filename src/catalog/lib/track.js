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

import { mirrorToPixel } from './pixel.js';

const SESSION_KEY = 'nd_sid';
const UTM_KEY     = 'nd_utm';

export const EVENTS = {
  SESSION_START: 'session_start',
  PRODUCT_OPEN:  'product_open',
  CONFIG_CHANGE: 'config_change',
  BOOKING_OPEN:  'booking_open',
  WA_CLICK:      'wa_click',

  // Отдельные точки выхода — чтобы измерять их независимо друг от друга.
  LEARN_MORE:      'product_learn_more_click',
  BOOKING_WA:      'booking_whatsapp_click',
  SHARE_CLICK:     'booking_share_click',
  SHARE_SUCCESS:   'booking_share_success',
  OTHER_MODELS:    'booking_other_models_click',
  FAQ_OPEN:        'faq_open',

  // Лента: вход в неё, просмотр карточки, листание галереи, навигация по
  // стилям и обращение за помощью с выбором.
  FEED_VIEW:         'feed_view',
  FEED_CARD_VIEW:    'feed_card_view',
  FEED_GALLERY_SWIPE:'feed_gallery_swipe',
  FEED_STYLE_CLICK:  'feed_style_click',
  FEED_HELP_CLICK:   'feed_help_click',

  // Страница модели: «Намекнуть партнёру» — открыла форму и отправила.
  HINT_OPEN:   'hint_open',
  HINT_SUBMIT: 'hint_submit',

  // Гиды: открыл карточку гида, зашёл на страницу, дочитал до финала,
  // перешёл из гида в каталог. WhatsApp из гида — обычный wa_click с полем guide.
  GUIDE_OPEN: 'guide_open',
  GUIDE_VIEW: 'guide_view',
  GUIDE_READ: 'guide_read',
  GUIDE_CTA:  'guide_cta',
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
  } catch {
    return 'no-storage';
  }
}

// Анонимный номер браузера — чтобы отличать людей от визитов: тот, кто
// смотрел вечером и вернулся утром, — один человек и два визита. Случайное
// значение без связи с личностью; живёт в localStorage этого браузера.
const VISITOR_KEY = 'nd_vid';
const FIRST_VISIT_KEY = 'nd_first';

function getVisitor() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem(VISITOR_KEY, id);
      sessionStorage.setItem(FIRST_VISIT_KEY, '1');   // первый визит этого браузера
    }
    return { visitorId: id, firstVisit: sessionStorage.getItem(FIRST_VISIT_KEY) === '1' };
  } catch {
    return { visitorId: null, firstVisit: false };
  }
}

// Браузер, в котором входили в админку, — свой: менеджер, владелец,
// разработчик. Его заходы не попадают ни в статистику, ни в рекламу.
export const STAFF_KEY = 'nd_staff';
function isStaff() {
  try { return localStorage.getItem(STAFF_KEY) === '1'; } catch { return false; }
}

/** Метки рекламы этого визита (их запоминает catalog-main.jsx при входе). */
export function readUtm() {
  try { return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? '{}') ?? {}; }
  catch { return {}; }
}

// Guards against double-sends from React effects running twice in development
// and from a screen re-mounting without the visitor actually going anywhere.
const sentOnce = new Set();

export function track(event, props = {}, { once = false } = {}) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  if (isStaff()) return;

  if (once) {
    const key = `${event}:${JSON.stringify(props)}`;
    if (sentOnce.has(key)) return;
    sentOnce.add(key);
  }

  mirrorToPixel(event, props);

  const payload = JSON.stringify({
    sessionId: getSessionId(),
    ...getVisitor(),
    event,
    props,
    path: window.location.pathname,
    utm: readUtm(),
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
  } catch {
    // Analytics must never break the page.
  }
}
