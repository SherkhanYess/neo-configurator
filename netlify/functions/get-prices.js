// Netlify Function: get-prices
// Returns the current price configuration from Netlify Blobs

import { getStore } from '@netlify/blobs';

export const handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const store = getStore('nd-prices');
    const prices = await store.get('config', { type: 'json' });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(prices ?? getDefaultPrices()),
    };
  } catch (err) {
    console.warn('get-prices blob error (returning defaults):', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(getDefaultPrices()),
    };
  }
};

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
    purity750surcharge:  20000,  // flat KZT for 750 purity
    fancyColorSurcharge: 100000, // KZT per 1 carat for fancy color
  };
}
