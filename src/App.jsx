import { lazy, Suspense } from 'react';
import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';
import AdminPage from './admin/AdminPage.jsx';
import SharePage from './share/SharePage.jsx';

// На сайте каталог и его админка открываются со своего входа (catalog-shell.html,
// src/catalog-main.jsx). Здесь они остаются для локальной разработки и
// грузятся отдельно — конструктору их код не нужен.
const StudioApp = lazy(() => import('./studio/StudioApp.jsx'));
const CatalogApp = lazy(() => import('./catalog/CatalogApp.jsx'));

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin') return <AdminPage />;
  if (path === '/share') return <SharePage />;
  if (path === '/catalog/admin' || path.startsWith('/catalog/admin/')) {
    return <Suspense fallback={null}><StudioApp /></Suspense>;
  }
  if (path.startsWith('/catalog')) return <Suspense fallback={null}><CatalogApp /></Suspense>;
  return <ConfiguratorPage />;
}
