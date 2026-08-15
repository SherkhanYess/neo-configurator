import { SHANKS } from './config.js';

export const PRICE_DEFAULTS = {
  baseByShank: {
    'Neo':         800000,
    'Neo Luxe':    900000,
    'Sirius':      550000,
    'Sirius Luxe': 650000,
    'Bezel':       550000,
  },
  casts: {
    halo:  150000,
    bezel: 100000,
  },
  caratPrice:            200000,
  purity750surcharge:    100000,
  fancyColorSurcharge:   100000,
  scatterFancySurcharge: 100000,
};

const LS_KEY = 'nd_prices_v1';

export function loadPrices() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return PRICE_DEFAULTS;
    const saved = JSON.parse(raw);
    return {
      ...PRICE_DEFAULTS,
      ...saved,
      baseByShank: { ...PRICE_DEFAULTS.baseByShank, ...(saved.baseByShank ?? {}) },
      casts:       { ...PRICE_DEFAULTS.casts,       ...(saved.casts ?? {}) },
    };
  } catch {
    return PRICE_DEFAULTS;
  }
}

export function savePrices(prices) {
  localStorage.setItem(LS_KEY, JSON.stringify(prices));
}

export function resetPrices() {
  localStorage.removeItem(LS_KEY);
}

export const SHANK_LABELS = SHANKS.map(s => s.id);
