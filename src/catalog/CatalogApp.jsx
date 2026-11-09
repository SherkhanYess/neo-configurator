import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SHAPES } from './data/config.js';
import { useProductsState } from './data/products.js';
import { productPath, ringOf, shankFromSlug } from './data/models.js';
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


/** Адрес модели проверяем до страницы: несуществующая (или удалённая в
 *  админке) модель или огранка уводит в ленту, а не оставляет пустую страницу
 *  с вечной загрузкой 3D. Модель, добавленную в админке, код не знает — пока
 *  список не пришёл с сервера, ждём, а не уводим. */
function ProductRoute({ ijewel }) {
  const { shank, cast, shape } = useParams();
  const [products, loaded] = useProductsState();
  const shankId = shankFromSlug(products, shank);
  const known = shankId && ringOf(products, shankId, cast) && SHAPES.some(s => s.id === shape);
  if (known) return <DetailScreen ijewel={ijewel} />;
  if (!loaded) return null;
  return <Navigate to="/" replace />;
}

function BookingRedirect() {
  const location = useLocation();
  const cfg = decodeBooking(location.search);
  if (!cfg?.shank || cfg.type === 'pusety') return <Navigate to="/" replace />;
  const q = cfg.carat ? `?ct=${cfg.carat}` : '';
  return <Navigate to={productPath(cfg.shank, cfg.cast, cfg.shape) + q} replace />;
}

/** Старые адреса с /catalog — с тех пор, как витрина жила в подпапке. Сервер
 *  перекидывает их сам (_redirects); это — на случай перехода внутри сайта. */
function LegacyCatalog() {
  const location = useLocation();
  const to = (location.pathname.replace(/^\/catalog/, '') || '/') + location.search;
  return <Navigate to={to} replace />;
}

function CatalogMain() {
  const location = useLocation();
  const navigate = useNavigate();

  // 3D-просмотр живёт здесь, а не на странице модели: переходя от модели к
  // модели, человек не ждёт загрузку сцены заново.
  const showViewer = location.pathname.startsWith('/product');

  // Прогрев: сразу после загрузки ленты сцену 3D поднимаем заранее — за
  // краем экрана, невидимо, на любой сети и любом телефоне (решение владельца,
  // 10.11.2026: на сайте сидят 5–15 минут, скорость модели важнее). Лента
  // ещё и подставляет шинку модели, на которой человек задержался
  // (onPrepare). Все шаги открытия модели (двойная подстановка, поза камеры,
  // пауза перед показом) — те же, они идут уже на странице модели.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (showViewer || warm) return;
    let timer;
    const start = () => { timer = setTimeout(() => setWarm(true), 300); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener('load', start); };
  }, [showViewer, warm]);
  const sceneWanted = showViewer || warm;

  // 3D-скрипты: на странице модели и при прогреве — подключаем, иначе на ленте
  // только тихо качаем в кэш. Не загрузились — сразу честно говорим об этом.
  const [scriptsFailed, setScriptsFailed] = useState(false);
  useEffect(() => {
    if (sceneWanted) loadIjewel().then(() => setScriptsFailed(false), () => setScriptsFailed(true));
    else prefetchIjewel();
  }, [sceneWanted]);

  const ijewel        = useIjewel(RING_FILE_ID);
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
    if (showViewer) ijewel.resetConfigured();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Сцена создаётся один раз — при первом заходе на страницу модели, как
  // только догрузились скрипты 3D. Ушли со страницы раньше — ждать перестаём
  // (и начнём заново при следующем заходе); скрипт так и не пришёл — через
  // минуту тоже перестаём, надпись «Не удалось загрузить 3D» уже стоит.
  useEffect(() => {
    if (!sceneWanted || !viewerRef.current || viewerInitRef.current) return;
    let timer, tries = 0;
    const tryInit = () => {
      if (window.ijewelViewer) {
        viewerInitRef.current = true;
        ijewel.init(viewerRef.current);
      } else if (++tries < 300) {
        timer = setTimeout(tryInit, 200);
      }
    };
    tryInit();
    return () => clearTimeout(timer);
  }, [sceneWanted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Рисует сцена только на странице модели. Прогретую — даём дорисовать
  // первый кадр (шейдеры компилируются один раз, это тоже часть прогрева),
  // потом усыпляем.
  useEffect(() => {
    if (!ijewel.isReady) return;
    if (showViewer) { ijewel.setRendering(true); return; }
    const t = setTimeout(() => ijewel.setRendering(false), 2500);
    return () => clearTimeout(t);
  }, [ijewel.isReady, showViewer]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div
        className={`cfg-viewer-panel${sceneWanted ? ' mp-viewer' : ''}`}
        // На ленте сцена (прогретая) живёт за краем экрана — того же размера,
        // что на странице модели, чтобы камера встала так же. Нет сцены — нет и блока.
        style={showViewer ? { position: 'relative', flexShrink: 0 }
          : warm ? { position: 'fixed', left: '-200vw', top: 0, width: 'min(536px, calc(100vw - 24px))', margin: 0, visibility: 'hidden', pointerEvents: 'none' }
            : { display: 'none' }}
        aria-hidden={showViewer ? undefined : true}
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
                {(scriptsFailed || viewerStalled) && !ijewel.isConfigured
                  ? 'Не удалось загрузить 3D-просмотр. Характеристики и цена — ниже.'
                  : 'Загрузка украшения...'}
              </p>
            </div>
          </div>
        )}

        {showViewer && (
          // «Назад» — в ленту, если на сайт пришли прямо на модель (из рекламы,
          // по ссылке): history.length считает и чужие сайты, и человек ушёл бы
          // обратно в Instagram. location.key 'default' — первая страница визита.
          <button type="button" className="mp-back" onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/'))}>
            <svg width="7" height="12" viewBox="0 0 8 12" aria-hidden="true"><path d="M7 1L2 6l5 5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/></svg>
            Назад
          </button>
        )}
      </div>

      <Routes>
        <Route path="/"                                   element={<FeedScreen onPrepare={ijewel.prepare} />} />
        {/* Выбор формы на входе и список из девяноста карточек заменены лентой.
            Адреса остаются рабочими: они разосланы в рекламе и в сторис. */}
        <Route path="/filter"                            element={<Navigate to="/" replace />} />
        <Route path="/list"                              element={<Navigate to="/" replace />} />
        <Route path="/product/:shank/:cast/:shape"       element={<ProductRoute ijewel={ijewel} />} />
        {/* Пусет на витрине больше нет, но разосланные ссылки не должны
            упираться в пустую страницу — уводим в каталог. */}
        <Route path="/pusety/*"                          element={<Navigate to="/" replace />} />
        {/* «Ваш выбор» слит со страницей модели. Разосланные ссылки ведут на ту
            же модель, форму и каратность. */}
        <Route path="/booking"                           element={<BookingRedirect />} />
        <Route path="/guides/:slug"                       element={<Suspense fallback={<div style={{ minHeight: '100dvh' }} />}><GuideScreen /></Suspense>} />
        <Route path="/guides"                             element={<Navigate to="/" replace />} />
        <Route path="/catalog/*"                          element={<LegacyCatalog />} />
        <Route path="*"                                   element={<Navigate to="/" replace />} />
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
