import React, { useRef, useEffect } from 'react';

export function ViewerPanel({ onInit }) {
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
      {/* Mask the bottom-left corner where iJewel injects its logo/evaluation banner */}
      <div className="cfg-viewer-logo-mask" aria-hidden="true" />
      <div className="cfg-viewer-hint">Вращайте кольцо двумя пальцами</div>
    </div>
  );
}
