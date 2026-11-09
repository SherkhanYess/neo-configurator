import { useState, useEffect } from 'react';
import { SHAPES, modelName } from './config.js';
import { defaultProducts, mergeProducts } from './models.js';

// Какие модели и огранки показывает витрина — /api/get-products, правится в
// админке. Правила списка (добавить, удалить, версии документа) — models.js;
// здесь — загрузка, кэш и хуки.
//
// Привязка к iJewel (теги огранок и оправ) — в config.js: она должна точно
// совпадать с 3D-моделью. Имя шинки новой модели админка берёт у владельца.

export { defaultProducts };
const merge = mergeProducts;

let cache = null;
let inflight = null;
let failed = false;   // сервер не ответил — живём на стартовом списке

export function loadProducts() {
  return cache ?? defaultProducts();
}

export function fetchProducts() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  // Админке — мимо кэша CDN: после сохранения ей нужна свежая версия.
  const fresh = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  inflight = fetch(fresh ? '/api/get-products?fresh' : '/api/get-products')
    .then(r => (r.ok ? r.json() : null))
    .then(data => { cache = merge(data); return cache; })
    .catch(() => { failed = true; return defaultProducts(); })
    .finally(() => { inflight = null; });

  return inflight;
}

/** Список уже с сервера (или запрос не удался — тогда стартовый из кода). */
export const productsLoaded = () => cache !== null || failed;

export function useProducts() {
  return useProductsState()[0];
}

/** [модели, пришли ли они с сервера] — страница модели ждёт, прежде чем решить, что такой нет. */
export function useProductsState() {
  const [state, setState] = useState(() => [loadProducts(), productsLoaded()]);
  useEffect(() => {
    let alive = true;
    fetchProducts().then(p => { if (alive) setState([p, true]); });
    return () => { alive = false; };
  }, []);
  return state;
}

export async function saveProducts(products, token) {
  const res = await fetch('/api/set-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(products),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(res.status === 401 ? 'Неверный пароль' : `Не удалось сохранить (${res.status}) ${detail}`);
  }
  cache = merge(products);
  return cache;
}

// ─── Read helpers used by the catalog screens ──────────────────────────────

export function enabledShapes(products) {
  const on = new Set(products.shapes.filter(s => s.enabled).map(s => s.id));
  return SHAPES.filter(s => on.has(s.id))
    .map(s => ({ ...s, label: products.shapes.find(p => p.id === s.id)?.label || s.label }));
}

export function shapeLabel(products, shapeId) {
  return products.shapes.find(s => s.id === shapeId)?.label
      ?? SHAPES.find(s => s.id === shapeId)?.label
      ?? shapeId;
}

export function enabledRings(products) {
  return products.rings.filter(r => r.enabled);
}

// Admin can rename a model; falls back to the built-in name.
export function ringName(products, shank, cast) {
  return products.rings.find(r => r.shank === shank && r.cast === cast)?.name
      ?? modelName(shank, cast);
}
