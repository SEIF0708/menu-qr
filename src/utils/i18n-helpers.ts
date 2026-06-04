

/**
 * Resolve the initial language for both server‑side rendering and the browser.
 * - Browser: honour `localStorage` (persisted choice) or the navigator language.
 * - Server: read the `Accept-Language` request header that we expose via
 *   `globalThis.__SSR_LANGUAGE__` in `src/server.ts`. Fallback to the app's
 *   default language (Arabic) if nothing is available.
 */
export function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('menuflow_lang');
    if (stored) return stored;
    return navigator.language.split('-')[0] ?? 'ar';
  }
  // Server side – the header is injected by src/server.ts
  return (globalThis as any).__SSR_LANGUAGE__ ?? 'ar';
}
