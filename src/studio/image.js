// Фото для ленты: сжатие в браузере и цвет плашки.
//
// Сжимаем до 1400 px по ширине: телефону с плотным экраном (390 × 3) хватает с
// запасом, а файл выходит в 200–400 КБ вместо 5–10 МБ с камеры.
//
// Цвет плашки — правило из DESIGN.md («Лента: цвета»): средний цвет нижних 15%
// того, что видно в карточке, затемнённый с сохранением оттенка, пока белый
// текст на нём не наберёт контраст 10 : 1. Видимую часть считаем по кадрированию
// карточки 4 : 5 и точке фокуса — иначе цвет брался бы с обрезанного края.

const MAX_WIDTH = 1400;
export const CARD_ASPECT = 4 / 5;
export const TARGET_CONTRAST = 10;

export async function readImage(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* ниже — запасной путь */ }
  }
  const url = URL.createObjectURL(file);
  try { return await loadImage(url); } finally { URL.revokeObjectURL(url); }
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось открыть картинку'));
    img.src = url;
  });
}

const sizeOf = (img) => ({ w: img.naturalWidth ?? img.width, h: img.naturalHeight ?? img.height });

function toBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

/** Уменьшенная копия: WebP, а где браузер не умеет его сохранять (Safari) — JPEG. */
export async function compress(img) {
  const { w, h } = sizeOf(img);
  const scale = Math.min(1, MAX_WIDTH / w);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let blob = await toBlob(canvas, 'image/webp', 0.86);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.88);
  return { blob, width: canvas.width, height: canvas.height };
}

// ─── Цвет ────────────────────────────────────────────────────────────────────

const channel = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
export const whiteContrast = (rgb) => 1.05 / (luminance(rgb) + 0.05);

export const toHex = (rgb) => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
export const fromHex = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Затемняет, сохраняя оттенок, пока белый текст не станет читаемым. */
export function readable(rgb) {
  let c = rgb;
  for (let s = 1; whiteContrast(c) < TARGET_CONTRAST && s > 0; s -= 0.02) c = rgb.map(v => Math.round(v * s));
  return c;
}

export const contrastOf = (hex) => {
  const rgb = fromHex(hex);
  return rgb ? whiteContrast(rgb) : 0;
};

/** Часть фото, которую видно в карточке 4 : 5 при данной точке фокуса. */
export function visibleRect(img, focus = { x: 50, y: 50 }, aspect = CARD_ASPECT) {
  const { w, h } = sizeOf(img);
  if (w / h > aspect) {
    const vw = h * aspect;
    return { x: (w - vw) * (focus.x / 100), y: 0, w: vw, h };
  }
  const vh = w / aspect;
  return { x: 0, y: (h - vh) * (focus.y / 100), w, h: vh };
}

function average(img, rect) {
  const canvas = document.createElement('canvas');
  canvas.width = 24; canvas.height = 8;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 24, 8);
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, 24, 8);
  const { data } = ctx.getImageData(0, 0, 24, 8);
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) { sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; }
  const n = data.length / 4;
  return sum.map(v => v / n);
}

/** Тон по правилу ленты. */
export function autoTone(img, focus) {
  const v = visibleRect(img, focus);
  const band = { x: v.x, y: v.y + v.h * 0.85, w: v.w, h: v.h * 0.15 };
  return toHex(readable(average(img, band)));
}

/**
 * Ещё несколько тонов из того же фото — если автоматический не нравится.
 * Все уже читаемые: выбрать нечитаемый из админки нельзя.
 */
export function toneOptions(img, focus) {
  const v = visibleRect(img, focus);
  const bands = [
    { x: v.x, y: v.y + v.h * 0.85, w: v.w, h: v.h * 0.15 },              // низ — авто
    { x: v.x, y: v.y + v.h * 0.6,  w: v.w, h: v.h * 0.25 },              // над низом
    { x: v.x, y: v.y,              w: v.w, h: v.h },                     // всё фото
    { x: v.x, y: v.y + v.h * 0.85, w: v.w * 0.33, h: v.h * 0.15 },       // левый угол
    { x: v.x + v.w * 0.67, y: v.y + v.h * 0.85, w: v.w * 0.33, h: v.h * 0.15 }, // правый угол
    { x: v.x + v.w * 0.3, y: v.y + v.h * 0.3, w: v.w * 0.4, h: v.h * 0.4 },  // центр
  ];
  const out = [];
  for (const b of bands) {
    const rgb = readable(average(img, b));
    // Почти одинаковые тона не показываем дважды.
    if (out.every(o => Math.hypot(...o.map((c, i) => c - rgb[i])) > 14)) out.push(rgb);
  }
  return out.map(toHex);
}
