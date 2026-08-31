import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHAPES, PUSETЫ_SHAPES_BY_CAST, PUSETЫ_CASTS } from '../data/config.js';

export default function PusetyFilterScreen() {
  const navigate = useNavigate();
  const [cast, setCast] = useState('classic');
  const [selectedShapes, setSelectedShapes] = useState([]);

  const availableShapes = SHAPES.filter(s => PUSETЫ_SHAPES_BY_CAST[cast].includes(s.id));

  function toggleShape(id) {
    setSelectedShapes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function confirm() {
    const shapes = selectedShapes.length ? selectedShapes : availableShapes.map(s => s.id);
    navigate(`/catalog/pusety/list?cast=${cast}&shapes=${shapes.join(',')}`);
  }

  // Reset shape selection when cast changes (some shapes may not be available)
  function handleCastChange(id) {
    setCast(id);
    setSelectedShapes([]);
  }

  return (
    <div className="filter-screen">
      <div className="filter-header">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="filter-logo" />
        <h1 className="filter-title">Пусеты</h1>
        <p className="filter-sub">Выберите стиль и форму бриллианта</p>
      </div>

      {/* Cast picker */}
      <div style={{ padding: '0 16px 20px', display: 'flex', gap: 10 }}>
        {PUSETЫ_CASTS.map(c => (
          <button
            key={c.id}
            onClick={() => handleCastChange(c.id)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 14,
              border: `1.5px solid ${cast === c.id ? 'var(--ink-800)' : 'var(--border)'}`,
              background: cast === c.id ? 'var(--paper-100)' : 'var(--surface)',
              fontFamily: 'var(--font-display)', fontSize: '0.75rem',
              fontWeight: cast === c.id ? 600 : 400,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: cast === c.id ? 'var(--ink-800)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="shape-grid">
        {availableShapes.map(shape => (
          <button
            key={shape.id}
            className={`shape-tile${selectedShapes.includes(shape.id) ? ' shape-tile--active' : ''}`}
            onClick={() => toggleShape(shape.id)}
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
          {selectedShapes.length > 0
            ? `Смотреть пусеты (${selectedShapes.length})`
            : 'Смотреть все пусеты'}
        </button>
      </div>
    </div>
  );
}
