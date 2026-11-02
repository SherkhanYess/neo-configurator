// Выбранный шоурум.
//
// Раньше город спрашивали модальным окном в момент перехода в WhatsApp — лишний
// клик на самом дорогом шаге пути. Теперь это переключатель в липкой панели:
// человек видит его заранее и в большинстве случаев не трогает.
//
// Выбор держится на вкладку: открыв вторую модель, он не выбирает город заново.

import { WA_BY_CITY, WA_NUMBER } from '../data/config.js';

const KEY = 'nd_city';

/** Города с шоурумом. «Другой город» в переключателе не нужен — это не место. */
export const CITIES = ['Алматы', 'Астана'];

export function currentCity() {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && CITIES.includes(saved)) return saved;
  } catch (_) { /* приватный режим */ }
  return CITIES[0];
}

export function rememberCity(city) {
  try { sessionStorage.setItem(KEY, city); } catch (_) { /* приватный режим */ }
}

/** Номер шоурума. Неизвестный город отвечает из Алматы — там головной офис. */
export const waNumber = (city) => WA_BY_CITY[city] ?? WA_NUMBER;
