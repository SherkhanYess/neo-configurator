import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHAPES, PUSETЫ_SHAPES_BY_CAST } from '../data/config.js';

// All unique shapes available for any pusety (union of classic + halo)
const PUSETЫ_ALL_SHAPES = [...new Set([
  ...PUSETЫ_SHAPES_BY_CAST.classic,
  ...PUSETЫ_SHAPES_BY_CAST.halo,
])];

export default function PusetyFilterScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const availableShapes = SHAPES.filter(s => PUSETЫ_ALL_SHAPES.includes(s.id));

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function confirm() {
    const shapes = selected.length ? selected : availableShapes.map(s => s.id);
    navigate(`/catalog/pusety/list?shapes=${shapes.join(',')}`);
  }

  return (
    <div className="filter-screen">
      <div className="filter-header">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="filter-logo" />

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate('/catalog')} style={tabStyle(false)}>Кольца</button>
          <button style={tabStyle(true)}>Пусеты</button>
        </div>

        <h1 className="filter-title">Выберите форму бриллианта</h1>
        <p className="filter-sub">Можно выбрать несколько — покажем все подходящие пусеты</p>
      </div>

      <div className="shape-grid">
        {availableShapes.map((shape) => (
          <button
            key={shape.id}
            className={`shape-tile${selected.includes(shape.id) ? ' shape-tile--active' : ''}`}
            onClick={() => toggle(shape.id)}
          >
            <div className="shape-img-wrap">
              <img src={`/assets/shapes/${shape.file}`} alt={shape.label} className="shape-img" />
            </div>
            <span className="shape-label">{shape.label}</span>
          </button>
        ))}
      </div>

      <div className="filter-confirm-wrap">
        <button className="filter-confirm-btn" onClick={confirm}>
          {selected.length > 0
            ? `Смотреть пусеты (${selected.length})`
            : 'Смотреть все пусеты'}
        </button>
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: '8px 24px', borderRadius: 20,
    border: `1.5px solid ${active ? 'var(--ink-800)' : 'var(--border)'}`,
    background: active ? 'var(--ink-800)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.18s',
  };
}
