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
const PAPER = '#F4EFE7', STUDIO = '#EDE6DA', INK = '#061B1B', INK4 = '#5F6E68', CHAMP = '#6B5538';

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
    { input: await textPng(`<span foreground="${INK4}" letter_spacing="6000">aena</span>`, 'Jost 22'), left: tx, top: 150 },
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
  const logoPath = join(dist, 'assets', 'aena', 'word-deep.png');
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
      await buildCard({ ringPath, logoPath, name: 'aena', priceText: null, out: join(outDir, 'default.jpg') });
      done.add('default');
    }
  } catch (e) {
    console.warn(`  og-card default: ${e.message}`);
  }

  console.log(`  og-карточки: ${done.size} готово${failures ? `, ${failures} пропущено` : ''}`);
  return done;
}

// ─── Гиды ───────────────────────────────────────────────────────────────────
// Превью ссылки на гид — тёмная карточка с заголовком статьи и кольцом справа:
// по ней из ленты Instagram и из WhatsApp видно, что это статья, а не товар.
const GUIDE_RING = { secret: 'halo-round', anatomy: 'sirius-oval', tomorrow: 'neo-oval' };

async function buildGuideCard({ ringPath, title, minutes, out }) {
  const base = sharp({ create: { width: W, height: H, channels: 4, background: INK } });
  const ring = await sharp(ringPath).resize({ width: 440, height: 440, fit: 'cover' }).png().toBuffer();
  const rounded = await sharp(ring)
    .composite([{ input: Buffer.from('<svg width="440" height="440"><rect width="440" height="440" rx="36" ry="36"/></svg>'), blend: 'dest-in' }])
    .png().toBuffer();
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Короткий предлог не висит в конце строки: «о помолвочном», а не «о» / «помолвочном».
  title = String(title).replace(/(^|\s)(о|в|с|к|и|а|за|на|не|без)\s/giu, '$1$2\u00A0');
  const titlePng = await sharp({ text: { text: `<span foreground="#FFFFFF">${esc(title)}</span>`, font: 'Jost 50', fontfile: FONT, rgba: true, width: 560, spacing: 6 } }).png().toBuffer();
  await base.composite([
    { input: rounded, left: W - 440 - 80, top: Math.round((H - 440) / 2) },
    { input: await textPng(`<span foreground="#896E4C" letter_spacing="5000">ГИД ДЛЯ МУЖЧИН</span>`, 'Jost 22'), left: 80, top: 96 },
    { input: titlePng, left: 80, top: 150 },
    { input: await textPng(`<span foreground="#C9BFAE">${minutes} · aena</span>`, 'Jost 24'), left: 80, top: H - 120 },
  ]).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
}

/** По карточке на гид в <dist>/assets/og/guide-<slug>.jpg. Возвращает готовые slug. */
export async function generateGuideCards({ dist, guides, minutesLabel }) {
  const outDir = join(dist, 'assets', 'og');
  mkdirSync(outDir, { recursive: true });
  const done = new Set();
  for (const g of guides) {
    const ringPath = join(dist, 'assets', 'rings', `${GUIDE_RING[g.cover] ?? 'neo-halo-round'}.webp`);
    if (!existsSync(ringPath)) continue;
    try {
      await buildGuideCard({ ringPath, title: g.title, minutes: `${minutesLabel(g.minutes)} чтения`, out: join(outDir, `guide-${g.slug}.jpg`) });
      done.add(g.slug);
    } catch (e) {
      console.warn(`  og-card guide ${g.slug}: ${e.message}`);
    }
  }
  return done;
}
