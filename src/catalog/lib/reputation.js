import { useEffect, useState } from 'react';

// Рейтинг в 2ГИС: цифру собирает пререндер при сборке (/reputation.json).
// Нет файла или 2ГИС не ответил — null, и блок с рейтингом не показываем.

let cached;

export function useReputation() {
  const [rep, setRep] = useState(cached ?? null);
  useEffect(() => {
    if (cached !== undefined) return;
    let alive = true;
    fetch('/reputation.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { cached = d?.rating ? d : null; if (alive) setRep(cached); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return rep;
}
