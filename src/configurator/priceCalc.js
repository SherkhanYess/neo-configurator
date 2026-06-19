/**
 * Calculate estimated ring price based on user choices and admin price config.
 * All values in KZT (₸).
 *
 * @param {object} choices  — from useConfigurator (shape, shank, cast, carat, metalLabel, gem1Label…)
 * @param {object} prices   — from GET /api/get-prices
 * @returns {number|null}   — estimated price or null if not enough data
 */
export function calcPrice(choices, prices) {
  if (!prices || !choices.carat) return null;

  // Base price depends on shank design
  let total = prices.baseByShank?.[choices.shankLabel] ?? prices.base ?? 0;

  // Cast design surcharge
  if (choices.cast && choices.cast !== 'classic') {
    const surcharge = prices.casts?.[choices.cast] ?? 0;
    total += surcharge;
  }

  // Carat: base price per carat × carat weight
  total += (prices.caratPrice ?? 0) * choices.carat;

  // Purity surcharge: flat KZT amount for 750
  if (choices.purity === '750' && prices.purity750surcharge) {
    total += prices.purity750surcharge;
  }

  // Fancy gem color surcharge: price per 1 carat × number of carats
  const isFancy = (label) => label && !label.toLowerCase().includes('бел');
  if ((isFancy(choices.gem1Label) || isFancy(choices.gem2Label)) && prices.fancyColorSurcharge) {
    total += prices.fancyColorSurcharge * choices.carat;
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
