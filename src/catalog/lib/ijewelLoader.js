// Скрипты 3D-просмотра iJewel (~4 МБ) — по требованию.
//
// Раньше они стояли в шапке каждой страницы каталога и держали отрисовку:
// лента не показывалась, пока не скачается и не выполнится 3D, которого на
// ленте нет. Теперь:
//   — на ленте, когда страница уже показана и браузер свободен, скрипты
//     тихо скачиваются в кэш (prefetch), но не выполняются;
//   — при нажатии на модель и на странице модели — подключаются по-настоящему.
// Mini-viewer работает поверх webgi, поэтому порядок строгий.

const SCRIPTS = [
  'https://releases.ijewel3d.com/libs/webgi-v0/bundle-0.22.0.js',
  'https://releases.ijewel3d.com/libs/mini-viewer/0.6.8/bundle.nowebgi.iife.js',
];

let loading = null;

function inject(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1' || window.ijewelViewer) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`не загрузился ${src}`)), { once: true });
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = () => { el.dataset.loaded = '1'; resolve(); };
    el.onerror = () => { loading = null; reject(new Error(`не загрузился ${src}`)); };
    document.head.appendChild(el);
  });
}

/** Подключает 3D. Повторный вызов возвращает тот же промис. */
export function loadIjewel() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.ijewelViewer) return Promise.resolve();
  if (!loading) loading = SCRIPTS.reduce((p, src) => p.then(() => inject(src)), Promise.resolve());
  return loading;
}

let prefetched = false;

/** Скачивает скрипты в кэш, не выполняя, — когда браузер свободен. */
export function prefetchIjewel() {
  if (prefetched || typeof window === 'undefined' || window.ijewelViewer) return;
  // Экономия трафика или медленная сеть — не качаем 4 МБ впрок.
  const c = navigator.connection;
  if (c?.saveData || /2g/.test(c?.effectiveType ?? '')) return;
  prefetched = true;
  const run = () => SCRIPTS.forEach(href => {
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.as = 'script';
    l.href = href;
    document.head.appendChild(l);
  });
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
  if (document.readyState === 'complete') idle(run, { timeout: 4000 });
  else window.addEventListener('load', () => idle(run, { timeout: 4000 }), { once: true });
}
