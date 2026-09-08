// Netlify Function v2: get-products
// Returns which catalog products are shown and how they are named.
//
// Returns null when nothing has been saved yet — the client then uses the
// defaults built from config.js, so the catalog works before any admin edit.

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });

  try {
    const store = getStore({ name: 'nd-products', context });
    const saved = await store.get('config', { type: 'json' });
    return new Response(JSON.stringify(saved ?? null), { status: 200, headers: CORS });
  } catch (err) {
    console.warn('get-products error (falling back to defaults):', err);
    return new Response('null', { status: 200, headers: CORS });
  }
};

export const config = { path: '/api/get-products' };
