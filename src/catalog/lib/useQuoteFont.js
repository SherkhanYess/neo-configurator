import { useEffect } from 'react';

// Курсив Cormorant нужен на одну строку-цитату (гравировка, кадр «на руке»).
// Грузим его только там, где такая строка есть: конструктору и остальному
// каталогу он ни к чему. Без него браузер подставляет широкий запасной шрифт,
// и строка переносится — поэтому подключаем до первой отрисовки строки.
const HREF = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&display=swap';

export function useQuoteFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: HREF }));
  }, []);
}
