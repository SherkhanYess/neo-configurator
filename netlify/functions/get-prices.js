// Netlify Function v2: get-prices
// Returns the current price configuration from Netlify Blobs

import { getStore } from '@netlify/blobs';

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
    return new Response(JSON.stringify(prices ?? getDefaultPrices()), { status: 200, headers: CORS });
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
    caratPrice:          80000,
    purity750surcharge:  20000,
    fancyColorSurcharge: 100000,
  };
}
