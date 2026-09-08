import { calcPusetyPrice, formatPrice } from '../src/catalog/data/priceCalc.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' — получено ' + JSON.stringify(got) + ', ожидалось ' + JSON.stringify(want)); }
};

const P = {
  baseByPusety: { classic: 300000, halo: 420000 },
  caratPrice: 200000,
  purity750surcharge: 100000,
  fancyColorSurcharge: 100000,
};

console.log('calcPusetyPrice:');
eq('цена не задана → null, а не выдуманная сумма',
   calcPusetyPrice({ cast: 'classic', carat: 1 }, { baseByPusety: { classic: 0 } }), null);
eq('нет конфига цен → null', calcPusetyPrice({ cast: 'classic', carat: 1 }, null), null);
eq('база classic, 1 карат', calcPusetyPrice({ cast: 'classic', carat: 1, purity: '585' }, P), 300000);
eq('база halo дороже',      calcPusetyPrice({ cast: 'halo',    carat: 1, purity: '585' }, P), 420000);
eq('2 карата = +1 карат сверх базы',
   calcPusetyPrice({ cast: 'classic', carat: 2, purity: '585' }, P), 500000);
eq('0.5 карата не даёт скидку ниже базы',
   calcPusetyPrice({ cast: 'classic', carat: 0.5, purity: '585' }, P), 300000);
eq('750 проба', calcPusetyPrice({ cast: 'classic', carat: 1, purity: '750' }, P), 400000);
eq('белый бриллиант — без надбавки',
   calcPusetyPrice({ cast: 'classic', carat: 1, purity: '585', gem1Label: 'Белый' }, P), 300000);
eq('фэнси-цвет ×карат',
   calcPusetyPrice({ cast: 'classic', carat: 2, purity: '585', gem1Label: 'Розовый' }, P), 700000);
eq('всё вместе: halo + 2кт + 750 + фэнси',
   calcPusetyPrice({ cast: 'halo', carat: 2, purity: '750', gem1Label: 'Синий' }, P), 920000);
eq('карат не выбран — только база',
   calcPusetyPrice({ cast: 'classic', purity: '585' }, P), 300000);
// toLocaleString('ru-KZ') разделяет разряды НЕРАЗРЫВНЫМ пробелом (U+00A0)
eq('формат разрядов', formatPrice(920000), '920\u00A0000 ₸');
eq('ноль не форматируется', formatPrice(0), null);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
