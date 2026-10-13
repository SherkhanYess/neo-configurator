// Какой вариант воронки показывать.
//
// Песочница существует, чтобы сравнить две посадочные страницы: каталог с
// ценами и каталог без цен. Вариант приходит в адресе рекламного объявления и
// дальше держится в пределах вкладки — иначе человек, перешедший на карточку,
// увидел бы другой вариант, и замер потерял бы смысл.
//
// Вариант по умолчанию — с ценами: это то, как каталог работает на продакшене,
// и случайный заход без параметра не должен показывать непривычную версию.

const KEY = 'nd_variant';

export const VARIANTS = {
  PRICE:   'price',    // цены видны в витрине и в карточке
  NOPRICE: 'noprice',  // цен нет, карточка ведёт к запросу цены
};

const VALID = new Set(Object.values(VARIANTS));

/**
 * Читает вариант из адреса и запоминает его на вкладку.
 *
 * Параметр в адресе сильнее запомненного: так ссылку из объявления можно
 * открыть поверх уже начатой сессии и получить именно тот вариант, который в
 * ней указан.
 */
export function resolveVariant(search = window.location.search) {
  let fromUrl = null;
  try {
    const v = new URLSearchParams(search).get('v');
    if (v && VALID.has(v)) fromUrl = v;
  } catch (_) { /* адрес без параметров — не ошибка */ }

  if (fromUrl) {
    try { sessionStorage.setItem(KEY, fromUrl); } catch (_) { /* приватный режим */ }
    return fromUrl;
  }

  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && VALID.has(saved)) return saved;
  } catch (_) { /* приватный режим */ }

  return VARIANTS.PRICE;
}

/** Текущий вариант без перечитывания адреса — для вызовов вне React. */
export function currentVariant() {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && VALID.has(saved)) return saved;
  } catch (_) { /* приватный режим */ }
  return VARIANTS.PRICE;
}

/** Показывать ли цены. Единственная проверка, нужная экранам. */
export const showPrices = (variant = currentVariant()) => variant === VARIANTS.PRICE;
