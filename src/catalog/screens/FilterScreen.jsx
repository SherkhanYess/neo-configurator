import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHAPES } from '../data/config.js';
import { useProducts, enabledShapes } from '../data/products.js';
import { track, EVENTS } from '../lib/track.js';

export default function FilterScreen() {
  const navigate  = useNavigate();
  const products  = useProducts();
  const shapes    = enabledShapes(products);
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    // Tracking stays outside the state updater — React may invoke an updater
    // more than once, so a side effect in there fires more than once too.
    if (!selected.includes(id)) track(EVENTS.SHAPE_SELECT, { shape: id });
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function confirm() {
    const ids = selected.length ? selected : shapes.map(s => s.id);
    navigate(`/catalog/list?shapes=${ids.join(',')}`);
  }

  return (
    <div className="filter-screen">
      <div className="filter-header">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="filter-logo" />
        <h1 className="filter-title">Выберите форму бриллианта</h1>
        <p className="filter-sub">Можно выбрать несколько — покажем все подходящие украшения</p>
      </div>

      <div className="shape-grid">
        {shapes.map((shape) => (
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
