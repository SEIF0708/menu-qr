import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./translations/en.json";
import fr from "./translations/fr.json";
import ar from "./translations/ar.json";
import enLanding from "./translations/landing-ui.en.json";
import frLanding from "./translations/landing-ui.fr.json";
import arLanding from "./translations/landing-ui.ar.json";
import { getInitialLanguage } from "@/utils/i18n-helpers";

export const LANGS = [
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "fr", label: "Français", dir: "ltr" as const },
  { code: "ar", label: "العربية", dir: "rtl" as const },
];

if (!i18n.isInitialized) {
  const mergeLanding = (base: any, landing: any) => ({
    ...base,
    landing: {
      ...(base?.landing ?? {}),
      ...landing,
    },
  });

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: mergeLanding(en, enLanding) },
        fr: { translation: mergeLanding(fr, frLanding) },
        ar: { translation: mergeLanding(ar, arLanding) },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "fr", "ar"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "menuflow_lang",
      },
      lng: getInitialLanguage(),
    });
}

export function applyDirection(lang: string) {
  if (typeof document === "undefined") return;
  const cfg = LANGS.find((l) => l.code === lang);
  document.documentElement.dir = cfg?.dir ?? "ltr";
  document.documentElement.lang = lang;
}

i18n.on("languageChanged", applyDirection);
if (typeof document !== "undefined") applyDirection(i18n.language);

export default i18n;
