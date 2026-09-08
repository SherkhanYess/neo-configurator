import { useSearchParams, useNavigate } from 'react-router-dom';
import { SHAPES, VALID_COMBOS, PUSETЫ_VALID_COMBOS, cardName, pusetyCardName, ringImage } from '../data/config.js';
import { loadPrices } from '../data/prices.js';

const _prices = loadPrices();

function basePrice(shankId, castId) {
  const base = _prices.baseByShank?.[shankId] ?? 0;
  const cast = castId !== 'classic' ? (_prices.casts?.[castId] ?? 0) : 0;
  return base + cast;
}
function formatPrice(n) { return n.toLocaleString('ru-KZ') + ' ₸'; }
function shankToSlug(id) { return id.toLowerCase().replace(/\s+/g, '-'); }

function RingCard({ shape, shank, cast, onClick }) {
  const shapeObj = SHAPES.find(s => s.id === shape);
  const name  = cardName(shank, cast, shapeObj?.label ?? shape);
  const price = basePrice(shank, cast);
  const img   = ringImage(shank, cast, shape);

  return (
    <button className="product-card" onClick={onClick}>
      <div className="product-card__img-wrap">
        <div className="product-card__studio-bg">
          {img && (
            <img
              src={img}
              alt={name}
              className="product-card__ring"
              loading="lazy"
              decoding="async"
              width="700"
              height="700"
            />
          )}
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__name">{name}</div>
        <div className="product-card__price">{formatPrice(price)}</div>
      </div>
    </button>
  );
}

function PusetyCard({ shape, cast, onClick }) {
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
            loading="lazy"
            decoding="async"
            style={{ mixBlendMode: 'multiply', background: '#fff', objectFit: 'contain', width: '70%', height: '70%' }}
          />
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__name">{name}</div>
        <div className="product-card__price" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Уточните цену
        </div>
      </div>
    </button>
  );
}

export default function CatalogScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const shapesParam  = searchParams.get('shapes');
  const activeShapes = shapesParam
    ? shapesParam.split(',').filter(id => SHAPES.find(s => s.id === id))
    : SHAPES.map(s => s.id);

  // Rings
  const rings = [];
  for (const shape of activeShapes) {
    for (const { shank, cast } of VALID_COMBOS) {
      rings.push({ type: 'ring', shape, shank, cast });
    }
  }

  // Pusety — only shapes that exist in pusety catalog
  const pusety = PUSETЫ_VALID_COMBOS.filter(c => activeShapes.includes(c.shape))
    .map(c => ({ type: 'pusety', ...c }));

  const products = [...rings, ...pusety];

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
        <button className="catalog-shapes-btn" onClick={() => navigate('/catalog')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>{shapeLabels || 'Все формы'}</span>
          <span className="catalog-shapes-btn__change">Изменить</span>
        </button>
      </div>

      <div className="product-grid">
        {products.map(p =>
          p.type === 'ring' ? (
            <RingCard
              key={`ring-${p.shape}-${p.shank}-${p.cast}`}
              shape={p.shape} shank={p.shank} cast={p.cast}
              onClick={() => navigate(`/catalog/product/${shankToSlug(p.shank)}/${p.cast}/${p.shape}`)}
            />
          ) : (
            <PusetyCard
              key={`pusety-${p.cast}-${p.shape}`}
              shape={p.shape} cast={p.cast}
              onClick={() => navigate(`/catalog/pusety/product/${p.cast}/${p.shape}`)}
            />
          )
        )}
      </div>
    </div>
  );
}
