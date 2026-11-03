// Запросы админки к серверу.
//
// Пароль хранится в браузере, чтобы перезагрузка не выкидывала из админки, и
// уходит с каждым запросом. Проверяет его сервер; если он ответил «не тот
// пароль», админка возвращается на экран входа.

const TOKEN_KEY = 'nd_admin';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
}
export function setToken(value) {
  try { localStorage.setItem(TOKEN_KEY, value); } catch { /* приватный режим */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* приватный режим */ }
}

export const UNAUTHORIZED = 'studio:unauthorized';

export async function api(path, { method = 'GET', body, raw, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED));
    throw new Error('Пароль больше не подходит — войдите заново');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? data?.error ?? `Сервер ответил ${res.status}`);
  return data;
}

export async function checkPassword(value) {
  const res = await fetch('/api/admin-auth', { method: 'POST', headers: { Authorization: `Bearer ${value}` } });
  return res.ok;
}

/** Загружает уже сжатую картинку, возвращает её адрес. */
export async function uploadImage(blob, { width, height } = {}) {
  const { url } = await api('/api/media', {
    method: 'POST',
    raw: blob,
    headers: { 'Content-Type': blob.type, 'X-Width': String(width ?? ''), 'X-Height': String(height ?? '') },
  });
  return url;
}
