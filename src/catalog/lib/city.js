// Выбранный шоурум.
//
// Город спрашиваем окном при первом нажатии на WhatsApp и запоминаем на
// вкладку: второе нажатие и вторая модель открывают чат сразу.

import { WA_BY_CITY, WA_NUMBER } from '../data/config.js';

const KEY = 'nd_city';

/** Города с шоурумом. «Другой город» в переключателе не нужен — это не место. */
export const CITIES = ['Алматы', 'Астана'];

export function currentCity() {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && CITIES.includes(saved)) return saved;
  } catch { /* приватный режим */ }
  return CITIES[0];
}

/** Выбирал ли человек город в этой вкладке — от этого зависит, показать ли окно. */
export function hasChosenCity() {
  try { return CITIES.includes(sessionStorage.getItem(KEY)); }
  catch { return false; }
}

export function rememberCity(city) {
  try { sessionStorage.setItem(KEY, city); } catch { /* приватный режим */ }
}

/** Номер шоурума. Неизвестный город отвечает из Алматы — там головной офис. */
export const waNumber = (city) => WA_BY_CITY[city] ?? WA_NUMBER;
