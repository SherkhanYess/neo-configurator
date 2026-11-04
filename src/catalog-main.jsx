import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import CatalogApp from './catalog/CatalogApp.jsx';

// Вход для страниц /catalog — отдельный от конструктора (src/main.jsx).
//
// Каталогу не нужны ни код конструктора, ни 4 МБ скриптов 3D в шапке
// страницы: со своим входом лента грузит только себя, а 3D подтягивается,
// когда человек открывает модель. Конструктор на корне сайта не меняется —
// у него свой index.html и свой вход.

const StudioApp = lazy(() => import('./studio/StudioApp.jsx'));

// Метки UTM запоминаем на визит, чтобы они не терялись при переходах.
(function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => {
      if (p.get(k)) utm[k] = p.get(k);
    });
    if (Object.keys(utm).length) sessionStorage.setItem('nd_utm', JSON.stringify(utm));
  } catch { /* приватный режим */ }
})();

const path = window.location.pathname;
const isStudio = path === '/catalog/admin' || path.startsWith('/catalog/admin/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isStudio ? <Suspense fallback={null}><StudioApp /></Suspense> : <CatalogApp />}
  </StrictMode>,
);
