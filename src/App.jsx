import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';
import AdminPage from './admin/AdminPage.jsx';
import SharePage from './share/SharePage.jsx';

export default function App() {
  if (window.location.pathname === '/admin') return <AdminPage />;
  if (window.location.pathname === '/share') return <SharePage />;
  return <ConfiguratorPage />;
}
