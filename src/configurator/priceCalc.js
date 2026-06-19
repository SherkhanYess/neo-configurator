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
  if (isFancy(choices.gem2Label) && prices.scatterFancySurcharge) {
    total += prices.scatterFancySurcharge;
    // Halo cast also has scattered diamonds → additional flat surcharge
    if (choices.castLabel === 'Хало') {
      total += prices.scatterFancySurcharge;
    }
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
