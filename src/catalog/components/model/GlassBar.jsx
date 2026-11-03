import { useEffect, useRef, useState } from 'react';

// Имя кольца и цена в липкой панели из «жидкого стекла». Цена меняется на
// глазах при каждом выборе. Когда под панелью тёмный блок (примерка, финал,
// подвал), стекло темнеет и текст становится белым — иначе тёмный текст на
// тёмном не читается. Тёмные блоки помечены data-dark, подвал — тегом footer.

export default function GlassBar({ name, price }) {
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
    <div ref={ref} className={`mp-glass${dark ? ' is-dark' : ''}`} aria-live="polite">
      <span className="mp-glass__n">{name}</span>
      {price && <span className="mp-glass__p">{price}</span>}
    </div>
  );
}
