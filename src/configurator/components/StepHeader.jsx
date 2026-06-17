import React from 'react';

export function StepHeader({ title, sub }) {
  return (
    <div className="cfg-step-header">
      <h2 className="cfg-step-title">{title}</h2>
      {sub && <p className="cfg-step-sub">{sub}</p>}
    </div>
  );
}
