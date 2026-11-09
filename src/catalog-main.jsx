import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import CatalogApp from './catalog/CatalogApp.jsx';

// Вход витрины taena (taena.neodiamond.kz): лента в корне, модели, гиды и
// админка /admin. Отдельный от конструктора (src/main.jsx), который живёт на
// con.neodiamond.kz: витрине не нужны ни его код, ни 4 МБ скриптов 3D в шапке —
// 3D подтягивается, когда человек открывает модель.

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
const isStudio = path === '/admin' || path.startsWith('/admin/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isStudio ? <Suspense fallback={null}><StudioApp /></Suspense> : <CatalogApp />}
  </StrictMode>,
);
