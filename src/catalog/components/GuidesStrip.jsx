import { Link } from 'react-router-dom';
import { guideList, guidePath, minutesLabel } from '../data/guides.js';
import { useContent } from '../data/content.js';
import { typo } from '../data/feed.js';
import { GuideCover } from '../guides/covers.jsx';
import { track, EVENTS } from '../lib/track.js';
import '../guides/guides.css';

// Гиды в ленте — после всех моделей, перед подбором в WhatsApp. Кто долистал
// и не выбрал, получает не ещё одно кольцо, а ответ на свои сомнения.
// Каждый гид — своя карточка, меньше карточки кольца: обложка миниатюрой,
// заголовок, что человек узнает, и кнопка «Читать гид».

export function GuideCard({ guide, from }) {
  return (
    <Link to={guidePath(guide.slug)} className="gcard2"
          onClick={() => track(EVENTS.GUIDE_OPEN, { guide: guide.slug, from })}>
      <div className="gcard2__top">
        <div className="gcard2__cover"><GuideCover kind={guide.cover} photo={guide.coverPhoto} /></div>
        <div>
          <span className="gcard2__m">Гид, {minutesLabel(guide.minutes)}</span>
          <h3 className="gcard2__t">{typo(guide.title)}</h3>
        </div>
      </div>
      {guide.teaser && <p className="gcard2__p">{typo(guide.teaser)}</p>}
      <span className="gcard2__btn">Читать гид</span>
    </Link>
  );
}

export default function GuidesStrip() {
  const { data } = useContent('guides');
  const guides = guideList(data);
  if (!guides.length) return null;
  return (
    <section className="gstrip" aria-labelledby="gstrip-t">
      <div className="gstrip__head">
        <h2 className="gstrip__t" id="gstrip-t">Прежде чем выбрать</h2>
        <p className="gstrip__p">Короткие гиды: как выбрать кольцо и сделать предложение без стресса</p>
      </div>
      <div className="gstrip__list">
        {guides.map(g => <GuideCard key={g.slug} guide={g} from="feed" />)}
      </div>
    </section>
  );
}
