// Computes the backing tone for each feed photo (see DESIGN.md, "Лента: цвета").
// Run: npm run feed:tones  → writes src/catalog/data/feed-tones.json
// Covers the owner's photos in public/assets/feed/ and the round studio renders
// the feed falls back to while a model has no photo yet.
// Rule: average colour of the bottom 15% of the photo, darkened while keeping
// its hue until white text on it reaches 10:1 contrast. Text is always light.
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCES = [
  { dir: 'public/assets/feed',  match: /\.(webp|jpe?g|png|avif)$/i },
  { dir: 'public/assets/rings', match: /-round\.webp$/i },
];
const OUT = 'src/catalog/data/feed-tones.json';
const TARGET = 10;

const channel = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const whiteContrast = c => 1.05 / (luminance(c) + 0.05);
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

async function tone(file) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const top = Math.floor(height * 0.85);
  const { data } = await img
    .extract({ left: 0, top, width, height: height - top })
    .resize(1, 1, { kernel: 'lanczos3' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const base = [data[0], data[1], data[2]];
  let c = base;
  for (let s = 1; whiteContrast(c) < TARGET && s > 0; s -= 0.02) c = base.map(v => Math.round(v * s));
  return { sampled: hex(base), tone: hex(c), contrast: +whiteContrast(c).toFixed(1) };
}

const result = {};
for (const { dir, match } of SOURCES) {
  const files = (await readdir(dir).catch(() => [])).filter(f => match.test(f)).sort();
  for (const f of files) {
    const url = '/' + join(dir, f).replace(/^public\//, '');
    result[url] = await tone(join(dir, f));
    console.log(url.padEnd(44), result[url].sampled, '→', result[url].tone, `${result[url].contrast}:1`);
  }
}
const files = Object.keys(result);
await writeFile(OUT, JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.tone])), null, 2) + '\n');
console.log(`\n${files.length} фото → ${OUT}`);
