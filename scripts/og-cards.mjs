// Composite Open Graph preview cards for WhatsApp / social link previews.
//
// Each catalog product page (/catalog/product/<model>/<cast>/<shape>) is a
// shareable link. Without an og:image the preview is a bare text line, which
// opens poorly. This builds a 1200×630 JPEG per model+shape — ring photo on a
// studio panel, model name, "от N ₸" and the wordmark — matching the live site
// (brand font Jost, paper/ink/champagne palette).
//
// Deliberately defensive: every card is wrapped in try/catch and the caller
// treats a failure as "no og:image for that page", so a broken font or a
// missing sharp binary degrades to the previous behaviour instead of failing
// the build.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(__dirname, 'assets');
const FONT = join(FONT_DIR, 'Jost.ttf');

// Pango (used by sharp for text) resolves families through fontconfig. Point it
// at the vendored font dir so the brand font is found on any build host, and so
// a missing system fontconfig does not error.
(function ensureFontconfig() {
  if (process.env.FONTCONFIG_FILE) return;
  try {
    const dir = join(tmpdir(), 'nd-og-fc');
    mkdirSync(join(dir, 'cache'), { recursive: true });
    const conf = join(dir, 'fonts.conf');
    writeFileSync(conf, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${join(dir, 'cache')}</cachedir>
  <config></config>
</fontconfig>`);
    process.env.FONTCONFIG_FILE = conf;
  } catch { /* fall back to system fontconfig */ }
})();

const W = 1200, H = 630, PANEL = 660;
const PAPER = '#FAFBFC', STUDIO = '#EBEBEC', INK = '#0B2040', INK4 = '#5B81A1', CHAMP = '#7C6035';

function textPng(markup, font) {
  return sharp({ text: { text: markup, font, fontfile: FONT, rgba: true } }).png().toBuffer();
}

async function buildCard({ ringPath, logoPath, name, priceText, out }) {
  const base = sharp({ create: { width: W, height: H, channels: 4, background: PAPER } });

  const studio = await sharp({ create: { width: PANEL, height: H, channels: 4, background: STUDIO } })
    .png().toBuffer();

  const ringBuf = await sharp(ringPath).resize({ width: 540, height: 540, fit: 'inside' }).png().toBuffer();
  const ring = await sharp(ringBuf).metadata();

  const tx = PANEL + 56;
  const layers = [
    { input: studio, left: 0, top: 0 },
    { input: ringBuf, left: Math.round((PANEL - ring.width) / 2), top: Math.round((H - ring.height) / 2) },
    { input: await textPng(`<span foreground="${INK4}" letter_spacing="6000">NEO DIAMOND</span>`, 'Jost 22'), left: tx, top: 150 },
    { input: await textPng(`<span foreground="${INK}">${name}</span>`, 'Jost 62'), left: tx, top: 205 },
  ];
  if (priceText) {
    layers.push({ input: await textPng(`<span foreground="${CHAMP}">${priceText}</span>`, 'Jost Medium 40'), left: tx, top: 320 });
  }
  layers.push({ input: await textPng(`<span foreground="${INK4}">10 огранок · Сертификат IGI</span>`, 'Jost 24'), left: tx, top: priceText ? 400 : 320 });
  if (logoPath && existsSync(logoPath)) {
    layers.push({ input: await sharp(logoPath).resize({ height: 34 }).png().toBuffer(), left: tx, top: 500 });
  }

  await base.composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
}

/**
 * Generates one card per model+shape (plus a brand default) into
 * <dist>/assets/og/. Returns a Set of `${slug}-${shape}` keys that succeeded
 * (and 'default' when the default card was written) so the caller only
 * references images that actually exist.
 */
export async function generateOgCards({ dist, combos, shapes, modelSlug, priceFor, money }) {
  const outDir = join(dist, 'assets', 'og');
  mkdirSync(outDir, { recursive: true });
  const logoPath = join(dist, 'assets', 'logo-ink.png');
  const done = new Set();
  let failures = 0;

  for (const [shank, cast, model] of combos) {
    const mslug = modelSlug[model];
    if (!mslug) continue;
    const price = priceFor(shank, cast);
    const priceText = price ? `от ${money(price)}` : null;

    for (const [shapeId] of shapes) {
      const ringPath = join(dist, 'assets', 'rings', `${mslug}-${shapeId}.webp`);
      if (!existsSync(ringPath)) continue;
      const key = `${mslug}-${shapeId}`;
      try {
        await buildCard({ ringPath, logoPath, name: model, priceText, out: join(outDir, `${key}.jpg`) });
        done.add(key);
      } catch (e) {
        failures++;
        if (failures <= 3) console.warn(`  og-card ${key}: ${e.message}`);
      }
    }
  }

  // Brand default for pages without a specific product (home, list).
  try {
    const ringPath = join(dist, 'assets', 'rings', 'neo-halo-round.webp');
    if (existsSync(ringPath)) {
      await buildCard({ ringPath, logoPath, name: 'Neo Diamond', priceText: null, out: join(outDir, 'default.jpg') });
      done.add('default');
    }
  } catch (e) {
    console.warn(`  og-card default: ${e.message}`);
  }

  console.log(`  og-карточки: ${done.size} готово${failures ? `, ${failures} пропущено` : ''}`);
  return done;
}
