// Netlify Function: set-prices
// Saves updated price configuration to Netlify Blobs (admin-only)

import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Auth check
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let prices;
  try {
    prices = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  try {
    const store = getStore('nd-prices');
    await store.setJSON('config', prices);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('set-prices error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save prices', detail: String(err) }),
    };
  }
};
