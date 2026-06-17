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
    base: 150000,
    shapes: {
      oval: 20000,
      pear: 20000,
      marquise: 20000,
      radiant: 15000,
      emerald: 15000,
      cushion: 15000,
      princess: 15000,
      heart: 25000,
      asscher: 15000,
    },
    casts: {
      halo: 30000,
      bezel: 20000,
    },
    shanks: {
      'Neo Luxe': 10000,
      'Sirius Luxe': 15000,
      'Bezel': 10000,
    },
    metals: {
      'Жёлтое': 0,
      'Розовое': 5000,
    },
    purity750surcharge: 10,
    caratPrice: 80000,
    fancyColorSurcharge: 0,
  };
}
