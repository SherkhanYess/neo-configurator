import { useEffect, useRef, useState } from 'react';
import { WA_ICON } from './whatsapp.jsx';

// Липкая панель из «жидкого стекла»: цена и кнопка написать в WhatsApp.
// Имя кольца стоит под 3D, а здесь — то, что нужно, когда человек ушёл вниз
// по странице: сколько стоит выбранное и куда нажать. Цена меняется на
// глазах при каждом выборе.
//
// «Обсудить в WhatsApp», а не «Оставить заявку»: заявка звучит как форма и
// ожидание звонка, а здесь человек сразу попадает в чат и пишет сам. Когда под панелью тёмный блок (примерка, финал,
// подвал), стекло темнеет и текст становится белым — иначе тёмный текст на
// тёмном не читается. Тёмные блоки помечены data-dark, подвал — тегом footer.

export default function GlassBar({ price, onWa }) {
  const ref = useRef(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const bar = ref.current;
      if (!bar) return;
      const r = bar.getBoundingClientRect();
      const y = r.top + r.height / 2;
      const under = [...document.querySelectorAll('[data-dark], footer')]
        .some(el => { const b = el.getBoundingClientRect(); return b.top <= y && b.bottom >= y; });
      setDark(under);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`mp-glass${dark ? ' is-dark' : ''}`}>
      <span className="mp-glass__p" aria-live="polite">{price}</span>
      <button type="button" className="mp-glass__wa" onClick={onWa}>{WA_ICON}Обсудить в WhatsApp</button>
    </div>
  );
}
