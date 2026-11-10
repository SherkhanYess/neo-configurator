import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './catalog/base.css';
import CatalogApp from './catalog/CatalogApp.jsx';
import { captureUtm } from './catalog/lib/utmStore.js';

// Вход витрины taena (taena.neodiamond.kz): лента в корне, модели, гиды и
// админка /admin. Отдельный от конструктора (src/main.jsx), который живёт на
// con.neodiamond.kz: витрине не нужны ни его код, ни 4 МБ скриптов 3D в шапке —
// 3D подтягивается, когда человек открывает модель.

const StudioApp = lazy(() => import('./studio/StudioApp.jsx'));

// Метки UTM: на визит и на 30 дней (правила — lib/utmStore.js).
try {
  captureUtm({ search: window.location.search, session: window.sessionStorage, local: window.localStorage });
} catch { /* хранилище недоступно — визит без меток */ }

const path = window.location.pathname;
const isStudio = path === '/admin' || path.startsWith('/admin/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isStudio ? <Suspense fallback={null}><StudioApp /></Suspense> : <CatalogApp />}
  </StrictMode>,
);
