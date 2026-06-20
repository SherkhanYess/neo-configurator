import { lazy, Suspense } from 'react';
import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';

const AdminPage = lazy(() => import('./admin/AdminPage.jsx'));
const SharePage = lazy(() => import('./share/SharePage.jsx'));

const Fallback = () => <div style={{ color: '#fff', padding: 40 }}>Загрузка…</div>;

export default function App() {
  if (window.location.pathname === '/admin') {
    return (
      <Suspense fallback={<Fallback />}>
        <AdminPage />
      </Suspense>
    );
  }
  if (window.location.pathname === '/share') {
    return (
      <Suspense fallback={<Fallback />}>
        <SharePage />
      </Suspense>
    );
  }
  return <ConfiguratorPage />;
}
