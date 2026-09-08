import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import FilterScreen       from './screens/FilterScreen.jsx';
import CatalogScreen      from './screens/CatalogScreen.jsx';
import DetailScreen       from './screens/DetailScreen.jsx';
import BookingScreen      from './screens/BookingScreen.jsx';
import AdminScreen        from './screens/AdminScreen.jsx';
import PusetyDetailScreen from './screens/PusetyDetailScreen.jsx';
import { useIjewel, RING_FILE_ID, PUSETЫ_FILE_ID } from './hooks/useIjewel.js';
import { track, EVENTS } from './lib/track.js';
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

function CatalogMain() {
  const location = useLocation();
  const navigate = useNavigate();

  const subPath      = location.pathname.replace(/^\/catalog/, '') || '/';
  const onRingProduct  = subPath.startsWith('/product');
  const onPusetyProduct = subPath.startsWith('/pusety/product');
  const onBooking      = subPath.startsWith('/booking');

  const showViewer = onRingProduct || onPusetyProduct || onBooking;

  // Determine which iJewel model to load based on current route
  const fileId = onPusetyProduct ? PUSETЫ_FILE_ID : RING_FILE_ID;

  const ijewel        = useIjewel(fileId);
  const viewerRef     = useRef(null);
  const viewerInitRef = useRef(false);

  // Top of the funnel: one per tab session, whichever catalog screen was entered first.
  useEffect(() => {
    track(EVENTS.SESSION_START, {}, { once: true });
  }, []);

  // Reset isConfigured synchronously before paint when entering a product page
  useLayoutEffect(() => {
    if (onRingProduct || onPusetyProduct) ijewel.resetConfigured();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // When fileId changes (category switch), force re-init on next showViewer
  const prevFileIdRef = useRef(fileId);
  useEffect(() => {
    if (prevFileIdRef.current !== fileId) {
      prevFileIdRef.current = fileId;
      viewerInitRef.current = false;
    }
  }, [fileId]);

  // Init viewer when entering a product page; re-init when category changes
  useEffect(() => {
    if (!showViewer || !viewerRef.current) return;
    if (viewerInitRef.current) return;

    const tryInit = () => {
      if (window.ijewelViewer) {
        viewerInitRef.current = true;
        ijewel.init(viewerRef.current);
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }, [showViewer, fileId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="cfg-viewer-panel"
        style={{ display: showViewer ? undefined : 'none', position: 'relative', flexShrink: 0 }}
      >
        <div
          ref={viewerRef}
          className="cfg-viewer-container"
          style={!ijewel.isConfigured && showViewer ? { visibility: 'hidden' } : undefined}
        />

        {!ijewel.isConfigured && showViewer && (
          <div className="cfg-viewer-loader">
            <div className="cfg-viewer-loader-inner">
              <p className="cfg-viewer-loader-text">Загрузка украшения...</p>
            </div>
          </div>
        )}

        {showViewer && (
          <button style={BACK_BTN} onClick={() => navigate(-1)}>‹ Назад</button>
        )}
      </div>

      <Routes>
        <Route path="/catalog"                                   element={<FilterScreen />} />
        <Route path="/catalog/filter"                            element={<FilterScreen />} />
        <Route path="/catalog/list"                              element={<CatalogScreen />} />
        <Route path="/catalog/product/:shank/:cast/:shape"       element={<DetailScreen ijewel={ijewel} />} />
        <Route path="/catalog/pusety/product/:cast/:shape"       element={<PusetyDetailScreen ijewel={ijewel} />} />
        <Route path="/catalog/booking"                           element={<BookingScreen />} />
        <Route path="/catalog/admin"                             element={<AdminScreen />} />
      </Routes>
    </div>
  );
}

export default function CatalogApp() {
  return (
    <BrowserRouter>
      <CatalogMain />
    </BrowserRouter>
  );
}
