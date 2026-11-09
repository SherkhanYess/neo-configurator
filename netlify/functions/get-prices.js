// Netlify Function v2: get-prices
// Returns the current price configuration from Netlify Blobs.
//
// С CDN, как модели и лента: цены нужны каждой странице, и без кэша каждый
// заход ждал функцию. Сохранение цен в админке сбрасывает кэш (set-prices).

import { getStore } from '@netlify/blobs';
import { cachedJson } from '../lib/http.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS });
  }

  try {
    const store = getStore({ name: 'nd-prices', context });
    const raw = await store.get('config');
    const prices = raw ? JSON.parse(raw) : null;
    // Админка читает мимо кэша — ей нужна свежая версия сразу после сохранения.
    if (new URL(req.url).searchParams.has('fresh')) {
      return new Response(JSON.stringify(prices ?? getDefaultPrices()), { status: 200, headers: { ...CORS, 'Cache-Control': 'no-store' } });
    }
    return cachedJson(prices ?? getDefaultPrices(), 'prices');
  } catch (err) {
    console.warn('get-prices blob error (returning defaults):', err);
    return new Response(JSON.stringify(getDefaultPrices()), { status: 200, headers: CORS });
  }
};

export const config = { path: '/api/get-prices' };

function getDefaultPrices() {
  return {
    baseByShank: {
      'Neo':         200000,
      'Neo Luxe':    250000,
      'Sirius':      220000,
      'Sirius Luxe': 280000,
      'Bezel':       230000,
    },
    casts: {
      halo: 30000,
      bezel: 20000,
    },
    caratPrice:           200000, // per carat ABOVE 1
    purity750surcharge:   20000,
    fancyColorSurcharge:  100000, // per carat, central diamond only
    scatterFancySurcharge: 150000, // flat, per scatter zone (россыпь / хало)
  };
}
