import { lazy, Suspense } from 'react';
import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';
import AdminPage from './admin/AdminPage.jsx';
import SharePage from './share/SharePage.jsx';
import CatalogApp from './catalog/CatalogApp.jsx';

// Админка каталога — отдельное приложение: грузится только тем, кто в неё зашёл.
const StudioApp = lazy(() => import('./studio/StudioApp.jsx'));

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin') return <AdminPage />;
  if (path === '/share') return <SharePage />;
  if (path === '/catalog/admin' || path.startsWith('/catalog/admin/')) {
    return <Suspense fallback={null}><StudioApp /></Suspense>;
  }
  if (path.startsWith('/catalog')) return <CatalogApp />;
  return <ConfiguratorPage />;
}
