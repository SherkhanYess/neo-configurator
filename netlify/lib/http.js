// Общее для функций админки: ответы JSON и проверка пароля.
//
// Пароль — тот же ADMIN_TOKEN, что проверяют цены и статистика. Сравнение по
// постоянному времени: обычное === выдаёт по скорости ответа, сколько первых
// символов угадано.

import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';
import process from 'node:process';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

export const preflight = () => new Response('', { status: 204, headers: CORS });

export function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
