import { formatPrice } from '../data/priceCalc.js';

/**
 * Цена без скидки — зачёркнутая, рядом с новой. Скидки нет (price пустой) —
 * ничего. Зачёркивание экранные чтецы не произносят, поэтому подпись «без
 * скидки» есть в тексте, но не видна.
 */
export default function WasPrice({ price, className = '' }) {
  if (!price) return null;
  return (
    <s className={`price-was ${className}`.trim()}>
      <span className="sr-only">без скидки </span>{formatPrice(price)}
    </s>
  );
}
