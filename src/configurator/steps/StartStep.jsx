import React from 'react';
import logoWhite from '../../assets/logo/neo-diamond-logo-white.png';

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6 3h12l4 6-10 13L2 9Z" opacity=".15"/>
    <path d="M6 3h12l4 6-10 13L2 9Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M2 9h20M12 3l-4 6 4 13 4-13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity=".4"/>
    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
    <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BENEFITS = [
  'Бриллианты в ассортименте — любая огранка и цвет',
  'Изготовление 7–14 дней в нашей студии',
  'Примерка украшения вживую перед оплатой',
];

export function StartStep({ onStart }) {
  return (
    <div className="cfg-start">

      <div className="cfg-start-hero">
        <img src={logoWhite} alt="Neo Diamond" className="cfg-start-logo" />
        <div className="cfg-start-badge">
          <DiamondIcon />
          <span>Neo Diamond · Ювелирная студия</span>
        </div>

        <h1 className="cfg-start-title">
          Создайте кольцо<br />своей мечты
        </h1>

        <p className="cfg-start-sub">
          Выберите огранку, оправу и металл — получите точную стоимость в WhatsApp за&nbsp;10&nbsp;секунд
        </p>

        <ul className="cfg-start-benefits">
          {BENEFITS.map((b) => (
            <li key={b} className="cfg-start-benefit">
              <span className="cfg-start-benefit-icon"><CheckIcon /></span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          className="cfg-start-cta"
          onClick={() => onStart('diamond')}
        >
          <span>Начать создание</span>
          <ArrowIcon />
        </button>

        <p className="cfg-start-note">Займёт около 3 минут · Бесплатно</p>
      </div>

    </div>
  );
}
