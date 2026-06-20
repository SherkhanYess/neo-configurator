import React, { useRef, useEffect } from 'react';

export function ViewerPanel({ onInit, isReady }) {
  const containerRef = useRef(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current || !containerRef.current) return;

    // iJewel scripts load async; poll until ijewelViewer is available
    const tryInit = () => {
      if (window.ijewelViewer) {
        initialised.current = true;
        onInit?.(containerRef.current);
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }, [onInit]);

  return (
    <div className="cfg-viewer-panel">
      <div ref={containerRef} className="cfg-viewer-container" />

      {/* Loading overlay — shown until iJewel is ready */}
      {!isReady && (
        <div className="cfg-viewer-loader">
          <div className="cfg-viewer-loader-inner">
            <DiamondSpinner />
            <p className="cfg-viewer-loader-text">Загружаем украшение…</p>
          </div>
        </div>
      )}

      <div className="cfg-viewer-hint">Вращайте кольцо двумя пальцами</div>
    </div>
  );
}

function DiamondSpinner() {
  return (
    <svg className="cfg-diamond-spinner" viewBox="0 0 48 48" fill="none" width="48" height="48">
      <path
        d="M24 4L44 16V32L24 44L4 32V16L24 4Z"
        stroke="url(#dg)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(212,175,55,0.08)"
      />
      <path
        d="M4 16h40M24 4L12 16l12 28 12-28L24 4Z"
        stroke="url(#dg)"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <defs>
        <linearGradient id="dg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37"/>
          <stop offset="1" stopColor="#F5E08A"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
