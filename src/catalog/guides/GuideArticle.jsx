import { forwardRef } from 'react';
import { minutesLabel } from '../data/guides.js';
import { typo } from '../data/feed.js';
import { GuideCover } from './covers.jsx';
import GuideBlocks from './blocks.jsx';
import './guides.css';

/**
 * Сама статья: шапка (тег, заголовок, вступление, обложка) и блоки.
 * Её же показывает предпросмотр в админке. coverRef — чтобы страница знала,
 * когда обложка ушла вверх.
 */
const GuideArticle = forwardRef(function GuideArticle({ guide, coverRef, children }, ref) {
  return (
    <div className="gd-inner" ref={ref}>
      <div className="gd-col gd-s gd-s--first">
        <div className="gd-meta"><span>Гид для мужчин</span><span>{minutesLabel(guide.minutes || 5)} чтения</span></div>
        <h1 className="gd-h1">{typo(guide.title)}</h1>
        {guide.lead && <p className="gd-lead">{typo(guide.lead)}</p>}
      </div>
      <div className="gd-wide" style={{ marginTop: 24 }} ref={coverRef}>
        <GuideCover kind={guide.cover} photo={guide.coverPhoto} eager />
      </div>
      <GuideBlocks blocks={guide.blocks} />
      {children}
    </div>
  );
});

export default GuideArticle;
