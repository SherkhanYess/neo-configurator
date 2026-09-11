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

  const allSelected = shapes.length > 0 && selected.length === shapes.length;

  function toggleAll() {
    if (allSelected) { setSelected([]); return; }
    // Every newly added shape counts as interest, same as tapping them one by one.
    shapes.forEach(sh => { if (!selected.includes(sh.id)) track(EVENTS.SHAPE_SELECT, { shape: sh.id }); });
    setSelected(shapes.map(sh => sh.id));
  }

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

      <div className="filter-selectall-row">
        <button type="button" className="filter-selectall" onClick={toggleAll}>
          {allSelected ? 'Снять выбор' : 'Выбрать все'}
        </button>
      </div>

      <div className="shape-grid">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            className={`shape-tile${selected.includes(shape.id) ? ' shape-tile--active' : ''}`}
            aria-pressed={selected.includes(shape.id)}
            onClick={() => toggle(shape.id)}
          >
            <div className="shape-img-wrap">
              <img src={`/assets/shapes/${shape.file}`} alt={shape.label} className="shape-img" />
            </div>
            {selected.includes(shape.id) && (
              <span className="shape-check" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
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
