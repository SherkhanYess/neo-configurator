import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';
import AdminPage from './admin/AdminPage.jsx';
import SharePage from './share/SharePage.jsx';
import CatalogApp from './catalog/CatalogApp.jsx';

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin') return <AdminPage />;
  if (path === '/share') return <SharePage />;
  if (path.startsWith('/catalog')) return <CatalogApp />;
  return <ConfiguratorPage />;
}
