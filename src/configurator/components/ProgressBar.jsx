import React from 'react';

export function ProgressBar({ value }) {
  return (
    <div style={{
      width: '100%', height: '3px',
      background: 'var(--glass-border)',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.round(value * 100)}%`,
        background: 'var(--accent)',
        borderRadius: '0 2px 2px 0',
        transition: 'width 0.35s var(--ease-out)',
      }} />
    </div>
  );
}
