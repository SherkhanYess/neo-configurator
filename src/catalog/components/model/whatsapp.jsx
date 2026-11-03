import { useCallback, useState } from 'react';
import { CITIES, currentCity, hasChosenCity, rememberCity, waNumber } from '../../lib/city.js';
import { leadCode } from '../../lib/leadCode.js';
import { waMessage } from '../../lib/waMessage.js';
import { track, EVENTS } from '../../lib/track.js';
import { SHOWROOMS } from '../../data/org.js';
import Sheet from './Sheet.jsx';

// Переход в WhatsApp со страницы модели.
//
// Город спрашиваем окном только при первом нажатии и запоминаем на вкладку:
// второе нажатие сразу открывает чат нужного шоурума. Переход — обычной
// навигацией, а не window.open: встроенные браузеры Instagram глотают
// открытие нового окна из скрипта.

export function readUtm() {
  try { return JSON.parse(sessionStorage.getItem('nd_utm') ?? '{}') ?? {}; }
  catch { return {}; }
}

export const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>
);

/**
 * open(type, ctx, props) — показывает окно города (если ещё не выбран) и ведёт в чат.
 * sheet — элемент окна; его нужно отрисовать на странице.
 */
export function useWhatsApp() {
  const [pending, setPending] = useState(null);

  const go = useCallback((city, { type, ctx, props }) => {
    const utm  = readUtm();
    const text = waMessage(type, { ...ctx, city }, utm);
    track(EVENTS.WA_CLICK, { ...props, type, city, code: leadCode(type, utm) });
    window.location.href = `https://wa.me/${waNumber(city)}?text=${encodeURIComponent(text)}`;
  }, []);

  const open = useCallback((type, ctx = {}, props = {}) => {
    const req = { type, ctx, props };
    if (hasChosenCity()) go(currentCity(), req);
    else setPending(req);
  }, [go]);

  const choose = (city) => {
    rememberCity(city);
    const req = pending;
    setPending(null);
    go(city, req);
  };

  const sheet = pending && (
    <Sheet label="Выбор шоурума" onClose={() => setPending(null)}>
        <div className="mp-sheet__t">В какой шоурум написать?</div>
        <p className="mp-sheet__p">Ответит менеджер вашего города — про наличие, срок и примерку.</p>
        <div style={{ marginTop: 10 }}>
          {SHOWROOMS.map(s => (
            <button key={s.city} type="button" className="mp-city" onClick={() => choose(s.city)}>
              <span><b>{s.city}</b><small>{s.streetAddress} ({s.place})</small></span>
              <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 1l6 6-6 6" fill="none" stroke="#476888" strokeWidth="1.5"/></svg>
            </button>
          ))}
        </div>
        {/* Из другого города пишут в Алматы — там головной офис. */}
        <button type="button" className="mp-textbtn" onClick={() => choose(CITIES[0])}>Я из другого города</button>
    </Sheet>
  );

  return { open, sheet };
}
