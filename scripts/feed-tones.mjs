// Computes the backing tone for each feed photo (see DESIGN.md, "Лента: цвета").
// Run: node scripts/feed-tones.mjs  → writes src/catalog/data/feed-tones.json
// Rule: average colour of the bottom 15% of the photo, darkened while keeping
// its hue until white text on it reaches 10:1 contrast. Text is always light.
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = 'public/assets/feed';
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

const files = (await readdir(DIR)).filter(f => /\.(webp|jpe?g|png|avif)$/i.test(f)).sort();
const result = {};
for (const f of files) {
  result[f] = await tone(join(DIR, f));
  console.log(f.padEnd(32), result[f].sampled, '→', result[f].tone, `${result[f].contrast}:1`);
}
await writeFile(OUT, JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.tone])), null, 2) + '\n');
console.log(`\n${files.length} фото → ${OUT}`);
