import { useState, useEffect } from 'react';

// Prices live in Netlify Blobs and are served by /api/get-prices.
//
// This module used to read localStorage, which meant every visitor saw whatever
// was baked into the bundle: an edit made in the admin panel reached only the
// browser it was made in. Prices now come from the server, so one edit applies
// to everyone.
//
// The defaults below are a last resort for when the request fails — the catalog
// must still render a price rather than a blank.

export const PRICE_DEFAULTS = {
  baseByShank: {
    'Neo':         800000,
    'Sirius':      550000,
    'Sirius Luxe': 650000,
    'Bezel':       550000,
  },
  casts: {
    halo:  150000,
    bezel: 100000,
  },
  // Пусеты. 0 означает «цена не задана» — карточка показывает «по запросу»,
  // чтобы не выдумывать сумму за владельца.
  baseByPusety: {
    classic: 0,
    halo:    0,
  },
  caratPrice:            200000,
  purity750surcharge:    100000,
  fancyColorSurcharge:   100000,
  scatterFancySurcharge: 100000,
};

function merge(saved) {
  if (!saved || typeof saved !== 'object') return PRICE_DEFAULTS;
  return {
    ...PRICE_DEFAULTS,
    ...saved,
    baseByShank:  { ...PRICE_DEFAULTS.baseByShank,  ...(saved.baseByShank ?? {}) },
    casts:        { ...PRICE_DEFAULTS.casts,        ...(saved.casts ?? {}) },
    baseByPusety: { ...PRICE_DEFAULTS.baseByPusety, ...(saved.baseByPusety ?? {}) },
  };
}

// Filled by the first successful fetch, then reused for the rest of the visit.
// Последние цены помнятся и в браузере: повторный заход рисует настоящую цену
// сразу, а не цену по умолчанию, которая через миг сменилась бы на другую.
const STORE_KEY = 'nd_prices';
let cache = (() => {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORE_KEY);
    return raw ? merge(JSON.parse(raw)) : null;
  } catch { return null; }
})();
let fresh = false;
let inflight = null;

// Synchronous read for code that renders before the request lands.
export function loadPrices() {
  return cache ?? PRICE_DEFAULTS;
}

/** Цены уже настоящие — с сервера в этот визит или из прошлого. */
export const pricesKnown = () => cache !== null;

export function fetchPrices() {
  if (cache && fresh) return Promise.resolve(cache);
  if (inflight) return inflight;

  inflight = fetch('/api/get-prices')
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      cache = merge(data);
      fresh = true;
      try { if (data) localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* приватный режим */ }
      return cache;
    })
    .catch(() => PRICE_DEFAULTS)
    .finally(() => { inflight = null; });

  return inflight;
}

// Renders immediately with whatever is known, then updates once the real
// prices arrive.
export function usePrices() {
  const [prices, setPrices] = useState(loadPrices);
  useEffect(() => {
    let alive = true;
    fetchPrices().then(p => { if (alive) setPrices(p); });
    return () => { alive = false; };
  }, []);
  return prices;
}

export async function savePrices(prices, token) {
  const res = await fetch('/api/set-prices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prices),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(res.status === 401 ? 'Неверный пароль' : `Не удалось сохранить (${res.status}) ${detail}`);
  }
  cache = merge(prices);
  fresh = true;
  return cache;
}

