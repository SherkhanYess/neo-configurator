import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { VALID_COMBOS, SHAPES } from './data/config.js';
import FeedScreen         from './screens/FeedScreen.jsx';
import DetailScreen       from './screens/DetailScreen.jsx';
import SiteFooter         from './components/SiteFooter.jsx';

// Гиды — отдельный кусок кода: ленте и странице модели он не нужен.
const GuideScreen = lazy(() => import('./screens/GuideScreen.jsx'));
import { useIjewel, RING_FILE_ID } from './hooks/useIjewel.js';
import { track, EVENTS } from './lib/track.js';
import { REVEAL_TIMEOUT_MS } from './lib/useContentReveal.js';
import { decodeBooking } from './lib/bookingUrl.js';
import { loadIjewel, prefetchIjewel } from './lib/ijewelLoader.js';
import './index.css';
import './configurator.css';


/** Адрес модели проверяем до страницы: несуществующая модель или огранка
 *  уводит в ленту, а не оставляет пустую страницу с вечной загрузкой 3D. */
function ProductRoute({ ijewel }) {
  const { shank, cast, shape } = useParams();
  const known = VALID_COMBOS.some(c => c.shank.toLowerCase().replace(/\s+/g, '-') === shank && c.cast === cast)
             && SHAPES.some(s => s.id === shape);
  return known ? <DetailScreen ijewel={ijewel} /> : <Navigate to="/catalog" replace />;
}

function BookingRedirect() {
  const location = useLocation();
  const cfg = decodeBooking(location.search);
  if (!cfg?.shank || cfg.type === 'pusety') return <Navigate to="/catalog" replace />;
  const slug = cfg.shank.toLowerCase().replace(/\s+/g, '-');
  const q = cfg.carat ? `?ct=${cfg.carat}` : '';
  return <Navigate to={`/catalog/product/${slug}/${cfg.cast}/${cfg.shape}${q}`} replace />;
}

function CatalogMain() {
  const location = useLocation();
  const navigate = useNavigate();

  const subPath      = location.pathname.replace(/^\/catalog/, '') || '/';
  const onRingProduct  = subPath.startsWith('/product');

  const showViewer = onRingProduct;

  // 3D — только там, где оно есть: на странице модели скрипты подключаются,
  // на ленте — тихо скачиваются в кэш, пока человек листает.
  useEffect(() => {
    if (showViewer) loadIjewel().catch(() => {});
    else prefetchIjewel();
  }, [showViewer]);

  // Which iJewel model to load. On the booking screen the route says nothing
  // about the category, so the answer comes from the shared configuration —
  // Категория одна — кольца, поэтому выбирать файл модели больше не из чего.
  const fileId = RING_FILE_ID;

  const ijewel        = useIjewel(fileId);
  const viewerRef     = useRef(null);
  const viewerInitRef = useRef(false);

  // Tracks the same grace period the product card uses, so a 3D load that
  // never lands stops promising one.
  const [viewerStalled, setViewerStalled] = useState(false);
  useEffect(() => {
    setViewerStalled(false);
    if (!showViewer) return;
    const t = setTimeout(() => setViewerStalled(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [location.pathname, showViewer]);

  // Top of the funnel: one per tab session, whichever catalog screen was entered first.
  useEffect(() => {
    track(EVENTS.SESSION_START, {}, { once: true });
  }, []);

  // Reset isConfigured synchronously before paint when entering a product page
  useLayoutEffect(() => {
    if (onRingProduct) ijewel.resetConfigured();
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
        className={`cfg-viewer-panel${onRingProduct ? ' mp-viewer' : ''}`}
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
              <p className="cfg-viewer-loader-text">
                {viewerStalled && !ijewel.isConfigured
                  ? 'Не удалось загрузить 3D-просмотр. Характеристики и цена — ниже.'
                  : 'Загрузка украшения...'}
              </p>
            </div>
          </div>
        )}

        {showViewer && (
          <button type="button" className="mp-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/catalog'))}>
            <svg width="7" height="12" viewBox="0 0 8 12" aria-hidden="true"><path d="M7 1L2 6l5 5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/></svg>
            Назад
          </button>
        )}
      </div>

      <Routes>
        <Route path="/catalog"                                   element={<FeedScreen />} />
        {/* Выбор формы на входе и список из девяноста карточек заменены лентой.
            Адреса остаются рабочими: они разосланы в рекламе и в сторис. */}
        <Route path="/catalog/filter"                            element={<Navigate to="/catalog" replace />} />
        <Route path="/catalog/list"                              element={<Navigate to="/catalog" replace />} />
        <Route path="/catalog/product/:shank/:cast/:shape"       element={<ProductRoute ijewel={ijewel} />} />
        {/* Пусет на витрине больше нет, но разосланные ссылки не должны
            упираться в пустую страницу — уводим в каталог. */}
        <Route path="/catalog/pusety/*"                          element={<Navigate to="/catalog" replace />} />
        {/* «Ваш выбор» слит со страницей модели. Разосланные ссылки ведут на ту
            же модель, форму и каратность. */}
        <Route path="/catalog/booking"                           element={<BookingRedirect />} />
        <Route path="/catalog/guides/:slug"                       element={<Suspense fallback={<div style={{ minHeight: '100dvh' }} />}><GuideScreen /></Suspense>} />
        <Route path="/catalog/guides"                             element={<Navigate to="/catalog" replace />} />
      </Routes>

      <SiteFooter />
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
