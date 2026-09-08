import { useState, useEffect } from 'react';
import { SHAPES, VALID_COMBOS, PUSETЫ_SHAPES_BY_CAST, PUSETЫ_CASTS, modelName } from './config.js';

// Which products the catalog shows, served by /api/get-products.
//
// Deliberately limited to visibility and naming. The bindings to iJewel — shank
// variation names, shape and cast tags — stay in config.js and are not editable:
// they must match the 3D model exactly, and a typo there would break the viewer
// rather than just mislabel a card.
//
// The document is an overlay. Anything missing falls back to config.js, so a
// failed request leaves the catalog exactly as it ships.

export function defaultProducts() {
  return {
    version: 1,
    shapes: SHAPES.map(s => ({ id: s.id, label: s.label, enabled: true })),
    rings: VALID_COMBOS.map(({ shank, cast }) => ({
      shank, cast,
      name: modelName(shank, cast),
      enabled: true,
    })),
    pusety: PUSETЫ_CASTS.flatMap(c =>
      (PUSETЫ_SHAPES_BY_CAST[c.id] ?? []).map(shape => ({
        cast: c.id, shape, enabled: true,
      }))
    ),
  };
}

// Fills gaps from the defaults so an older stored document keeps working after
// a new shape or model ships.
function merge(saved) {
  const base = defaultProducts();
  if (!saved || typeof saved !== 'object') return base;

  const shapeById = new Map((saved.shapes ?? []).map(s => [s.id, s]));
  const ringByKey  = new Map((saved.rings  ?? []).map(r => [`${r.shank}|${r.cast}`, r]));
  const pusetByKey = new Map((saved.pusety ?? []).map(p => [`${p.cast}|${p.shape}`, p]));

  return {
    version: 1,
    shapes: base.shapes.map(s => {
      const o = shapeById.get(s.id);
      return o ? { ...s, label: o.label || s.label, enabled: o.enabled !== false } : s;
    }),
    rings: base.rings.map(r => {
      const o = ringByKey.get(`${r.shank}|${r.cast}`);
      return o ? { ...r, name: o.name || r.name, enabled: o.enabled !== false } : r;
    }),
    pusety: base.pusety.map(p => {
      const o = pusetByKey.get(`${p.cast}|${p.shape}`);
      return o ? { ...p, enabled: o.enabled !== false } : p;
    }),
  };
}

let cache = null;
let inflight = null;

export function loadProducts() {
  return cache ?? defaultProducts();
}

export function fetchProducts() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  inflight = fetch('/api/get-products')
    .then(r => (r.ok ? r.json() : null))
    .then(data => { cache = merge(data); return cache; })
    .catch(() => defaultProducts())
    .finally(() => { inflight = null; });

  return inflight;
}

export function useProducts() {
  const [products, setProducts] = useState(loadProducts);
  useEffect(() => {
    let alive = true;
    fetchProducts().then(p => { if (alive) setProducts(p); });
    return () => { alive = false; };
  }, []);
  return products;
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

export function enabledPusety(products) {
  return products.pusety.filter(p => p.enabled);
}

// Admin can rename a model; falls back to the built-in name.
export function ringName(products, shank, cast) {
  return products.rings.find(r => r.shank === shank && r.cast === cast)?.name
      ?? modelName(shank, cast);
}
