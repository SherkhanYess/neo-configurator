import { useCallback, useEffect, useRef, useState } from 'react';

// Перетаскивание строк списка за «ручку» — мышью и пальцем.
//
// Встроенный drag-and-drop браузера на телефонах не работает, поэтому строки
// двигаются сами: пока палец ведёт строку, она меняется местами с соседкой,
// как только перешла её середину. Слушатели висят на окне, а не на ручке —
// при перестановке строка переезжает в DOM и «захват» указателя с неё слетел бы.

export function useSortable(ids, onMove) {
  const rows = useRef(new Map());
  const idsRef = useRef(ids);
  const moveRef = useRef(onMove);
  useEffect(() => { idsRef.current = ids; moveRef.current = onMove; });
  const [drag, setDrag] = useState(null);

  const start = useCallback((id, e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const s = { id, startY: e.clientY };

    const move = (ev) => {
      const order = idsRef.current;
      const i = order.indexOf(s.id);
      const el = rows.current.get(s.id);
      if (!el) return;
      let dy = ev.clientY - s.startY;
      const next = rows.current.get(order[i + 1]);
      const prev = rows.current.get(order[i - 1]);
      if (next && dy > next.offsetHeight / 2) {
        const step = next.offsetTop + next.offsetHeight - (el.offsetTop + el.offsetHeight);
        moveRef.current(i, i + 1);
        s.startY += step; dy -= step;
      } else if (prev && dy < -prev.offsetHeight / 2) {
        const step = el.offsetTop - prev.offsetTop;
        moveRef.current(i, i - 1);
        s.startY -= step; dy += step;
      }
      setDrag({ id: s.id, dy });
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    setDrag({ id, dy: 0 });
  }, []);

  const rowProps = (id) => ({
    ref: (el) => { if (el) rows.current.set(id, el); else rows.current.delete(id); },
    'data-dragging': drag?.id === id || undefined,
    style: drag?.id === id ? { transform: `translateY(${drag.dy}px)` } : undefined,
  });

  const handleProps = (id) => ({ onPointerDown: (e) => start(id, e) });

  return { rowProps, handleProps, dragging: drag?.id ?? null };
}

/** Новый массив, где элемент с позиции from стоит на позиции to. */
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
