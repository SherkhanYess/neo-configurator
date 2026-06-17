import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// Capture UTM params internally on page load (not exposed in shareable links)
;(function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k => {
      if (p.get(k)) utm[k] = p.get(k);
    });
    if (Object.keys(utm).length) {
      sessionStorage.setItem('nd_utm', JSON.stringify(utm));
    }
  } catch (_) {}
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
