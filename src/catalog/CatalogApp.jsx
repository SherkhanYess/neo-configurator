import { useState, useEffect, useRef } from 'react';
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

export default function App() {
  if (new URLSearchParams(window.location.search).has('admin')) {
    return <AdminScreen />;
  }

  const [screen,  setScreen]  = useState('filter');
  const [shapes,  setShapes]  = useState([]);
  const [detail,  setDetail]  = useState(null);
  const [booking, setBooking] = useState(null);

  // iJewel lives here — one instance, one canvas, never unmounts
  const ijewel         = useIjewel();
  const viewerRef      = useRef(null);
  const viewerInitRef  = useRef(false);

  const showViewer = screen === 'detail' || screen === 'booking';

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

  function pickShapes(s)  { setShapes(s); setScreen('catalog'); }
  function openDetail(p)  {
    setDetail(p);
    ijewel.resetConfigured(); // show loader while new card's shape/shank apply
    ijewel.fitScene();        // reset camera to default position
    setScreen('detail');
  }
  function openBooking(d) {
    setBooking(d);
    // don't reset isConfigured — ring is already shown correctly from DetailScreen
    setScreen('booking');
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Persistent viewer — always in DOM so WebGL canvas never moves ── */}
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

        {screen === 'detail' && (
          <button style={BACK_BTN} onClick={() => setScreen('catalog')}>‹ Назад</button>
        )}
        {screen === 'booking' && (
          <button style={BACK_BTN} onClick={() => setScreen('detail')}>‹ Назад</button>
        )}
      </div>

      {/* ── Screens ──────────────────────────────────────────────────────── */}
      {screen === 'filter' && (
        <FilterScreen onConfirm={pickShapes} />
      )}
      {screen === 'catalog' && (
        <CatalogScreen
          activeShapes={shapes}
          onChangeShapes={() => setScreen('filter')}
          onOpen={openDetail}
        />
      )}
      {screen === 'detail' && detail && (
        <DetailScreen
          initial={detail}
          ijewel={ijewel}
          onBack={() => setScreen('catalog')}
          onBook={openBooking}
        />
      )}
      {screen === 'booking' && booking && (
        <BookingScreen
          initial={booking}
          ijewel={ijewel}
          onBack={() => setScreen('detail')}
        />
      )}
    </div>
  );
}
