import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Витрина aena живёт в корне своего домена (aena.neodiamond.kz): лента — «/»,
// модели — «/product/…», гиды — «/guides/…», админка — «/admin». Вход один —
// catalog-shell.html. Конструктор (index.html, src/configurator) на этом
// сайте не нужен и не собирается; его код не тронут, он живёт на
// con.neodiamond.kz из основной ветки.

/** В разработке любой адрес страницы отдаёт вход витрины — как _redirects на Netlify. */
function catalogShellInDev() {
  return {
    name: 'catalog-shell-in-dev',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        const path = url.split('?')[0];
        // netlify dev находит готовые страницы в dist (index.html, product/….html)
        // и просит их у Vite по имени файла — их тоже отдаём входом витрины.
        const isPage = req.method === 'GET' && (req.headers.accept ?? '').includes('text/html')
          && !path.startsWith('/@') && !path.startsWith('/api/') && path !== '/catalog-shell.html'
          && (!/\.[a-z0-9]+$/i.test(path) || path.endsWith('.html'));
        if (isPage) req.url = '/catalog-shell.html';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), catalogShellInDev()],
  build: {
    rollupOptions: {
      input: { catalog: 'catalog-shell.html' },
    },
  },
  server: {
    // Honour an externally assigned port (dev tooling, CI) instead of always
    // grabbing 5173 and drifting to 5174 when that is taken.
    port: Number(process.env.PORT) || 5173,
  },
})
