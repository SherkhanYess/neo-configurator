/**
 * Builds a structured price breakdown for display on the summary page and in WhatsApp messages.
 * Each line has: label, optional value, optional price, pricePrefix ('+' or '')
 */

const isFancy = (label) => label && !label.toLowerCase().includes('бел');

export function buildBreakdown(choices, prices) {
  const lines = [];

  // 1. Модель: Шинка - Огранка + базовая цена
  if (choices.shankLabel || choices.shapeLabel) {
    const model = [choices.shankLabel, choices.shapeLabel].filter(Boolean).join(' - ');
    const base = prices?.baseByShank?.[choices.shankLabel] ?? prices?.base ?? null;
    lines.push({ key: 'model', label: `Модель ${model}`, price: base, pricePrefix: '' });
  }

  // 2. Дизайн каста — только если не классика; цену показываем только если есть доплата
  if (choices.castLabel) {
    const hasSurcharge = choices.cast && choices.cast !== 'classic';
    const castPrice = hasSurcharge ? (prices?.casts?.[choices.cast] ?? 0) : null;
    lines.push({
      key: 'cast',
      label: `Дизайн каста - ${choices.castLabel}`,
      price: castPrice && castPrice > 0 ? castPrice : null,
      pricePrefix: '+',
    });
  }

  // 3. Каратность — доплата только свыше 1 карата
  if (choices.carat != null) {
    const extra = Math.max(0, choices.carat - 1);
    const caratPrice = extra > 0 ? extra * (prices?.caratPrice ?? 0) : null;
    lines.push({
      key: 'carat',
      label: `Каратность - ${Number(choices.carat).toFixed(2)}`,
      price: caratPrice && caratPrice > 0 ? caratPrice : null,
      pricePrefix: '+',
    });
  }

  // 4. Проба золота — доплата только за 750
  if (choices.purity) {
    const purityPrice = choices.purity === '750' && prices?.purity750surcharge
      ? prices.purity750surcharge
      : null;
    lines.push({
      key: 'purity',
      label: `Проба золота - ${choices.purity}`,
      price: purityPrice,
      pricePrefix: '+',
    });
  }

  // 5. Цвет золота — без доплаты
  if (choices.metalLabel) {
    lines.push({ key: 'metal', label: 'Цвет золота', value: choices.metalLabel, price: null });
  }

  // 6. Цвет центр. бриллианта — только если фантазийный (не белый)
  if (isFancy(choices.gem1Label)) {
    const fancyPrice = (prices?.fancyColorSurcharge ?? 0) * (choices.carat ?? 1);
    lines.push({
      key: 'gem1',
      label: 'Цвет бриллианта',
      value: choices.gem1Label,
      price: fancyPrice > 0 ? fancyPrice : null,
      pricePrefix: '+',
    });
  }

  // 7. Цвет россыпи — только если фантазийный; хало удваивает
  if (isFancy(choices.gem2Label)) {
    const scatter = prices?.scatterFancySurcharge ?? 0;
    const isHalo = choices.castLabel === 'Хало';
    const scatterPrice = scatter * (isHalo ? 2 : 1);
    lines.push({
      key: 'gem2',
      label: 'Цвет россыпи',
      value: choices.gem2Label,
      price: scatterPrice > 0 ? scatterPrice : null,
      pricePrefix: '+',
    });
  }

  return lines;
}

/** Formats a single breakdown line for WhatsApp (▪️ prefix) */
export function formatLineForWA(line) {
  let text = `▪️ ${line.label}`;
  if (line.value) text += `: ${line.value}`;
  if (line.price != null) {
    const formatted = Number(line.price).toLocaleString('ru-KZ');
    text += `: ${line.pricePrefix}${formatted} ₸`;
  }
  return text;
}

/** Formats entire breakdown as WhatsApp string */
export function formatBreakdownForWA(lines) {
  return lines.map(formatLineForWA).join('\n');
}
