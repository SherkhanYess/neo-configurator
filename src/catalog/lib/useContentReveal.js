import { useState, useEffect } from 'react';

// Decides when the product card's options become visible.
//
// The panel used to be tied to isConfigured alone, which made the 3D a hard
// dependency for the whole page: the SDK is 4.2 MB from a third-party CDN, and
// when it fails to arrive — a flaky in-app browser, a blocked host, a slow
// connection — the visitor is left staring at "Загрузка украшения..." with the
// price, the options and the CTA all sitting at opacity 0 underneath.
//
// Now the 3D gets a grace period to win the race. If it does not, the card
// shows anyway: a page without the ring spinning is still a page you can buy
// from, and a blank one is not.

export const REVEAL_TIMEOUT_MS = 6000;

export function useContentReveal(isConfigured, key) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setExpired(false);
    const t = setTimeout(() => setExpired(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [key]);

  return {
    // Show the options once the ring is ready, or once waiting stops being reasonable.
    visible: isConfigured || expired,
    // True only in the failure case, so the viewer can say something honest
    // instead of promising a load that is not coming.
    stalled: !isConfigured && expired,
  };
}
