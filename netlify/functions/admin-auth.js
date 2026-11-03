// Проверка пароля при входе в админку: без неё неверный пароль всплывал бы
// только при первом сохранении, когда работа уже сделана.

import { isAdmin, json, preflight } from '../lib/http.js';

export default async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'method' });
  return isAdmin(req) ? json(200, { ok: true }) : json(401, { error: 'unauthorized' });
};

export const config = { path: '/api/admin-auth' };
