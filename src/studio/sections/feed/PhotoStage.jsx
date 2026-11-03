/* eslint-disable react-refresh/only-export-components -- загрузка и пересчёт цвета живут рядом с карточкой */
import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '../../api.js';
import { autoTone, compress, contrastOf, fromHex, loadImage, readable, readImage, toHex, toneOptions } from '../../image.js';
import { Button, Svg, useToast } from '../../ui.jsx';

// Фото в карточке: загрузка, выбор кадра и цвет плашки.
//
// Кадр выбирают, двигая само фото в карточке — так же, как кадрируют в
// телефоне. Сохраняется точка фокуса (object-position), а не обрезанный файл:
// кадр можно поменять потом, не загружая фото заново.

// Открытые картинки — чтобы пересчитать цвет после смены кадра, не скачивая
// фото повторно.
const images = new Map();
export function imageFor(url) {
  if (!url) return Promise.resolve(null);
  if (!images.has(url)) images.set(url, loadImage(url).catch(() => { images.delete(url); return null; }));
  return images.get(url);
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif';

/** Загрузка: сжать, отправить, посчитать цвет. Возвращает поля для черновика. */
export async function uploadPhoto(file, focus) {
  const img = await readImage(file);
  const { blob, width, height } = await compress(img);
  const url = await uploadImage(blob, { width, height });
  images.set(url, Promise.resolve(img));
  return { photo: url, toneAuto: autoTone(img, focus), tone: null, focus };
}

/**
 * Обёртка над карточкой: перетаскивание файла, кадрирование пальцем,
 * индикатор загрузки. children — сама карточка (FeedCard или FeedBreak).
 */
export function PhotoStage({ photo, focus, onFocus, onFocusEnd, onFile, busy, children }) {
  const frameRef = useRef(null);
  const [loaded, setLoaded] = useState({ src: null });
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [over, setOver] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    let alive = true;
    imageFor(photo).then(img => {
      if (alive && img) setLoaded({ src: photo, w: img.naturalWidth ?? img.width, h: img.naturalHeight ?? img.height });
    });
    return () => { alive = false; };
  }, [photo]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrame({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Насколько фото шире или выше рамки — на столько его можно сдвинуть.
  const natural = loaded.src === photo ? loaded : null;
  const scale = natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 0;
  const o = scale ? { x: natural.w * scale - frame.w, y: natural.h * scale - frame.h } : { x: 0, y: 0 };
  const pannable = o.x > 2 || o.y > 2;

  function down(e) {
    if (!pannable || busy) return;
    e.preventDefault();
    drag.current = { x: e.clientX, y: e.clientY, focus, o, last: focus };
    const move = (ev) => {
      const d = drag.current;
      if (!d) return;
      const nx = d.o.x > 2 ? d.focus.x - ((ev.clientX - d.x) / d.o.x) * 100 : d.focus.x;
      const ny = d.o.y > 2 ? d.focus.y - ((ev.clientY - d.y) / d.o.y) * 100 : d.focus.y;
      d.last = { x: Math.round(Math.min(100, Math.max(0, nx))), y: Math.round(Math.min(100, Math.max(0, ny))) };
      onFocus(d.last);
    };
    const up = () => {
      const last = drag.current?.last;
      drag.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (last) onFocusEnd?.(last);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function drop(e) {
    e.preventDefault();
    setOver(false);
    const file = [...(e.dataTransfer?.files ?? [])].find(f => f.type.startsWith('image/'));
    if (file) onFile(file);
  }

  return (
    <div
      className={`st-stage${over ? ' is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      {children}
      <div
        ref={frameRef}
        className={`st-stage__frame${pannable ? ' is-pannable' : ''}`}
        onPointerDown={down}
        title={pannable ? 'Потяните фото, чтобы выбрать кадр' : undefined}
      />
      {pannable && !busy && <span className="st-stage__hint">Потяните фото — выберите кадр</span>}
      {over && <div className="st-stage__drop">Отпустите, чтобы загрузить</div>}
      {busy && <div className="st-stage__busy"><span className="st-spinner st-spinner--light" />Загружаем фото…</div>}
    </div>
  );
}

export function PhotoButtons({ photo, onFile, onRemove, busy, removeLabel = 'Убрать фото' }) {
  const input = useRef(null);
  return (
    <div className="st-row">
      <input ref={input} type="file" accept={ACCEPT} hidden
             onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
      <Button variant={photo ? 'secondary' : 'primary'} onClick={() => input.current?.click()} busy={busy}>
        <Svg name="photo" />{photo ? 'Заменить фото' : 'Загрузить фото'}
      </Button>
      {photo && onRemove && <Button variant="ghost" onClick={onRemove} disabled={busy}>{removeLabel}</Button>}
    </div>
  );
}

/** Хук загрузки с уведомлением об ошибке. */
export function useUpload(apply) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run(file, focus) {
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      toast('Это не картинка. Нужен JPEG, PNG, WebP или HEIC.', 'error');
      return;
    }
    setBusy(true);
    try {
      apply(await uploadPhoto(file, focus));
      toast('Фото загружено, цвет подобран');
    } catch (e) {
      toast(e.message || 'Не удалось загрузить фото', 'error');
    } finally {
      setBusy(false);
    }
  }
  return { busy, upload: run };
}

/**
 * Цвет плашки. «Авто» — по правилу ленты; рядом — другие тона из того же
 * фото и свой цвет. Любой выбор проходит через то же затемнение, поэтому
 * сделать текст нечитаемым из админки нельзя.
 */
export function TonePicker({ photo, focus, tone, toneAuto, onChange }) {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    imageFor(photo).then(img => { if (alive) setOptions(img ? toneOptions(img, focus) : []); });
    return () => { alive = false; };
  }, [photo, focus?.x, focus?.y]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!photo) {
    return <p className="st-muted">Цвет подберётся сам, как только загрузите фото.</p>;
  }

  const current = tone ?? toneAuto;
  const extra = options.filter(o => o !== toneAuto);
  const custom = tone && tone !== toneAuto && !extra.includes(tone) ? tone : null;
  const ratio = contrastOf(current);

  return (
    <div className="st-tone">
      <div className="st-tone__swatches">
        <button type="button" className={`st-swatch st-swatch--auto${!tone || tone === toneAuto ? ' is-on' : ''}`}
                style={{ '--c': toneAuto ?? '#3E3E3E' }} onClick={() => onChange(null)}>
          <span className="st-swatch__dot" /><span>Авто</span>
        </button>
        {extra.map(c => (
          <button key={c} type="button" className={`st-swatch${tone === c ? ' is-on' : ''}`}
                  style={{ '--c': c }} onClick={() => onChange(c)} aria-label={`Цвет ${c}`}>
            <span className="st-swatch__dot" />
          </button>
        ))}
        {custom && (
          <button type="button" className="st-swatch is-on" style={{ '--c': custom }} aria-label={`Свой цвет ${custom}`}>
            <span className="st-swatch__dot" />
          </button>
        )}
        <label className="st-swatch st-swatch--pick" title="Свой цвет">
          <input type="color" value={current ?? '#3E3E3E'}
                 onChange={(e) => { const rgb = fromHex(e.target.value); if (rgb) onChange(toHex(readable(rgb))); }} />
          <Svg name="plus" size={16} />
        </label>
      </div>
      <div className="st-tone__meta">
        <code>{current}</code>
        <span className={`st-ratio${ratio >= 10 ? ' is-ok' : ''}`}>
          контраст {ratio.toFixed(1).replace('.', ',')} : 1
        </span>
      </div>
    </div>
  );
}

/** Пересчёт авто-цвета после смены кадра. */
export async function retone(photo, focus) {
  const img = await imageFor(photo);
  return img ? autoTone(img, focus) : null;
}
