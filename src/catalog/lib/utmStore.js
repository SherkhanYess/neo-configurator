// Метки входа: на визит — в sessionStorage (nd_utm, его читают события и код
// обращения), и на 30 дней — в localStorage (nd_utm_last).
//
// Без второго хранилища человек из рекламы, вернувшийся через три дня по
// закладке, становился «прямым заходом» и реклама теряла его заявку.
//
// Правила:
//   • новые непустые метки в адресе перезаписывают обе записи;
//   • в адресе меток нет и в этом визите их ещё не было — берём сохранённые,
//     если им не больше 30 дней;
//   • заход без меток сохранённые метки не стирает.

export const SESSION_KEY = 'nd_utm';
export const LAST_KEY = 'nd_utm_last';
export const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function read(storage, key) {
  try { return JSON.parse(storage.getItem(key) ?? 'null'); } catch { return null; }
}

/**
 * Запоминает метки из адреса. Хранилища передаются параметрами, чтобы
 * правило проверялось тестом без браузера.
 * @returns {object} метки, с которыми идёт визит
 */
export function captureUtm({ search, session, local, now = Date.now() }) {
  const p = new URLSearchParams(search);
  const utm = {};
  for (const k of KEYS) {
    const v = (p.get(k) ?? '').trim();
    if (v) utm[k] = v;
  }

  if (Object.keys(utm).length) {
    try { session.setItem(SESSION_KEY, JSON.stringify(utm)); } catch { /* приватный режим */ }
    try { local.setItem(LAST_KEY, JSON.stringify({ utm, at: now })); } catch { /* приватный режим */ }
    return utm;
  }

  const current = read(session, SESSION_KEY);
  if (current && Object.keys(current).length) return current;

  const last = read(local, LAST_KEY);
  if (last?.utm && Object.keys(last.utm).length && now - Number(last.at) <= KEEP_MS) {
    try { session.setItem(SESSION_KEY, JSON.stringify(last.utm)); } catch { /* приватный режим */ }
    return last.utm;
  }
  return {};
}
