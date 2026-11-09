import { useEffect, useState } from 'react';

// Рейтинг в 2ГИС: цифру собирает пререндер при сборке (/reputation.json).
// Нет файла или 2ГИС не ответил — null, и блок с рейтингом не показываем.
//
// Один запрос на визит: подвал, «Почему нам доверяют» и страница модели
// просят рейтинг одновременно и получают один и тот же ответ.

let cached;    // undefined — ещё не знаем, null — рейтинга нет
let request = null;

function loadReputation() {
  request ??= fetch('/reputation.json')
    .then(r => (r.ok ? r.json() : null))
    .then(d => (cached = d?.rating ? d : null))
    .catch(() => (cached = null));
  return request;
}

export function useReputation() {
  const [rep, setRep] = useState(cached ?? null);
  useEffect(() => {
    if (cached !== undefined) return;
    let alive = true;
    loadReputation().then(d => { if (alive) setRep(d); });
    return () => { alive = false; };
  }, []);
  return rep;
}
