import React from 'react';

const DiamondIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6h24l8 12-20 26L4 18Z" />
    <path d="M4 18h40" />
    <path d="M24 6l-8 12 8 26 8-26Z" />
  </svg>
);

const RingIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="24" cy="30" rx="16" ry="8" />
    <path d="M8 30V18" />
    <path d="M40 30V18" />
    <ellipse cx="24" cy="18" rx="16" ry="8" />
  </svg>
);

export function StartStep({ onStart }) {
  return (
    <div className="cfg-start">
      <div className="cfg-start-tagline">
        <span className="nd-eyebrow">Neo Diamond</span>
        <h1 className="cfg-start-title">Создайте<br />своё кольцо</h1>
        <p className="cfg-start-sub">С чего хотите начать?</p>
      </div>

      <div className="cfg-start-cards">
        <button className="cfg-start-card" onClick={() => onStart('diamond')}>
          <span className="cfg-start-card-icon"><DiamondIcon /></span>
          <span className="cfg-start-card-label">С бриллианта</span>
          <span className="cfg-start-card-hint">Сначала выберите огранку</span>
        </button>
        <button className="cfg-start-card" onClick={() => onStart('shank')}>
          <span className="cfg-start-card-icon"><RingIcon /></span>
          <span className="cfg-start-card-label">С оправы</span>
          <span className="cfg-start-card-hint">Сначала выберите дизайн оправы</span>
        </button>
      </div>
    </div>
  );
}
