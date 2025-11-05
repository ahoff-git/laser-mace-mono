import { useEffect } from 'react';

// Show console output on mobile devices by injecting Eruda.
// Enabled via ?debug in production; always enabled in development.

const ERUDA_ID = 'eruda-script';

const insertEruda = () => {
  if (document.getElementById(ERUDA_ID)) return; // already added

  const script = document.createElement('script');
  script.id = ERUDA_ID;
  script.src = 'https://cdn.jsdelivr.net/npm/eruda';
  script.onload = () => window.eruda && window.eruda.init();
  // Append to head so Next.js error overlays don't wipe it out.
  document.head.appendChild(script);
};

const shouldEnable = () => {
  if (process.env.NODE_ENV !== 'production') return true;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('debug');
};

export function useMobileConsole({ enabled = shouldEnable() } = {}) {
  if (enabled && typeof window !== 'undefined') insertEruda();
  useEffect(() => {
    if (!enabled) return;
    insertEruda();
  }, [enabled]);
}
