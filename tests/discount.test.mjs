// Скидка на базовую модель: цена со скидкой из админки (saleByShank) — одна
// на шинку, вычитается из любой её конфигурации; старая цена — для
// зачёркивания.
import { calcPrice, discountOf, fromPrice, wasPrice } from '../src/catalog/data/priceCalc.js';
import { prunePrices } from '../src/catalog/data/models.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' — получено ' + JSON.stringify(got) + ', ожидалось ' + JSON.stringify(want)); }
};

const P = {
  baseByShank: { Neo: 800000, Sirius: 550000, Bezel: 550000 },
  saleByShank: { Neo: 700000 },
  casts: { halo: 150000, bezel: 100000 },
  caratPrice: 200000,
  purity750surcharge: 100000,
  fancyColorSurcharge: 100000,
  scatterFancySurcharge: 100000,
};

console.log('discountOf:');
eq('есть цена со скидкой → разница', discountOf(P, 'Neo'), 100000);
eq('нет цены со скидкой → 0', discountOf(P, 'Sirius'), 0);
eq('цена со скидкой 0 → 0', discountOf({ ...P, saleByShank: { Neo: 0 } }, 'Neo'), 0);
eq('цена со скидкой равна базовой → 0', discountOf({ ...P, saleByShank: { Neo: 800000 } }, 'Neo'), 0);
eq('цена со скидкой выше базовой → 0', discountOf({ ...P, saleByShank: { Neo: 900000 } }, 'Neo'), 0);
eq('нет saleByShank вовсе → 0', discountOf({ baseByShank: P.baseByShank }, 'Neo'), 0);
eq('нет цен → 0', discountOf(null, 'Neo'), 0);
eq('неизвестная модель → 0', discountOf(P, 'Nova'), 0);
eq('у модели нет базовой цены → 0', discountOf({ saleByShank: { Neo: 1 } }, 'Neo'), 0);

console.log('\nцена «от» в ленте:');
eq('Neo на лапках — со скидкой', fromPrice(P, 'Neo', 'classic'), 700000);
eq('Neo с ореолом — скидка та же', fromPrice(P, 'Neo', 'halo'), 850000);
eq('Sirius без скидки — как раньше', fromPrice(P, 'Sirius', 'classic'), 550000);
eq('нет цен → null', fromPrice(null, 'Neo', 'classic'), null);

console.log('\nцена на странице модели:');
const neo = { shankLabel: 'Neo', cast: 'classic', carat: 1 };
eq('1 ct', calcPrice(neo, P), 700000);
eq('2 ct, 750 — скидка вычитается из всей суммы', calcPrice({ ...neo, carat: 2, purity: '750' }, P), 800000 + 200000 + 100000 - 100000);
eq('цветной камень 1,5 ct', calcPrice({ ...neo, carat: 1.5, gem1Label: 'Розовый' }, P), 700000 + 100000 + 150000);
eq('ореол, цветная россыпь', calcPrice({ ...neo, cast: 'halo', castLabel: 'Хало', gem2Label: 'Розовый' }, P), 850000 + 200000);
eq('Sirius 2 ct — без изменений', calcPrice({ shankLabel: 'Sirius', cast: 'classic', carat: 2 }, P), 750000);

console.log('\nзачёркнутая цена:');
eq('Neo 1 ct → 800 000', wasPrice(calcPrice(neo, P), P, 'Neo'), 800000);
eq('Neo с ореолом → 950 000', wasPrice(fromPrice(P, 'Neo', 'halo'), P, 'Neo'), 950000);
eq('Neo 2 ct → цена + скидка', wasPrice(calcPrice({ ...neo, carat: 2 }, P), P, 'Neo'), 1000000);
eq('без скидки → null', wasPrice(550000, P, 'Sirius'), null);
eq('цены ещё нет → null', wasPrice(null, P, 'Neo'), null);

console.log('\nудаление модели чистит и скидку:');
const products = { rings: [{ shank: 'Sirius', cast: 'classic' }, { shank: 'Bezel', cast: 'bezel' }] };
const pruned = prunePrices(P, products);
eq('базовая цена удалённой Neo стёрта', pruned.baseByShank, { Sirius: 550000, Bezel: 550000 });
eq('скидка удалённой Neo стёрта', pruned.saleByShank, {});
eq('без скидок поле не появляется', 'saleByShank' in prunePrices({ baseByShank: { Sirius: 1 } }, products), false);
eq('скидка оставшейся модели цела',
   prunePrices({ ...P, saleByShank: { Neo: 700000, Sirius: 500000 } }, products).saleByShank, { Sirius: 500000 });

console.log(`\nитого: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
