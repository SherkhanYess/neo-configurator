import { useEffect, useState } from 'react';

// Содержимое витрины из админки: лента и отзывы (/api/content/:name).
//
// Ответ запоминается в браузере. Повторный заход рисует ленту сразу из памяти
// и тихо сверяется с сервером, поэтому фото не подменяются у человека на
// глазах. Первый заход ждёт ответа — недолго: если сервер молчит дольше
// WAIT_MS, показываем то, что зашито в код.

const WAIT_MS = 1500;
const memory = {};
const inflight = {};
const storageKey = (name) => `nd_content_${name}`;

function stored(name) {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? JSON.parse(raw) : undefined;
  } catch { return undefined; }
}

export function fetchContent(name) {
  if (inflight[name]) return inflight[name];
  inflight[name] = fetch(`/api/content/${name}`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(doc => {
      memory[name] = doc;
      try { localStorage.setItem(storageKey(name), JSON.stringify(doc)); } catch { /* приватный режим */ }
      return doc;
    })
    .finally(() => { inflight[name] = null; });
  return inflight[name];
}

/** Что уже известно без сети: ответ этого визита или прошлого. */
export function knownContent(name) {
  if (name in memory) return memory[name];
  return stored(name);
}

/**
 * { data, ready }: data — документ или null («не правили»); ready — можно
 * рисовать, не боясь, что содержимое сменится через мгновение.
 */
export function useContent(name) {
  const [state, setState] = useState(() => {
    const known = knownContent(name);
    return { data: known ?? null, ready: known !== undefined };
  });

  useEffect(() => {
    // Уже получили в этот визит — второй раз не спрашиваем. Сверяемся с
    // сервером, только если показали сохранённое с прошлого раза.
    if (name in memory && state.data === memory[name]) return;
    let alive = true;
    const timer = setTimeout(() => {
      if (alive) setState(s => (s.ready ? s : { ...s, ready: true }));
    }, WAIT_MS);
    fetchContent(name)
      .then(doc => { if (alive) setState({ data: doc, ready: true }); })
      .catch(() => { if (alive) setState(s => ({ ...s, ready: true })); })
      .finally(() => clearTimeout(timer));
    return () => { alive = false; clearTimeout(timer); };
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps -- state читаем один раз, при открытии

  return state;
}

// Ленту начинаем грузить сразу, как только загрузился код витрины, — не
// дожидаясь, пока React дойдёт до экрана.
if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
  fetchContent('feed').catch(() => {});
}
