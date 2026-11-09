// Превью ссылок (Open Graph) — картинка 1200×630, которую показывают WhatsApp,
// Instagram и Telegram, когда ссылку на сайт отправляют в чат.
//
// По брендбуку taena (iCloud S/Business/Taena/Брендбук taena.pdf):
//   • фон — глубина #061B1B, знак и слово — бронзой #896E4C, текст — жемчугом;
//   • голос — Cormorant Garamond Light (курсив — для обещания), опора —
//     Manrope; надзаголовки — капсом с разрядкой 0.22em;
//   • в рекламе без цены — цена остаётся в тексте превью, не на картинке;
//   • фото — чёрно-белое.
//
// Три вида: обложка бренда (лента, каталог), модель + огранка, гид.
//
// Рисует Chrome без окна: каждая картинка — маленькая HTML-страница с
// фирменными шрифтами из scripts/assets, Chrome делает снимок. Текст в sharp
// не годится: на macOS он не видит файлы шрифтов и рисует системным
// Helvetica. Нет Chrome (путь — CHROME_PATH) или что-то сломалось — у страниц
// просто не будет картинки, сборка не падает.

import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(__dirname, 'assets');
const W = 1200, H = 630;
const PROMISE = 'То, что между вами, должно остаться';

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => p && existsSync(p));

const url = (p) => pathToFileURL(p).href;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Короткий предлог не висит в конце строки: «о помолвочном», а не «о» / «помолвочном».
const nbsp = (t) => String(t).replace(/(^|\s)(о|в|с|к|и|а|за|на|не|без|что)\s/giu, '$1$2 ');

const font = (file, weight, style = 'normal', family) =>
  `@font-face{font-family:${family};src:url("${url(join(FONT_DIR, file))}");font-weight:${weight};font-style:${style}}`;

const CSS = [
  font('CormorantGaramond-Light.ttf', 300, 'normal', 'CG'),
  font('CormorantGaramond-LightItalic.ttf', 300, 'italic', 'CG'),
  font('Manrope-Regular.ttf', 400, 'normal', 'MR'),
  font('Manrope-Medium.ttf', 500, 'normal', 'MR'),
  `*{box-sizing:border-box;margin:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:#061B1B;color:#E9E1D3;-webkit-font-smoothing:antialiased}
  .abs{position:absolute}
  .eb{font:500 15px/1 MR,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#896E4C}
  .mark{display:flex;align-items:flex-end;gap:14px}
  .mark img{display:block}`,
].join('\n');

const page = (body) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

/** Знак и слово бронзой в строку. */
const mark = (brand, h) =>
  `<div class="mark"><img src="${url(join(brand, 'sign-bronze.png'))}" style="height:${h}px"><img src="${url(join(brand, 'word-bronze.png'))}" style="height:${Math.round(h * 0.78)}px"></div>`;

// ─── Шаблоны ────────────────────────────────────────────────────────────────

/** Обложка бренда: слева фото пары чёрно-белым, уходит в глубину; справа — знак над словом и обещание. */
const brandHtml = ({ brand, photo }) => page(`
  ${photo ? `<div class="abs" style="left:0;top:0;width:580px;height:${H}px;background:url('${url(photo)}') center 40%/cover;filter:grayscale(1) brightness(.86)"></div>
  <div class="abs" style="left:0;top:0;width:580px;height:${H}px;background:linear-gradient(90deg,rgba(6,27,27,0) 50%,#061B1B 100%)"></div>` : ''}
  <div class="abs" style="left:600px;right:60px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    <img src="${url(join(brand, 'sign-bronze.png'))}" style="height:92px">
    <img src="${url(join(brand, 'word-bronze.png'))}" style="height:56px;margin-top:24px">
    <p style="font:italic 300 54px/1.12 CG,serif;margin-top:50px">То, что между вами,<br>должно остаться</p>
    <p class="eb" style="margin-top:38px">Помолвочные кольца · Алматы · Астана</p>
  </div>`);

/** Модель: кольцо в плитке, справа — знак, «Помолвочное кольцо», имя, огранка, обещание. Без цены. */
const modelHtml = ({ brand, ring, name, shape }) => page(`
  <img class="abs" src="${url(ring)}" style="left:80px;top:80px;width:470px;height:470px;object-fit:cover;border-radius:36px">
  <div class="abs" style="left:614px;right:70px;top:84px;bottom:80px;display:flex;flex-direction:column">
    ${mark(brand, 38)}
    <div style="margin-top:auto">
      <p class="eb">Помолвочное кольцо</p>
      <h1 style="font:300 ${name.length > 11 ? 78 : 92}px/1.02 CG,serif;margin-top:16px;text-wrap:balance">${esc(name)}</h1>
      ${shape ? `<p style="font:400 21px/1.3 MR,sans-serif;color:rgba(233,225,211,.72);margin-top:16px">Огранка «${esc(shape)}»</p>` : ''}
    </div>
    <p style="margin-top:auto;font:italic 300 34px/1.18 CG,serif;color:rgba(233,225,211,.86)">${esc(PROMISE)}</p>
  </div>`);

