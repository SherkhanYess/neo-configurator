import { lazy, Suspense } from 'react';
import ConfiguratorPage from './configurator/ConfiguratorPage.jsx';

const AdminPage = lazy(() => import('./admin/AdminPage.jsx'));

export default function App() {
  if (window.location.pathname === '/admin') {
    return (
      <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>Загрузка…</div>}>
        <AdminPage />
      </Suspense>
    );
  }
  return <ConfiguratorPage />;
}
