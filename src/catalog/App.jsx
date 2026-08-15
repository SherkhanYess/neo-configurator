import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import FilterScreen  from './screens/FilterScreen.jsx';
import CatalogScreen from './screens/CatalogScreen.jsx';
import DetailScreen  from './screens/DetailScreen.jsx';
import BookingScreen from './screens/BookingScreen.jsx';
import AdminScreen   from './screens/AdminScreen.jsx';
import { useIjewel } from './hooks/useIjewel.js';
import './index.css';
import './configurator.css';

const BACK_BTN = {
  position: 'absolute', top: 14, left: 14, zIndex: 10,
  background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
  backdropFilter: 'blur(8px)', borderRadius: 20,
  padding: '0 14px', height: 34, display: 'flex', alignItems: 'center', gap: 4,
  color: '#fff', cursor: 'pointer',
  fontFamily: 'var(--font-body, Manrope, sans-serif)',
  fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.01em',
};

function MainApp() {
  const location = useLocation();
  const navigate  = useNavigate();
  const ijewel        = useIjewel();
  const viewerRef     = useRef(null);
  const viewerInitRef = useRef(false);

  const onProduct = location.pathname.startsWith('/product');
  const onBooking = location.pathname.startsWith('/booking');
  const showViewer = onProduct || onBooking;

  useEffect(() => {
    if (!showViewer || viewerInitRef.current || !viewerRef.current) return;
    const tryInit = () => {
      if (window.ijewelViewer) {
        viewerInitRef.current = true;
        ijewel.init(viewerRef.current);
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }, [showViewer]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBack() {
    navigate(-1);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Persistent viewer - always in DOM, hidden when not needed */}
      <div
        className="cfg-viewer-panel"
        style={{ display: showViewer ? undefined : 'none', position: 'relative', flexShrink: 0 }}
      >
        <div ref={viewerRef} className="cfg-viewer-container" />

        {!ijewel.isConfigured && showViewer && (
          <div className="cfg-viewer-loader">
            <div className="cfg-viewer-loader-inner">
              <p className="cfg-viewer-loader-text">Загрузка украшения...</p>
            </div>
          </div>
        )}

        {showViewer && (
          <button style={BACK_BTN} onClick={handleBack}>‹ Назад</button>
        )}
      </div>

      <Routes>
        <Route path="/"        element={<FilterScreen />} />
        <Route path="/catalog" element={<CatalogScreen />} />
        <Route path="/product/:shank/:cast/:shape" element={<DetailScreen ijewel={ijewel} />} />
        <Route path="/booking" element={<BookingScreen />} />
        <Route path="/admin"   element={<AdminScreen />} />
      </Routes>
    </div>
  );
}

// Wrapper so hooks in MainApp are never called conditionally
export default function App() {
  return <MainApp />;
}
