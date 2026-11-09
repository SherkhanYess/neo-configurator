/* eslint-disable react-refresh/only-export-components -- провайдер и хук живут рядом с окном */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from './ui.jsx';
import { cropImage } from './image.js';

// Кадрирование фото в админке — одно окно на все разделы.
//
// Фото двигают пальцем или мышью внутри рамки нужной формы и приближают
// ползунком, колёсиком или щипком. «Применить» — и на сервер уходит уже
// обрезанная картинка: сайт показывает ровно этот кадр, на любом экране.
//
//   const crop = useCrop();
//   const out = await crop({ src, img, aspects: [['4:5', 4 / 5]] });
//   if (out) uploadImage(out.blob, out)   // null — нажали «Отмена»
//
// aspects — варианты формы рамки: [подпись, ширина/высота]; null — как есть.

export const ASPECTS_FREE = [['Как есть', null], ['4:5', 4 / 5], ['1:1', 1], ['3:4', 3 / 4], ['16:9', 16 / 9]];

const CropCtx = createContext(null);
export const useCrop = () => useContext(CropCtx);

const MAX_ZOOM = 4;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function CropDialog({ job, onClose }) {
  const { src, img, aspects, title } = job;
  const nw = img.naturalWidth ?? img.width;
  const nh = img.naturalHeight ?? img.height;

  const [aspectIdx, setAspectIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: nw / 2, y: nh / 2 });
  const [box, setBox] = useState({ w: 320, h: 400 });
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const aspect = aspects[aspectIdx]?.[1] ?? nw / nh;

  // Рамка — по ширине окна, но не выше 60% экрана.
  useLayoutEffect(() => {
    const fit = () => {
      const maxW = Math.min(wrapRef.current?.clientWidth ?? 360, 460);
      const maxH = window.innerHeight * 0.58;
      let w = maxW, h = w / aspect;
      if (h > maxH) { h = maxH; w = h * aspect; }
      setBox({ w: Math.round(w), h: Math.round(h) });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [aspect]);

  const base = Math.max(box.w / nw, box.h / nh);
  const s = base * zoom;
  // Центр кадра не даём увести так, чтобы в рамку попала пустота.
  const cx = clamp(center.x, box.w / (2 * s), nw - box.w / (2 * s));
  const cy = clamp(center.y, box.h / (2 * s), nh - box.h / (2 * s));

  const move = useCallback((dx, dy) => setCenter(c => ({ x: c.x - dx / s, y: c.y - dy / s })), [s]);

  function down(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }
  function moveP(e) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      setZoom(clamp(pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d, 1, MAX_ZOOM));
    } else if (pointers.current.size === 1) {
      move(e.clientX - prev.x, e.clientY - prev.y);
    }
  }
  function up(e) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  // Колёсико — приближение; слушаем сами, чтобы не листалась страница.
  const stageRef = useRef(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const wheel = (e) => { e.preventDefault(); setZoom(z => clamp(z * Math.exp(-e.deltaY * 0.0015), 1, MAX_ZOOM)); };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') onClose(null); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  async function apply() {
    setBusy(true);
    try {
      const rect = { x: cx - box.w / (2 * s), y: cy - box.h / (2 * s), width: box.w / s, height: box.h / s };
      onClose(await cropImage(img, rect));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st-crop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="st-crop__panel" ref={wrapRef}>
        <div className="st-crop__head">
          <b>{title}</b>
          <span>Двигайте фото, приближайте ползунком или двумя пальцами</span>
        </div>
        <div className="st-crop__stage" ref={stageRef} style={{ width: box.w, height: box.h }}
             onPointerDown={down} onPointerMove={moveP} onPointerUp={up} onPointerCancel={up}>
          <img src={src} alt="" draggable={false}
               style={{ width: nw * s, height: nh * s, transform: `translate(${box.w / 2 - cx * s}px, ${box.h / 2 - cy * s}px)` }} />
          <span className="st-crop__grid" aria-hidden="true" />
        </div>
        <label className="st-crop__zoom">
          <span>Приближение</span>
          <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))} />
        </label>
        {aspects.length > 1 && (
          <div className="st-chips">
            {aspects.map(([label], i) => (
              <button key={label} type="button" className={`st-chip${i === aspectIdx ? ' is-on' : ''}`} aria-pressed={i === aspectIdx}
                      onClick={() => setAspectIdx(i)}>{label}</button>
            ))}
          </div>
        )}
        <div className="st-crop__btns">
          <Button variant="ghost" onClick={() => onClose(null)} disabled={busy}>Отмена</Button>
          <Button onClick={apply} busy={busy}>Применить</Button>
        </div>
      </div>
    </div>
  );
}

export function CropProvider({ children }) {
  const [job, setJob] = useState(null);
  const crop = useCallback((opts) => new Promise(resolve => {
    setJob({ title: 'Кадрировать фото', aspects: ASPECTS_FREE, ...opts, resolve });
  }), []);
  const close = useCallback((result) => {
    setJob(j => { j?.resolve(result); return null; });
  }, []);
  return (
    <CropCtx.Provider value={crop}>
      {children}
      {job && <CropDialog key={job.src} job={job} onClose={close} />}
    </CropCtx.Provider>
  );
}
