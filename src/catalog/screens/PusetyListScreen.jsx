import { useSearchParams, useNavigate } from 'react-router-dom';
import { SHAPES, PUSETЫ_VALID_COMBOS, PUSETЫ_SHAPES_BY_CAST, pusetyCardName } from '../data/config.js';

function formatPrice(n) {
  return n.toLocaleString('ru-KZ') + ' ₸';
}

function PusetyCard({ cast, shape, onClick }) {
  const shapeObj = SHAPES.find(s => s.id === shape);
  const name = pusetyCardName(cast, shapeObj?.label ?? shape);

  return (
    <button className="product-card" onClick={onClick}>
      <div className="product-card__img-wrap">
        <div className="product-card__studio-bg">
          <img
            src={`/assets/shapes/${shapeObj?.file ?? `${shape}.jpg`}`}
            alt={name}
            className="product-card__ring"
            style={{ mixBlendMode: 'multiply', background: '#fff' }}
          />
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__name">{name}</div>
        <div className="product-card__price" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          Уточните цену
        </div>
      </div>
    </button>
  );
}

export default function PusetyListScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const castParam   = searchParams.get('cast') ?? 'classic';
  const shapesParam = searchParams.get('shapes');
  const activeShapes = shapesParam
    ? shapesParam.split(',').filter(id => SHAPES.find(s => s.id === id))
    : PUSETЫ_SHAPES_BY_CAST[castParam] ?? PUSETЫ_SHAPES_BY_CAST.classic;

  const products = PUSETЫ_VALID_COMBOS.filter(
    c => c.cast === castParam && activeShapes.includes(c.shape)
  );

  const shapeLabels = activeShapes
    .map(id => SHAPES.find(s => s.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="catalog-screen">
      <div className="catalog-topbar">
        <img src="/assets/logo-ink.png" alt="Neo Diamond" className="catalog-logo" />
      </div>

      <div className="catalog-shapes-bar">
        <button className="catalog-shapes-btn" onClick={() => navigate('/catalog/pusety')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>{shapeLabels || 'Все формы'} · {castParam === 'halo' ? 'Halo' : 'Classic'}</span>
          <span className="catalog-shapes-btn__change">Изменить</span>
        </button>
      </div>

      <div className="product-grid">
        {products.map(p => (
          <PusetyCard
            key={`${p.cast}-${p.shape}`}
            {...p}
            onClick={() => navigate(`/catalog/pusety/product/${p.cast}/${p.shape}`)}
          />
        ))}
      </div>
    </div>
  );
}
