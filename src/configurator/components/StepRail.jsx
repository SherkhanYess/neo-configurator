import React from 'react';

const STEP_LABELS = {
  diamond:  'Огранка',
  shank:    'Шинка',
  cast:     'Оправа',
  carat:    'Каратность',
  metal:    'Металл',
  summary:  'Итог',
};

export function StepRail({ sequence, currentStep, onGoTo }) {
  // Only show config steps (not summary in the rail)
  const steps = sequence.filter((s) => s !== 'summary');
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="cfg-step-rail">
      {steps.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <button
            key={step}
            type="button"
            className={[
              'cfg-step-rail-item',
              done   ? 'is-done'   : '',
              active ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => done && onGoTo && onGoTo(step)}
            disabled={!done}
          >
            <span className="cfg-step-rail-num">
              {done ? '✓' : String(i + 1).padStart(2, '0')}
            </span>
            <span className="cfg-step-rail-label">{STEP_LABELS[step] || step}</span>
          </button>
        );
      })}
    </div>
  );
}
