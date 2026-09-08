import { useState, useCallback } from 'react';
import Dashboard from '../admin/Dashboard.jsx';
import PricesTab from '../admin/PricesTab.jsx';

// Admin panel for the catalog.
//
// Deliberately separate from /admin, which belongs to the configurator on the
// root path and is left untouched.
//
// The token is the same ADMIN_TOKEN the price and stats endpoints check. It is
// held in localStorage so a reload does not log you out; every request carries
// it and the server is what actually enforces access.

const TOKEN_KEY = 'nd_admin';

const C = {
  paper050: '#FAFBFC', paper100: '#F2F5F9', paper300: '#DBE2EB',
  ink800: '#0B2040', ink600: '#1E3149', ink400: '#5B81A1',
  champ400: '#DCC29B',
};

const TABS = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'prices',    label: 'Цены' },
];

function Login({ onSubmit, error }) {
  const [value, setValue] = useState('');

  return (
    <div style={{
      minHeight: '100dvh', background: C.paper100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Manrope, sans-serif',
    }}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(value.trim()); }}
        style={{
          background: '#fff', border: `1.5px solid ${C.paper300}`,
          borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 380,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div>
          <div style={{
            fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: C.ink400, marginBottom: 8,
          }}>
            Neo Diamond
          </div>
          <h1 style={{
            fontFamily: '"Unbounded", sans-serif', fontWeight: 300,
            fontSize: '1.25rem', letterSpacing: '-0.02em', margin: 0, color: C.ink800,
          }}>
            Админка каталога
          </h1>
        </div>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 14,
            border: `1.5px solid ${C.paper300}`, background: C.paper050,
            fontSize: '0.95rem', color: C.ink800,
            fontFamily: 'Manrope, sans-serif', outline: 'none', boxSizing: 'border-box',
          }}
        />

        {error && <div style={{ fontSize: '0.83rem', color: '#A8322B' }}>{error}</div>}

        <button type="submit" style={{
          height: 48, border: 'none', borderRadius: 999, background: C.ink800,
          color: '#fff', fontSize: '0.9rem', fontWeight: 600,
          fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
        }}>
          Войти
        </button>
      </form>
    </div>
  );
}

export default function AdminScreen() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch (_) { return ''; }
  });
  const [tab, setTab] = useState('dashboard');

  const handleLogin = useCallback((value) => {
    if (!value) return;
    try { localStorage.setItem(TOKEN_KEY, value); } catch (_) {}
    setToken(value);
  }, []);

  const handleLogout = useCallback(() => {
    try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
    setToken('');
  }, []);

  if (!token) return <Login onSubmit={handleLogin} />;

  return (
    <div style={{ minHeight: '100dvh', background: C.paper100, fontFamily: 'Manrope, sans-serif' }}>

      <div style={{ background: C.ink800, position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '18px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{
                color: C.champ400, fontSize: '0.63rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', fontWeight: 600, marginBottom: 3,
              }}>
                Neo Diamond
              </div>
              <div style={{ color: C.paper050, fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                Админка каталога
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#C2D1DE', fontSize: '0.78rem', fontWeight: 500,
              fontFamily: 'Manrope, sans-serif', padding: 4,
            }}>
              Выйти
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 18px', border: 'none', cursor: 'pointer',
                  background: 'none',
                  color: tab === t.id ? C.paper050 : '#7C93AD',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.85rem', fontWeight: tab === t.id ? 700 : 500,
                  borderBottom: `2px solid ${tab === t.id ? C.champ400 : 'transparent'}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 24px 40px' }}>
        {tab === 'dashboard' && <Dashboard token={token} />}
        {tab === 'prices'    && <PricesTab token={token} />}
      </div>
    </div>
  );
}
