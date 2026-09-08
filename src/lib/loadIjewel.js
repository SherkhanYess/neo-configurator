// Loads the iJewel 3D SDK on demand.
//
// The two bundles weigh ~4.2 MB together. They used to sit in index.html as
// render-blocking <script> tags, so every visitor paid for them even on screens
// with no 3D at all — the shape filter, the catalog grid, the booking page.
// Now they load only when a viewer is actually about to mount.
//
// Order matters: mini-viewer is the "nowebgi" build and expects the webgi
// bundle to already be on the page.

const SCRIPTS = [
  'https://releases.ijewel3d.com/libs/webgi-v0/bundle-0.22.0.js',
  'https://releases.ijewel3d.com/libs/mini-viewer/0.6.8/bundle.nowebgi.iife.js',
];

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const el = document.createElement('script');
    el.src = src;
    el.async = false; // preserve execution order across both bundles
    el.addEventListener('load', () => { el.dataset.loaded = 'true'; resolve(); }, { once: true });
    el.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(el);
  });
}

// Memoised so concurrent callers share one download.
let loadPromise = null;

export function loadIjewelSDK() {
  if (window.ijewelViewer) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    for (const src of SCRIPTS) {
      await injectScript(src);
    }
  })();

  // Let a failed attempt be retried rather than poisoning every later call.
  loadPromise.catch(() => { loadPromise = null; });

  return loadPromise;
}
