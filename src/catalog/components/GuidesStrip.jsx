import { Link } from 'react-router-dom';
import { GUIDES, guidePath, minutesLabel } from '../data/guides.js';
import { GuideCover } from '../guides/covers.jsx';
import { track, EVENTS } from '../lib/track.js';
import '../guides/guides.css';

// Гиды в ленте — после всех моделей, перед подбором в WhatsApp. Кто долистал
// и не выбрал, получает не ещё одно кольцо, а ответ на свои сомнения.
// Полоса листается вбок; третья карточка выглядывает из-за края.

export function GuideCard({ guide, from, small }) {
  return (
    <Link to={guidePath(guide.slug)} className={`gcard${small ? ' gcard--small' : ''}`}
          onClick={() => track(EVENTS.GUIDE_OPEN, { guide: guide.slug, from })}>
      <div className="gcard__cover"><GuideCover kind={guide.cover} /></div>
      <div className="gcard__body">
        <div className="gcard__t">{guide.title}</div>
        <div className="gcard__m">{minutesLabel(guide.minutes)}</div>
      </div>
    </Link>
  );
}

export default function GuidesStrip() {
  return (
    <section className="gstrip" aria-labelledby="gstrip-t">
      <div className="gstrip__head">
        <h2 className="gstrip__t" id="gstrip-t">Прежде чем выбрать</h2>
        <p className="gstrip__p">Три коротких гида: как угадать с кольцом и сделать предложение без стресса</p>
      </div>
      <div className="gstrip__row">
        {GUIDES.map(g => <GuideCard key={g.slug} guide={g} from="feed" />)}
      </div>
    </section>
  );
}
