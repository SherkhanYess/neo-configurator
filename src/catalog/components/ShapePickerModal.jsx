import { SHAPES } from '../data/config.js';

export default function ShapePickerModal({ activeShape, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Выберите огранку</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="shape-grid shape-grid--modal">
          {SHAPES.map(s => (
            <button
              key={s.id}
              className={`shape-tile ${activeShape === s.id ? 'shape-tile--active' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <div className="shape-img-wrap">
                <img src={`/assets/shapes/${s.file}`} alt={s.label} className="shape-img" />
              </div>
              <span className="shape-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
