import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SHAPES, pusetyCardName, ringImage } from '../data/config.js';
import { useProducts, enabledRings, enabledPusety, enabledShapes, ringName, shapeLabel as shapeLabelOf } from '../data/products.js';
import { usePrices } from '../data/prices.js';
import { track, EVENTS } from '../lib/track.js';

function basePrice(prices, shankId, castId) {
  const base = prices.baseByShank?.[shankId] ?? 0;
  const cast = castId !== 'classic' ? (prices.casts?.[castId] ?? 0) : 0;
  return base + cast;
}
function formatPrice(n) { return n.toLocaleString('ru-KZ') + ' ₸'; }
function shankToSlug(id) { return id.toLowerCase().replace(/\s+/g, '-'); }

function RingCard({ shape, shank, cast, prices, products, onClick }) {
  const shapeObj = SHAPES.find(s => s.id === shape);
  const name  = [ringName(products, shank, cast), shapeLabelOf(products, shape)].filter(Boolean).join(' ');
  const price = basePrice(prices, shank, cast);
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

function PusetyCard({ shape, cast, products, onClick }) {
  const shapeObj = SHAPES.find(s => s.id === shape);
  const name = pusetyCardName(cast, shapeLabelOf(products, shape));

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
            style={{ objectFit: 'contain', width: '70%', height: '70%' }}
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
  const prices = usePrices();
  const productCfg = useProducts();

  const available    = enabledShapes(productCfg).map(s => s.id);
  const shapesParam  = searchParams.get('shapes');
  const activeShapes = (shapesParam ? shapesParam.split(',') : available)
    .filter(id => available.includes(id));

  const rings = [];
  for (const shape of activeShapes) {
    for (const { shank, cast } of enabledRings(productCfg)) {
      rings.push({ type: 'ring', shape, shank, cast });
    }
  }

  const pusety = enabledPusety(productCfg)
    .filter(c => activeShapes.includes(c.shape))
    .map(c => ({ type: 'pusety', cast: c.cast, shape: c.shape }));

  const products = [...rings, ...pusety];

  const shapeLabels = activeShapes
    .map(id => shapeLabelOf(productCfg, id))
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    track(EVENTS.CATALOG_VIEW, {
      shapes: activeShapes.join(','),
      shapeCount: activeShapes.length,
      products: products.length,
    });
  }, [shapesParam]); // eslint-disable-line react-hooks/exhaustive-deps

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
              shape={p.shape} shank={p.shank} cast={p.cast} prices={prices} products={productCfg}
              onClick={() => navigate(`/catalog/product/${shankToSlug(p.shank)}/${p.cast}/${p.shape}`)}
            />
          ) : (
            <PusetyCard
              key={`pusety-${p.cast}-${p.shape}`}
              shape={p.shape} cast={p.cast} products={productCfg}
              onClick={() => navigate(`/catalog/pusety/product/${p.cast}/${p.shape}`)}
            />
          )
        )}
      </div>
    </div>
  );
}