/** Гид: заголовок крупно, кольцо справа — видно, что это статья, а не товар. */
const guideHtml = ({ brand, ring, title, minutes }) => page(`
  <img class="abs" src="${url(ring)}" style="right:80px;top:95px;width:440px;height:440px;object-fit:cover;border-radius:36px">
  <div class="abs" style="left:80px;width:540px;top:96px;bottom:80px;display:flex;flex-direction:column">
    <p class="eb">Гид для мужчин</p>
    <h1 style="font:300 60px/1.08 CG,serif;margin-top:22px;text-wrap:balance">${esc(nbsp(title))}</h1>
    <div style="margin-top:auto;display:flex;align-items:flex-end;gap:24px">
      ${mark(brand, 34)}
      <span style="font:400 19px/1 MR,sans-serif;color:rgba(233,225,211,.72);padding-bottom:3px">${esc(minutes)}</span>
    </div>
  </div>`);

// ─── Снимки ─────────────────────────────────────────────────────────────────

function shoot(html, out, workDir, slot) {
  const src = join(workDir, `${slot}-${Math.random().toString(36).slice(2, 8)}.html`);
  const png = `${src}.png`;
  writeFileSync(src, html);
  return new Promise((resolve, reject) => {
    execFile(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
      '--allow-file-access-from-files', `--user-data-dir=${join(workDir, `profile-${slot}`)}`,
      `--window-size=${W},${H}`, '--force-device-scale-factor=1', '--virtual-time-budget=4000',
      `--screenshot=${png}`, url(src),
    ], { timeout: 60000 }, async (err) => {
      if (err || !existsSync(png)) return reject(err ?? new Error('Chrome не сделал снимок'));
      try {
        await sharp(png).resize(W, H, { fit: 'cover', position: 'top' }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
        resolve();
      } catch (e) { reject(e); }
    });
  });
}

/** Задания по несколько разом: каждый Chrome — со своим профилем. */
async function runAll(jobs, label) {
  const done = new Set();
  if (!jobs.length) return done;
  if (!CHROME) {
    console.warn(`  ${label}: пропущены — не найден Chrome (задайте CHROME_PATH)`);
    return done;
  }
  const workDir = join(tmpdir(), `nd-og-${process.pid}`);
  mkdirSync(workDir, { recursive: true });
  let next = 0, failures = 0;
  const worker = async (slot) => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        await shoot(job.html, job.out, workDir, slot);
        done.add(job.key);
      } catch (e) {
        failures++;
        if (failures <= 3) console.warn(`  ${label} ${job.key}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, (_, i) => worker(i)));
  rmSync(workDir, { recursive: true, force: true });
  console.log(`  ${label}: ${done.size} готово${failures ? `, ${failures} пропущено` : ''}`);
  return done;
}

/**
 * По картинке на модель и огранку + обложка бренда в <dist>/assets/og/.
 * Возвращает ключи готовых картинок (`<файл рендера>-<огранка>` и 'default'),
 * чтобы страницы ссылались только на то, что получилось.
 */
export async function generateOgCards({ dist, combos, shapes, modelSlug }) {
  const outDir = join(dist, 'assets', 'og');
  mkdirSync(outDir, { recursive: true });
  const brand = join(dist, 'assets', 'taena');
  const jobs = [];
  for (const [, , model] of combos) {
    const mslug = modelSlug[model];
    if (!mslug) continue;
    for (const [shapeId, shapeLabel] of shapes) {
      const ring = join(dist, 'assets', 'rings', `${mslug}-${shapeId}.webp`);
      if (!existsSync(ring)) continue;
      const key = `${mslug}-${shapeId}`;
      jobs.push({ key, out: join(outDir, `${key}.jpg`), html: modelHtml({ brand, ring, name: model, shape: shapeLabel }) });
    }
  }
  // Обложка бренда — для ленты, каталога и всего, у чего нет своей картинки.
  const photo = join(brand, 'hero-oval.webp');
  jobs.push({ key: 'default', out: join(outDir, 'default.jpg'), html: brandHtml({ brand, photo: existsSync(photo) ? photo : null }) });
  return runAll(jobs, 'og-карточки');
}

const GUIDE_RING = { secret: 'halo-round', anatomy: 'sirius-oval', tomorrow: 'neo-oval' };

/** По карточке на гид в <dist>/assets/og/guide-<slug>.jpg. Возвращает готовые slug. */
export async function generateGuideCards({ dist, guides, minutesLabel }) {
  const outDir = join(dist, 'assets', 'og');
  mkdirSync(outDir, { recursive: true });
  const brand = join(dist, 'assets', 'taena');
  const jobs = guides.flatMap(g => {
    const ring = join(dist, 'assets', 'rings', `${GUIDE_RING[g.cover] ?? 'neo-halo-round'}.webp`);
    if (!existsSync(ring)) return [];
    return [{ key: g.slug, out: join(outDir, `guide-${g.slug}.jpg`), html: guideHtml({ brand, ring, title: g.title, minutes: `${minutesLabel(g.minutes)} чтения` }) }];
  });
  return runAll(jobs, 'og-карточки гидов');
}
