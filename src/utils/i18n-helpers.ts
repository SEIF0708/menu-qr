/**
 * Resolve the initial language for both server-side rendering and the browser.
 * - Browser: prefer the server-rendered document language, then honor localStorage,
 *   then fall back to the navigator language.
 * - Server: read the Accept-Language header exposed through `globalThis.__SSR_LANGUAGE__`.
 *   Fall back to English if nothing is available.
 */
export function getInitialLanguage(): string {
  if (typeof window !== "undefined") {
    const documentLang = document.documentElement.lang?.split("-")[0];
    if (documentLang) return documentLang;

    const stored = localStorage.getItem("menuflow_lang");
    if (stored) return stored;
    return navigator.language.split("-")[0] ?? "en";
  }

  return (globalThis as any).__SSR_LANGUAGE__ ?? "en";
}
