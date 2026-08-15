import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHAPES } from '../data/config.js';

export default function FilterScreen() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function confirm() {
    const shapes = selected.length ? selected : SHAPES.map(s => s.id);
    navigate(`/catalog/list?shapes=${shapes.join(',')}`);
  }

  return (
    <div className="filter-screen">
      <div className="filter-header">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="filter-logo" />
        <h1 className="filter-title">Выберите форму бриллианта</h1>
        <p className="filter-sub">Можно выбрать несколько — покажем все подходящие украшения</p>
      </div>

      <div className="shape-grid">
        {SHAPES.map((shape) => (
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
            ? `Смотреть украшения (${selected.length})`
            : 'Смотреть все украшения'}
        </button>
      </div>
    </div>
  );
}
