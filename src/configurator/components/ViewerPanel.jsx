import React, { useRef, useEffect } from 'react';
import logoWhite from '../../assets/logo/neo-diamond-logo-white.png';

export function ViewerPanel({ onInit, isReady }) {
  const containerRef = useRef(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current || !containerRef.current) return;

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

      {/* Logo centered at top, over the viewer */}
      <div className="cfg-viewer-logo">
        <img src={logoWhite} alt="Neo Diamond" />
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="cfg-viewer-loader">
          <div className="cfg-viewer-loader-inner">
            <span className="cfg-loader-gem">💎</span>
            <p className="cfg-viewer-loader-text">Загрузка украшения...</p>
          </div>
        </div>
      )}

      <div className="cfg-viewer-hint">Вращайте украшение по экрану</div>
    </div>
  );
}
