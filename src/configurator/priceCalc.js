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

  // Shape surcharge (all shapes except round)
  if (choices.shape && choices.shape !== 'round') {
    const surcharge = prices.shapes?.[choices.shape] ?? 0;
    total += surcharge;
  }

  // Cast design surcharge
  if (choices.cast && choices.cast !== 'classic') {
    const surcharge = prices.casts?.[choices.cast] ?? 0;
    total += surcharge;
  }

  // Shank design surcharge
  if (choices.shankLabel) {
    const surcharge = prices.shanks?.[choices.shankLabel] ?? 0;
    total += surcharge;
  }

  // Metal color surcharge
  if (choices.metalLabel && typeof choices.metalLabel === 'string') {
    // Find by first word: "Розовое золото" → "Розовое"
    const firstWord = choices.metalLabel.split(' ')[0];
    const surcharge = prices.metals?.[firstWord] ?? 0;
    total += surcharge;
  }

  // Purity surcharge (750 is premium)
  if (choices.purity === '750' && prices.purity750surcharge) {
    total = total * (1 + prices.purity750surcharge / 100);
  }

  // Carat: base price per carat × carat weight
  total += (prices.caratPrice ?? 0) * choices.carat;

  // Fancy gem color surcharge
  const isFancy = (label) => label && !label.toLowerCase().includes('бел');
  if ((isFancy(choices.gem1Label) || isFancy(choices.gem2Label)) && prices.fancyColorSurcharge) {
    total += prices.fancyColorSurcharge;
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
