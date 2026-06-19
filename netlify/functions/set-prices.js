// Netlify Function v2: set-prices
// Saves updated price configuration to Netlify Blobs (admin-only)

import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  // Auth check
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
  }

  let prices;
  try {
    prices = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  // Reject null or non-object payloads
  if (!prices || typeof prices !== 'object' || Array.isArray(prices)) {
    return new Response(JSON.stringify({ error: 'Invalid prices object' }), { status: 400, headers: CORS });
  }

  try {
    const store = getStore({ name: 'nd-prices', context });
    await store.set('config', JSON.stringify(prices));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
  } catch (err) {
    console.error('set-prices error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to save prices', detail: String(err) }),
      { status: 500, headers: CORS }
    );
  }
};

export const config = { path: '/api/set-prices' };
