import { useEffect, useRef, useState } from 'react';

// Нижнее окно, которое не прячется под клавиатурой.
//
// На телефоне клавиатура перекрывает низ экрана, а position: fixed считает
// от полного окна — форма уезжала под клавиатуру и казалась пропавшей.
// Подложку растягиваем по видимой области (visualViewport): окно всегда
// прижато к верхнему краю клавиатуры, а поле в фокусе прокручивается в вид.

function useVisibleArea() {
  const [area, setArea] = useState(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setArea({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return area;
}

export default function Sheet({ label, onClose, as: Tag = 'div', onSubmit, children }) {
  const area = useVisibleArea();

  // Страница под окном не прокручивается, пока окно открыто. Эффект один раз
  // на открытие: иначе при каждом рендере «прежним» значением запомнилось бы
  // уже выставленное hidden, и страница осталась бы замороженной после закрытия.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, []);

  const onFocus = (e) => {
    const el = e.target;
    if (el.matches?.('input, textarea')) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
  };

  return (
    <div
      className="mp-sheet-bg"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      style={area ? { top: area.top, height: area.height, bottom: 'auto' } : undefined}
    >
      <Tag className="mp-sheet" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} onFocus={onFocus}>
        <div className="mp-sheet__grip" />
        {children}
      </Tag>
    </div>
  );
}
