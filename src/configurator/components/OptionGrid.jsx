import React from 'react';

export function OptionGrid({ cols = 2, children }) {
  return (
    <div className="cfg-option-grid" style={{ '--grid-cols': cols }}>
      {children}
    </div>
  );
}
