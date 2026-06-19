import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';

const SHAPE_LABELS = {
  oval:      'Овал',
  pear:      'Груша',
  marquise:  'Маркиз',
  radiant:   'Радиант',
  emerald:   'Изумруд',
  cushion:   'Кушон',
  princess:  'Принцесса',
  heart:     'Сердце',
  asscher:   'Ашер',
};

function NumberField({ label, value, onChange, suffix = '₸' }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <div className="adm-input-row">
        <input
          type="number"
          className="adm-input"
          value={value ?? ''}
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="adm-suffix">{suffix}</span>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!token.trim()) { setErr('Введите пароль'); return; }
    onLogin(token.trim());
  };

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <h2 className="adm-login-title">💎 Neo Diamond Admin</h2>
        <p className="adm-login-sub">Панель управления ценами</p>
        <form onSubmit={submit}>
          <input
            type="password"
            className="adm-input"
            placeholder="Пароль"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
          />
          {err && <p className="adm-error">{err}</p>}
          <button type="submit" className="adm-btn adm-btn--primary">Войти</button>
        </form>
      </div>
    </div>
  );
}

function PricesForm({ token }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    fetch('/api/get-prices')
      .then((r) => r.json())
      .then((p) => { setPrices(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = useCallback((path, value) => {
    setPrices((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/set-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(prices),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg('✅ Цены сохранены!');
      } else {
        setMsg(`❌ Ошибка: ${data.error ?? res.status}`);
      }
    } catch {
      setMsg('❌ Ошибка соединения');
    }
    setSaving(false);
  };

  if (loading) return <div className="adm-loading">Загрузка…</div>;
  if (!prices)  return <div className="adm-loading">Не удалось загрузить цены</div>;

  return (
    <div className="adm-form">
      <section className="adm-section">
        <h3 className="adm-section-title">Базовая стоимость по дизайну шинки</h3>
        {['Neo', 'Neo Luxe', 'Sirius', 'Sirius Luxe', 'Bezel'].map((shank) => (
          <NumberField
            key={shank}
            label={shank}
            value={prices.baseByShank?.[shank]}
            onChange={(v) => set(`baseByShank.${shank}`, v)}
          />
        ))}
      </section>

      <section className="adm-section">
        <h3 className="adm-section-title">Доплата по дизайну каста</h3>
        <NumberField label="Хало" value={prices.casts?.halo} onChange={(v) => set('casts.halo', v)} />
        <NumberField label="Безель" value={prices.casts?.bezel} onChange={(v) => set('casts.bezel', v)} />
      </section>

      <section className="adm-section">
        <h3 className="adm-section-title">Каратность и проба</h3>
        <NumberField label="Цена за 1 карат" value={prices.caratPrice} onChange={(v) => set('caratPrice', v)} />
        <NumberField label="Доплата за пробу 750 (₸)" value={prices.purity750surcharge} onChange={(v) => set('purity750surcharge', v)} />
        <NumberField label="Фантазийный цвет — наценка за 1 карат (₸)" value={prices.fancyColorSurcharge} onChange={(v) => set('fancyColorSurcharge', v)} />
      </section>

      {msg && <p className={`adm-msg${msg.startsWith('✅') ? ' adm-msg--ok' : ' adm-msg--err'}`}>{msg}</p>}

      <button
        type="button"
        className="adm-btn adm-btn--primary adm-btn--save"
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Сохранение…' : 'Сохранить цены'}
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('nd_admin') ?? ''; } catch { return ''; }
  });
  const [authErr, setAuthErr] = useState('');

  const handleLogin = useCallback(async (t) => {
    // Quick auth check: try to save current prices (dry-run by fetching first then saving back)
    // Actually just store and try — errors show on save
    // Verify by pinging set-prices with empty body to check auth
    try {
      const res = await fetch('/api/set-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify(null),
      });
      if (res.status === 401) {
        setAuthErr('Неверный пароль');
        return;
      }
    } catch {
      // Network error — accept token, will fail on save
    }
    try { localStorage.setItem('nd_admin', t); } catch (_) {}
    setToken(t);
    setAuthErr('');
  }, []);

  if (!token) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        {authErr && <p style={{ textAlign: 'center', color: '#ff6b6b' }}>{authErr}</p>}
      </>
    );
  }

  return (
    <div className="adm-root">
      <header className="adm-header">
        <span className="adm-logo">💎 Neo Diamond</span>
        <span className="adm-header-title">Управление ценами</span>
        <button
          className="adm-logout"
          onClick={() => {
            try { localStorage.removeItem('nd_admin'); } catch (_) {}
            setToken('');
          }}
        >
          Выйти
        </button>
      </header>
      <main className="adm-main">
        <PricesForm token={token} />
      </main>
    </div>
  );
}
