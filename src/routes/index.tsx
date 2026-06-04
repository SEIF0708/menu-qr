import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ArrowRight, Languages, Smartphone, QrCode } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuFlow — Digital menus for modern restaurants" },
      { name: "description", content: "Multilingual QR-code menus for restaurants, cafés & bakeries. Set up in under 10 minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold italic text-sm">M</span>
          </div>
          <span className="font-display font-bold text-lg">MenuFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link to="/auth" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("landing.ctaSignIn")}
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:brightness-110 transition-all"
          >
            {t("landing.ctaStart")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-24 md:py-32">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">{t("auth.tagline")}</p>
        <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] text-balance">
          {t("landing.tagline")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed text-pretty">
          {t("landing.lede")}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
          >
            {t("landing.ctaStart")} <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full font-medium hover:bg-muted transition-colors"
          >
            {t("landing.ctaSignIn")}
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            { icon: Languages, t: "f1Title", d: "f1Desc" },
            { icon: Smartphone, t: "f2Title", d: "f2Desc" },
            { icon: QrCode, t: "f3Title", d: "f3Desc" },
          ].map(({ icon: Icon, t: tk, d }) => (
            <div key={tk} className="p-6 rounded-2xl bg-card border border-border">
              <Icon className="size-6 text-accent mb-4" />
              <h3 className="font-display text-xl font-semibold mb-1">{t(`landing.${tk}`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.${d}`)}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MenuFlow
      </footer>
    </div>
  );
}
