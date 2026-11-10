import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { guideBySlug } from '../data/guides.js';
import { guideList } from '../data/guidesDefault.js';
import { useContent } from '../data/content.js';
import GuideArticle from '../guides/GuideArticle.jsx';
import { GuideCtx } from '../guides/guideCtx.js';
import { GuideCard } from '../components/GuidesStrip.jsx';
import { useWhatsApp, WA_ICON } from '../components/model/whatsapp.jsx';
import { PAGES } from '../lib/leadCode.js';
import { track, EVENTS } from '../lib/track.js';

// Страница гида — посадочная для рекламы: человек пришёл читать, а не
// покупать. Поэтому первый экран — заголовок, вступление и обложка, без
// кнопок. Когда обложка ушла вверх, снизу появляется панель «Смотреть кольца»
// и WhatsApp; у финального блока она прячется — там те же кнопки крупно.
//
// Текст — из админки (/api/content/guides), а пока его нет — из кода.
//
// Что считаем: открыл гид (guide_view), дочитал до финала (guide_read),
// перешёл в каталог (guide_cta), написал из гида (wa_click с полем guide).


export default function GuideScreen() {
  const { slug } = useParams();
  const { data, ready } = useContent('guides');
  const list = guideList(data);
  const guide = guideBySlug(list, slug);
  // Пока не знаем, что в админке, — пустое место, а не текст из кода, который
  // через миг сменится.
  if (!ready) return <div style={{ minHeight: '100dvh' }} />;
  if (!guide) return <Navigate to="/" replace />;
  return <Guide key={slug} guide={guide} others={list.filter(g => g.slug !== slug)} />;
}

function Guide({ guide, others }) {
  const wa = useWhatsApp(PAGES.guide);
  const { open: openWa } = wa;
  const ctx = useMemo(() => ({ slug: guide.slug, wa: { open: openWa } }), [guide.slug, openWa]);

  const rootRef = useRef(null);
  const coverRef = useRef(null);
  const barRef = useRef(null);
  const [sticky, setSticky] = useState(false);

  // Новая статья открывается с начала, а не с того места, где был человек.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  // Заголовок вкладки и описание — свои у каждого гида (переход из ленты
  // не перезагружает страницу, а пререндер даёт их только первому заходу).
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content');
    document.title = `${guide.title} — taena`;
    if (guide.description) meta?.setAttribute('content', guide.description);
    // Заголовок вкладки ставит следующая страница сама; описание — возвращаем.
    return () => { if (meta && prevDesc) meta.setAttribute('content', prevDesc); };
  }, [guide]);

  useEffect(() => {
    const opened = Date.now();
    track(EVENTS.GUIDE_VIEW, { guide: guide.slug });

    // Полоса прочитанного — без перерисовки React: только CSS-переменная.
    const onScroll = () => {
      const el = rootRef.current;
      if (!el || !barRef.current) return;
      const total = el.offsetTop + el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 1;
      barRef.current.style.setProperty('--p', p.toFixed(3));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Панель видна между обложкой и финалом. Финал показался — гид дочитан.
    let coverAbove = false, finalOn = false, read = false;
    const update = () => setSticky(coverAbove && !finalOn);
    const final = rootRef.current?.querySelector('[data-final]');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === coverRef.current) coverAbove = !e.isIntersecting && e.boundingClientRect.top < 0;
        if (e.target === final) {
          // Финал на экране или уже позади: ниже него панель не нужна —
          // там те же кнопки и подвал с контактами.
          finalOn = e.isIntersecting || e.boundingClientRect.top < 0;
          if (e.isIntersecting && !read) {
            read = true;
            track(EVENTS.GUIDE_READ, { guide: guide.slug, seconds: Math.round((Date.now() - opened) / 1000) });
          }
        }
      }
      update();
    });
    if (coverRef.current) io.observe(coverRef.current);
    if (final) io.observe(final);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
    };
  }, [guide.slug]);

  return (
    <GuideCtx.Provider value={ctx}>
      <article className="gd">
        <header className="gd-head">
          <Link to="/" className="gd-head__back">
            <svg width="7" height="12" viewBox="0 0 8 12" aria-hidden="true"><path d="M7 1L2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            Кольца
          </Link>
          <Link to="/" aria-label="taena — каталог"><img src="/assets/taena/sign-bronze.webp" alt="taena" /></Link>
          <div className="gd-progress" ref={barRef} aria-hidden="true" />
        </header>

        <GuideArticle guide={guide} ref={rootRef} coverRef={coverRef}>
          {others.length > 0 && (
            <section className="gd-also" aria-labelledby="gd-also-t">
              <div className="gd-col"><h2 className="gd-h2" id="gd-also-t">Читайте также</h2></div>
              <div className="gstrip__list">
                {others.map(g => <GuideCard key={g.slug} guide={g} from={`guide:${guide.slug}`} />)}
              </div>
            </section>
          )}
        </GuideArticle>

        <div className={`gd-sticky${sticky ? ' is-on' : ''}`} aria-hidden={!sticky}>
          <div className="gd-sticky__in">
            <Link to="/" className="gd-btn gd-btn--ink" tabIndex={sticky ? 0 : -1}
                  onClick={() => track(EVENTS.GUIDE_CTA, { guide: guide.slug, target: 'catalog', place: 'sticky' })}>
              Смотреть кольца
            </Link>
            <button type="button" className="gd-sticky__wa" aria-label="Написать в WhatsApp" tabIndex={sticky ? 0 : -1}
                    onClick={() => wa.open('price', {}, { place: 'guide_sticky', guide: guide.slug })}>
              {WA_ICON}
            </button>
          </div>
        </div>
        {wa.sheet}
      </article>
    </GuideCtx.Provider>
  );
}
