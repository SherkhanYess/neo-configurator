// Расшаренная ссылка должна открывать ровно ту конфигурацию, что видел отправитель.
import { encodeBooking, decodeBooking, bookingPath } from '../src/catalog/lib/bookingUrl.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + '\n       получено: ' + g + '\n       ожидалось: ' + w); }
};

const ring = {
  type: 'ring', shank: 'Sirius Luxe', cast: 'halo', shape: 'pear',
  carat: 1.5, purity: '750', gem1Label: 'Розовый', metalLabel: 'Белое золото',
};

console.log('кольцо — туда и обратно:');
const q = encodeBooking(ring);
console.log('  ' + q);
eq('конфигурация восстанавливается полностью', decodeBooking(q), ring);
eq('путь собирается', bookingPath(ring).startsWith('/catalog/booking?'), true);

console.log('\nпусеты:');
const pus = {
  type: 'pusety', shank: 'Пусеты Classic', cast: 'classic', shape: 'oval',
  carat: 1, purity: '585', gem1Label: 'Белый', metalLabel: 'Жёлтое золото',
};
eq('пусеты восстанавливаются', decodeBooking(encodeBooking(pus)), pus);
eq('в ссылке пусетов нет line', encodeBooking(pus).includes('line='), false);

console.log('\nмусор в адресе:');
eq('пустая строка → null',            decodeBooking(''), null);
eq('нет формы → null',                decodeBooking('line=sirius'), null);
eq('несуществующая форма → null',     decodeBooking('line=sirius&shape=banana'), null);
eq('несуществующая модель → null',    decodeBooking('line=zzz&shape=round'), null);
eq('чужой стиль → classic',           decodeBooking('line=neo&shape=round&style=hack').cast, 'classic');
eq('чужая проба → 585',               decodeBooking('line=neo&shape=round&gold=999').purity, '585');
eq('отрицательный карат отбрасывается', decodeBooking('line=neo&shape=round&ct=-3').carat, null);
eq('нечисловой карат отбрасывается',  decodeBooking('line=neo&shape=round&ct=abc').carat, null);
eq('неизвестный цвет → null, не мусор', decodeBooking('line=neo&shape=round&color=zzz').gem1Label, null);

console.log('\nимена моделей из нескольких слов:');
eq('Neo Luxe → neo-luxe',   encodeBooking({ shank: 'Neo Luxe', shape: 'round' }).includes('line=neo-luxe'), true);
eq('обратно в Neo Luxe',    decodeBooking('line=neo-luxe&shape=round').shank, 'Neo Luxe');

console.log('\nкороткая форма цвета металла:');
eq('«Белое» → «Белое золото»', decodeBooking(encodeBooking({ shank: 'Neo', shape: 'round', metalLabel: 'Белое' })).metalLabel, 'Белое золото');

console.log('\nцена не попадает в ссылку:');
eq('нет price в query', encodeBooking({ ...ring, price: 999000 }).includes('price'), false);

console.log('\nитого: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
