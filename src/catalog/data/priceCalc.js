/**
 * Скидка на модель, ₸: базовая цена минус цена со скидкой.
 *
 * Цена со скидкой задаётся в админке на базовую модель (шинку) —
 * `saleByShank`. Скидка — разница, и она вычитается из любой конфигурации
 * этой шинки: с ореолом, с другим каратом или пробой кольцо дешевле на ту же
 * сумму. Нет цены со скидкой, она 0 или не ниже базовой — скидки нет.
 */
export function discountOf(prices, shank) {
  const base = Number(prices?.baseByShank?.[shank]) || 0;
  const sale = Number(prices?.saleByShank?.[shank]) || 0;
  return sale > 0 && sale < base ? base - sale : 0;
}

/** Цена без скидки для зачёркивания — или null, если скидки нет. */
export function wasPrice(price, prices, shank) {
  const off = discountOf(prices, shank);
  return price && off ? price + off : null;
}

/**
 * Цена «от» — модель с камнем 1 ct, 585 проба, белый: база шинки плюс
 * доплата за оправу (ореол, ободок), минус скидка. Её показывают лента,
 * «Другие модели», админка и пререндер — одна формула на всех.
 */
export function fromPrice(prices, shank, cast) {
  if (!prices) return null;
  return (prices.baseByShank?.[shank] ?? 0) + (cast !== 'classic' ? (prices.casts?.[cast] ?? 0) : 0) - discountOf(prices, shank);
}

/**
 * Calculate estimated ring price based on user choices and admin price config.
 * All values in KZT (₸).
 *
 * Pricing rules:
 * - Base price = ring with 585 purity, 1 carat white diamond (all included)
 * - Carat surcharge: only for carats ABOVE 1 (e.g. 1.5 → +0.5×caratPrice)
 * - Purity 750: flat KZT surcharge
 * - Fancy color central diamond (gem1): fancyColorSurcharge × carat count
 * - Fancy color scattered diamonds (gem2/россыпь): flat scatterFancySurcharge
 * - Fancy color on halo cast: additional flat scatterFancySurcharge
 *
 * @param {object} choices  — from useConfigurator
 * @param {object} prices   — from GET /api/get-prices
 * @returns {number|null}
 */
export function calcPrice(choices, prices) {
  if (!prices || !choices.carat) return null;

  // Base price depends on shank design
  let total = prices.baseByShank?.[choices.shankLabel] ?? prices.base ?? 0;

  // Cast design surcharge (non-classic)
  if (choices.cast && choices.cast !== 'classic') {
    total += prices.casts?.[choices.cast] ?? 0;
  }

  // Carat: surcharge only for carats ABOVE 1 (base already includes 1 carat)
  const extraCarats = Math.max(0, choices.carat - 1);
  total += (prices.caratPrice ?? 0) * extraCarats;

  // Purity surcharge: flat KZT for 750
  if (choices.purity === '750' && prices.purity750surcharge) {
    total += prices.purity750surcharge;
  }

  const isFancy = (label) => label && !label.toLowerCase().includes('бел');

  // Fancy color for CENTRAL diamond (gem1): per-carat × carat count
  if (isFancy(choices.gem1Label) && prices.fancyColorSurcharge) {
    total += prices.fancyColorSurcharge * choices.carat;
  }

  // Fancy color for SCATTERED diamonds (gem2/россыпь): flat surcharge
  // Bezel cast has no scatter diamonds — skip entirely
  if (choices.cast !== 'bezel' && isFancy(choices.gem2Label) && prices.scatterFancySurcharge) {
    total += prices.scatterFancySurcharge;
    // Halo cast also has scattered diamonds → additional flat surcharge
    if (choices.castLabel === 'Хало') {
      total += prices.scatterFancySurcharge;
    }
  }

  total -= discountOf(prices, choices.shankLabel);

  return Math.round(total);
}

/**
 * Estimated pusety price.
 *
 * Pusety are a single piece — post and setting in one — so there is no shank
 * and no combined gold. A base of 0 means the owner has not set a price yet;
 * the caller shows "по запросу" rather than a made-up figure.
 *
 * @returns {number|null}
 */
export function calcPusetyPrice({ cast, carat, purity, gem1Label }, prices) {
  const base = prices?.baseByPusety?.[cast] ?? 0;
  if (!base) return null;

  let total = base;

  if (carat) {
    total += (prices.caratPrice ?? 0) * Math.max(0, carat - 1);
  }
  if (purity === '750' && prices.purity750surcharge) {
    total += prices.purity750surcharge;
  }
  if (gem1Label && !gem1Label.toLowerCase().includes('бел') && prices.fancyColorSurcharge) {
    total += prices.fancyColorSurcharge * (carat ?? 1);
  }

  return Math.round(total);
}

/**
 * Format price as "450 000 ₸"
 */
export function formatPrice(price) {
  if (!price) return null;
  return price.toLocaleString('ru-KZ') + ' ₸';
}
