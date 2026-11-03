import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { api, checkPassword, clearToken, getToken, setToken, UNAUTHORIZED } from './api.js';
import { Svg, ToastProvider } from './ui.jsx';
import { STAFF_KEY } from '../catalog/lib/track.js';
import FeedEditor from './sections/FeedEditor.jsx';
import HintsView from './sections/HintsView.jsx';
import ReviewsEditor from './sections/ReviewsEditor.jsx';
import AnalyticsView from './sections/AnalyticsView.jsx';
import CatalogEditor from './sections/CatalogEditor.jsx';
import LinksView from './sections/LinksView.jsx';
import '../catalog/index.css';
import './studio.css';

// Админка витрины — /catalog/admin.
//
// Отдельное приложение: витрина его не грузит, а оно не трогает ни витрину,
// ни конструктор. Всё, что здесь сохраняется, сайт подхватывает сразу, без
// пересборки: лента и отзывы — /api/content, фото — /api/media, цены и модели —
// прежние /api/set-prices и /api/set-products.
//
// На компьютере — боковое меню, на телефоне — нижнее.

const BASE = '/catalog/admin';

const NAV = [
  { to: 'feed',    label: 'Лента',     icon: 'feed' },
  { to: 'hints',   label: 'Намёки',    icon: 'hints' },
  { to: 'reviews', label: 'Отзывы',    icon: 'reviews' },
  { to: 'stats',   label: 'Аналитика', icon: 'stats' },
  { to: 'catalog', label: 'Модели и цены', short: 'Цены', icon: 'catalog' },
  { to: 'links',   label: 'Ссылки',    icon: 'links' },
];

function Login({ onDone }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true); setError('');
    try {
      if (await checkPassword(v)) { setToken(v); onDone(); }
      else setError('Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.');
    } catch {
      setError('Нет связи с сервером. Проверьте интернет.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st-login">
      <form className="st-login__card" onSubmit={submit}>
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="st-login__logo" />
        <h1 className="st-h1">Админка витрины</h1>
        <p className="st-sub">Лента, фото, намёки, отзывы и цены — всё, что видит покупатель на сайте.</p>
        <input
          className="st-input"
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          autoFocus
        />
        {error && <p className="st-login__err" role="alert">{error}</p>}
        <button type="submit" className="st-btn st-btn--primary st-btn--wide" disabled={busy}>
          {busy ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

function Shell({ onLogout }) {
  const location = useLocation();
  const [newHints, setNewHints] = useState(0);

  // Счётчик новых намёков у пункта меню — их не должно быть видно только
  // тому, кто специально зашёл в раздел.
  const refreshHints = useCallback(() => {
    api('/api/hint').then(list => setNewHints(list.filter(h => (h.status ?? 'new') === 'new').length)).catch(() => {});
  }, []);
  useEffect(() => { refreshHints(); }, [refreshHints, location.pathname]);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="st-app">
      <aside className="st-rail">
        <div className="st-rail__brand">
          <img src="/assets/logo-ink.png" alt="Neo Diamond" />
          <span>Витрина</span>
        </div>
        <nav className="st-rail__nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={`${BASE}/${n.to}`} className={({ isActive }) => `st-rail__link${isActive ? ' is-active' : ''}`}>
              <Svg name={n.icon} />
              <span>{n.label}</span>
              {n.to === 'hints' && newHints > 0 && <b className="st-badge">{newHints}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="st-rail__foot">
          <a className="st-rail__link" href="/catalog" target="_blank" rel="noopener noreferrer">
            <Svg name="ext" /><span>Открыть сайт</span>
          </a>
          <button type="button" className="st-rail__link" onClick={onLogout}>
            <Svg name="out" /><span>Выйти</span>
          </button>
        </div>
      </aside>

      <main className="st-main">
        <Routes>
          <Route path={BASE} element={<Navigate to={`${BASE}/feed`} replace />} />
          <Route path={`${BASE}/feed`} element={<FeedEditor />} />
          <Route path={`${BASE}/hints`} element={<HintsView onChange={refreshHints} />} />
          <Route path={`${BASE}/reviews`} element={<ReviewsEditor />} />
          <Route path={`${BASE}/stats`} element={<AnalyticsView />} />
          <Route path={`${BASE}/catalog`} element={<CatalogEditor />} />
          <Route path={`${BASE}/links`} element={<LinksView />} />
          <Route path="*" element={<Navigate to={`${BASE}/feed`} replace />} />
        </Routes>
      </main>

      <nav className="st-tabbar">
        {NAV.map(n => (
          <NavLink key={n.to} to={`${BASE}/${n.to}`} className={({ isActive }) => `st-tabbar__link${isActive ? ' is-active' : ''}`}>
            <span className="st-tabbar__icon">
              <Svg name={n.icon} size={20} />
              {n.to === 'hints' && newHints > 0 && <b className="st-badge st-badge--dot">{newHints}</b>}
            </span>
            <span>{n.short ?? n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// Кто входил в админку — свой: его заходы на сайт не попадают в статистику
// и в рекламу. Метка остаётся и после выхода — менеджер не перестаёт быть
// своим. Снять её можно в «Аналитике».
function markStaff() {
  try { localStorage.setItem(STAFF_KEY, '1'); } catch { /* приватный режим */ }
}

export default function StudioApp() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  useEffect(() => { if (authed) markStaff(); }, [authed]);

  useEffect(() => {
    document.title = 'Админка — Neo Diamond';
    // Админку не индексируем, даже если ссылка куда-то утечёт.
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const kick = () => { clearToken(); setAuthed(false); };
    window.addEventListener(UNAUTHORIZED, kick);
    return () => { window.removeEventListener(UNAUTHORIZED, kick); meta.remove(); };
  }, []);

  const logout = () => { clearToken(); setAuthed(false); };

  return (
    <ToastProvider>
      {authed
        ? <BrowserRouter><Shell onLogout={logout} /></BrowserRouter>
        : <Login onDone={() => setAuthed(true)} />}
    </ToastProvider>
  );
}
