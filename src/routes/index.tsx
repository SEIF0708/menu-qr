import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Globe,
  Menu,
  QrCode,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Smartphone,
  Store,
  Layers3,
  Check,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { LangSwitcher } from "@/components/LangSwitcher";
import { getInitialLanguage } from "@/utils/i18n-helpers";
import landingEn from "@/lib/translations/landing-ui.en.json";
import landingFr from "@/lib/translations/landing-ui.fr.json";
import landingAr from "@/lib/translations/landing-ui.ar.json";

export const Route = createFileRoute("/")({
  head: () => {
    const lang = getInitialLanguage() as "en" | "fr" | "ar";
    const copy = { en: landingEn, fr: landingFr, ar: landingAr }[lang] ?? landingEn;
    return {
      meta: [
        { title: `MenuFlow — ${copy.heroTitle}` },
        { name: "description", content: copy.heroSubtitle },
      ],
    };
  },
  component: Landing,
});

const featureCards = [
  {
    icon: Menu,
    titleKey: "landing.features.interactiveTitle",
    descKey: "landing.features.interactiveDesc",
  },
  {
    icon: QrCode,
    titleKey: "landing.features.qrTitle",
    descKey: "landing.features.qrDesc",
  },
  {
    icon: Zap,
    titleKey: "landing.features.updatesTitle",
    descKey: "landing.features.updatesDesc",
  },
  {
    icon: BarChart3,
    titleKey: "landing.features.analyticsTitle",
    descKey: "landing.features.analyticsDesc",
  },
  {
    icon: Sparkles,
    titleKey: "landing.features.brandingTitle",
    descKey: "landing.features.brandingDesc",
  },
  {
    icon: Globe,
    titleKey: "landing.features.languagesTitle",
    descKey: "landing.features.languagesDesc",
  },
];

function Landing() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.split("-")[0] ?? getInitialLanguage()) as "en" | "fr" | "ar";
  const landingCopy = { en: landingEn, fr: landingFr, ar: landingAr }[lang as "en" | "fr" | "ar"] ?? landingEn;
  const t = (key: string) => getNestedValue(landingCopy, key.replace(/^landing\./, "")) as string;

  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [validating, setValidating] = useState(false);

  const handleRefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    try {
      const { data, error } = await supabase.from("referral_codes").select("code").eq("code", refCode.trim()).maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Invalid referral code.");
        return;
      }
      
      const message = t("landing.waMsgReferred") || `Hello, I want to subscribe to MenuFlow for my restaurant. I have the referral code ${data.code}, so my price is 250 DT.`;
      // In case translation doesn't exist, default is used.
      // But we must interpolate the code.
      const finalMessage = message.includes("{{code}}") ? message.replace("{{code}}", data.code) : `Hello, I want to subscribe to MenuFlow for my restaurant. I have the referral code ${data.code}, so my price is 250 DT.`;
      
      const encoded = encodeURIComponent(finalMessage);
      window.open(`https://api.whatsapp.com/send?phone=21629710282&text=${encoded}`, "_blank");
      setRefModalOpen(false);
      setRefCode("");
    } catch(err: any) {
      toast.error(err.message || "Error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {refModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setRefModalOpen(false)} className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-border transition-colors text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
              <CircleDollarSign className="size-6" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">Redeem Code</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Enter your referral code to unlock the 250 DT offer and contact us via WhatsApp to activate.
            </p>
            <form onSubmit={handleRefSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. PARTNER50"
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
              <button disabled={validating} type="submit" className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50">
                {validating ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
                Continue to WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      <BackgroundEffects />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-border bg-primary text-primary-foreground shadow-[0_18px_50px_rgba(74,29,31,0.22)]">
              <span className="font-display text-lg font-bold italic">M</span>
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">{t("brand")}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">QR Menu Platform</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground lg:flex">
            <a href="#demo" className="transition-colors hover:text-foreground">{t("landing.navDemo")}</a>
            <a href="#features" className="transition-colors hover:text-foreground">{t("landing.navFeatures")}</a>
            <a href="#analytics" className="transition-colors hover:text-foreground">{t("landing.navAnalytics")}</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">{t("landing.navPricing")}</a>
            <a href="#partners" className="transition-colors hover:text-foreground">{t("landing.navPartners")}</a>
          </nav>

          <div className="flex items-center gap-3">
            <LangSwitcher variant="subtle" />
            <Link
              to="/auth"
              className="hidden rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/25 hover:text-foreground sm:inline-flex"
            >
              {t("landing.ctaSignIn") || "Sign in"}
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_rgba(74,29,31,0.20)] transition hover:scale-[1.02] hover:brightness-110"
            >
              {t("landing.ctaStart")} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
        <section className="grid items-center gap-8 py-8 sm:gap-14 sm:py-14 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground shadow-sm">
              <ShieldCheck className="size-3.5 text-accent" />
              {t("landing.heroBadge")}
            </div>

            <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:mt-7 sm:text-5xl md:text-6xl lg:text-7xl">
              {t("landing.heroTitle")}
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
              {t("landing.heroSubtitle")}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_50px_rgba(74,29,31,0.20)] transition hover:scale-[1.02] hover:brightness-110"
              >
                {t("landing.ctaStart")} <ArrowRight className="size-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/20 hover:bg-muted"
              >
                {t("landing.ctaDemo")} <ChevronRight className="size-4" />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
              {[
                { value: t("landing.heroStat1Value"), label: t("landing.heroStat1Label") },
                { value: t("landing.heroStat2Value"), label: t("landing.heroStat2Label") },
                { value: t("landing.heroStat3Value"), label: t("landing.heroStat3Label") },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4"
                >
                  <div className="font-display text-lg font-semibold text-foreground sm:text-2xl">{stat.value}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground sm:text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="relative mx-auto w-full max-w-[620px]"
          >
            <div className="absolute -left-3 top-10 hidden lg:block">
              <FloatingCard
                className="w-44"
                title={t("landing.mockupScanTitle")}
                value={t("landing.mockupScanValue")}
                subtitle={t("landing.mockupScanSubtitle")}
                icon={<QrCode className="size-4 text-primary" />}
              />
            </div>
            <div className="absolute -right-2 top-32 hidden lg:block">
              <FloatingCard
                className="w-48"
                title={t("landing.mockupAnalyticsTitle")}
                value={t("landing.mockupAnalyticsValue")}
                subtitle={t("landing.mockupAnalyticsSubtitle")}
                icon={<BarChart3 className="size-4 text-accent" />}
              />
            </div>
            <div className="absolute -bottom-4 left-8 hidden lg:block">
              <FloatingCard
                className="w-52"
                title={t("landing.mockupUpdateTitle")}
                value={t("landing.mockupUpdateValue")}
                subtitle={t("landing.mockupUpdateSubtitle")}
                icon={<Zap className="size-4 text-primary" />}
              />
            </div>

            <div className="relative rounded-[2.25rem] border border-border bg-card/90 p-3 shadow-[0_30px_100px_rgba(74,29,31,0.10)] backdrop-blur-2xl">
              <div className="rounded-[1.9rem] border border-border bg-background p-4">
                <div className="flex items-center justify-between px-2 pb-4">
                  <div>
                    <div className="font-display text-lg font-semibold text-foreground">{t("landing.mockupTitle")}</div>
                    <div className="text-xs text-muted-foreground">{t("landing.mockupSubtitle")}</div>
                  </div>
                  <div className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent">
                    {t("landing.mockupLive")}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
                  <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(250,249,246,0.9))] p-4">
                    <div className="mx-auto mb-4 h-1.5 w-24 rounded-full bg-foreground/15" />
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-[linear-gradient(135deg,rgba(74,29,31,0.95),rgba(197,160,89,0.9))] shadow-lg shadow-primary/15" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">{t("landing.mockupMenuTitle")}</div>
                        <div className="text-xs text-muted-foreground">{t("landing.mockupMenuSubtitle")}</div>
                      </div>
                      <div className="grid size-11 place-items-center rounded-2xl border border-border bg-card">
                        <QrCode className="size-5 text-primary" />
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 overflow-hidden">
                      {[t("landing.mockupTab1"), t("landing.mockupTab2"), t("landing.mockupTab3"), t("landing.mockupTab4")].map((item, index) => (
                        <div
                          key={item}
                          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                            index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
                      {[
                        { name: t("landing.mockupDish1"), price: "$24" },
                        { name: t("landing.mockupDish2"), price: "$18" },
                        { name: t("landing.mockupDish3"), price: "$31" },
                      ].map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 sm:rounded-2xl sm:p-3">
                          <div className="size-12 overflow-hidden rounded-xl border border-border bg-background sm:size-16 sm:rounded-2xl">
                            <DishArtwork kind={index === 0 ? "ravioli" : index === 1 ? "salade" : "bar"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-foreground sm:text-sm">{item.name}</div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">{t("landing.mockupDishHint")}</div>
                          </div>
                          <div className="text-xs font-semibold text-foreground sm:text-sm">{item.price}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pointer-events-none absolute inset-x-8 top-20 h-40 rounded-full bg-primary/10 blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-12 top-10 h-[180px] rounded-full bg-accent/10 blur-3xl" />
                    <div className="scan-line pointer-events-none absolute inset-x-4 top-8 h-24 rounded-[2rem] border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent" />
                  </div>

                  <div className="grid gap-4">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("landing.mockupConversionLabel")}</div>
                          <div className="mt-2 font-display text-2xl font-semibold text-foreground">{t("landing.mockupConversionValue")}</div>
                        </div>
                        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <TrendingUp className="size-5" />
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conversion diagram</div>
                            <div className="mt-1 text-sm font-medium text-foreground">Scan → View → Order</div>
                          </div>
                          <div className="flex size-20 items-center justify-center rounded-full bg-[conic-gradient(var(--color-primary)_0_66%,var(--color-accent)_66%_100%)] p-2">
                            <div className="grid size-full place-items-center rounded-full bg-background text-center">
                              <div>
                                <div className="font-display text-xl font-semibold text-foreground">18.4%</div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Orders</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                          {[
                            { label: "Scans", value: "100%", tone: "bg-primary/10 text-primary" },
                            { label: "Menu views", value: "42%", tone: "bg-accent/15 text-accent" },
                            { label: "Orders", value: "18.4%", tone: "bg-foreground/5 text-foreground" },
                          ].map((step, index) => (
                            <div key={step.label} className="rounded-xl border border-border bg-card p-2 text-center sm:rounded-2xl sm:p-3">
                              <div className={`mx-auto flex size-8 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl ${step.tone}`}>{index + 1}</div>
                              <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:mt-3 sm:text-xs">{step.label}</div>
                              <div className="mt-1 font-display text-sm font-semibold text-foreground sm:text-lg">{step.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {[
                        { label: t("landing.mockupDailyViews"), value: "12.8k" },
                        { label: t("landing.mockupScanTime"), value: "7s" },
                        { label: t("landing.mockupShares"), value: "1,304" },
                        { label: t("landing.mockupPeakHours"), value: "7–9 PM" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[1.25rem] border border-border bg-card p-3 sm:rounded-[1.5rem] sm:p-4">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">{item.label}</div>
                          <div className="mt-2 font-display text-lg font-semibold text-foreground sm:mt-3 sm:text-xl">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="demo" className="scroll-mt-24 py-12 lg:py-20">
          <SectionLabel eyebrow={t("landing.demoEyebrow")} title={t("landing.demoTitle")} />
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[460px]"
            >
              <div className="absolute -inset-4 rounded-[3rem] bg-[radial-gradient(circle_at_top,rgba(74,29,31,0.12),transparent_60%)] blur-2xl" />
              <PhoneFrame>
                <iframe
                  title="Menu demo"
                  src="https://menu-qr-rho.vercel.app/menu/lejardindeslegumes"
                  className="h-full w-full border-0 bg-background"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </PhoneFrame>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-center"
            >
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "landing.demoBadge1",
                    "landing.demoBadge2",
                    "landing.demoBadge3",
                    "landing.demoBadge4",
                    "landing.demoBadge5",
                  ].map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                    >
                      <BadgeCheck className="size-4 text-accent" />
                      {t(key)}
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                  {t("landing.demoCopy")}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-12 lg:py-20">
          <SectionLabel eyebrow={t("landing.featuresEyebrow")} title={t("landing.featuresTitle")} />
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("landing.featuresIntro")}
          </p>

          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:mt-10 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
            {featureCards.map((card, index) => (
              <motion.article
                key={card.titleKey}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.04 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group w-[85vw] shrink-0 snap-center rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition will-change-transform hover:shadow-[0_18px_60px_rgba(74,29,31,0.10)] sm:w-auto sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary transition group-hover:border-primary/20 group-hover:bg-primary/5 sm:size-12 sm:rounded-2xl">
                  <card.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground sm:mt-5 sm:text-2xl">{t(card.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:leading-7">{t(card.descKey)}</p>
                <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60 sm:mt-6 sm:text-xs">
                  <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  {t("landing.featuresHover")}
                  <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="analytics" className="scroll-mt-24 py-12 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75 }}
            >
              <SectionLabel eyebrow={t("landing.analyticsEyebrow")} title={t("landing.analyticsTitle")} />
              <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
                {t("landing.analyticsIntro")}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: t("landing.analyticsStat1Label"), value: t("landing.analyticsStat1Value"), icon: Radar },
                  { label: t("landing.analyticsStat2Label"), value: t("landing.analyticsStat2Value"), icon: ScanLine },
                  { label: t("landing.analyticsStat3Label"), value: t("landing.analyticsStat3Value"), icon: Sparkles },
                  { label: t("landing.analyticsStat4Label"), value: t("landing.analyticsStat4Value"), icon: CalendarClock },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 5, delay: index * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="rounded-[1.25rem] border border-border bg-card p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5"
                  >
                    <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">{item.label}</div>
                        <div className="mt-1 font-display text-2xl font-semibold text-foreground sm:mt-3 sm:text-3xl">{item.value}</div>
                      </div>
                      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary sm:size-11 sm:rounded-2xl">
                        <item.icon className="size-4 sm:size-5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75 }}
              className="rounded-[2rem] border border-border bg-card p-5 shadow-sm"
            >
              <div className="rounded-[1.75rem] border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dashboard Preview</div>
                    <div className="mt-2 font-display text-2xl font-semibold text-foreground">{t("landing.analyticsPanelTitle")}</div>
                  </div>
                  <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                    {t("landing.analyticsGrowth")}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.5rem] border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Chart</div>
                        <div className="text-sm font-medium text-foreground">{t("landing.analyticsChartTitle") || "Views over time"}</div>
                      </div>
                      <div className="text-xs text-primary">{t("landing.analyticsLive")}</div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-3 sm:p-4">
                      <svg viewBox="0 0 360 190" className="h-32 w-full sm:h-48" role="img" aria-label={t("landing.analyticsChartTitle") || "Views over time"}>
                        <defs>
                          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        {[30, 70, 110, 150].map((y) => (
                          <line key={y} x1="24" y1={y} x2="336" y2={y} stroke="currentColor" strokeOpacity="0.08" />
                        ))}
                        <polyline
                          fill="url(#chartFill)"
                          stroke="var(--color-primary)"
                          strokeWidth="3"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points="24,140 64,120 104,126 144,94 184,78 224,88 264,58 304,66 336,42 336,174 24,174"
                        />
                        <polyline
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="4"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points="24,140 64,120 104,126 144,94 184,78 224,88 264,58 304,66 336,42"
                        />
                        <circle cx="336" cy="42" r="6" fill="var(--color-accent)" />
                        <circle cx="184" cy="78" r="5" fill="var(--color-primary)" />
                        <text x="24" y="186" fontSize="11" fill="currentColor" opacity="0.55">Mon</text>
                        <text x="98" y="186" fontSize="11" fill="currentColor" opacity="0.55">Tue</text>
                        <text x="172" y="186" fontSize="11" fill="currentColor" opacity="0.55">Wed</text>
                        <text x="246" y="186" fontSize="11" fill="currentColor" opacity="0.55">Thu</text>
                        <text x="318" y="186" fontSize="11" fill="currentColor" opacity="0.55">Fri</text>
                      </svg>
                    </div>
                  </div>

                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-1 lg:gap-4 lg:overflow-visible lg:pb-0">
                    {[
                      { label: t("landing.analyticsSide1Label"), value: t("landing.analyticsSide1Value") },
                      { label: t("landing.analyticsSide2Label"), value: t("landing.analyticsSide2Value") },
                      { label: t("landing.analyticsSide3Label"), value: t("landing.analyticsSide3Value") },
                    ].map((item) => (
                      <div key={item.label} className="w-[140px] shrink-0 snap-center rounded-[1.25rem] border border-border bg-card p-3 sm:w-[180px] sm:rounded-[1.5rem] sm:p-4 lg:w-auto">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">{item.label}</div>
                        <div className="mt-2 font-display text-lg font-semibold text-foreground sm:mt-3 sm:text-xl">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="partners" className="scroll-mt-24 py-12 lg:py-20">
          <SectionLabel eyebrow={t("landing.partnersEyebrow")} title={t("landing.partnersTitle")} />
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75 }}
            >
              <p className="max-w-xl text-muted-foreground">
                {t("landing.partnersIntro")}
              </p>

              <div className="mt-8 space-y-3 sm:space-y-4">
                {[
                  { label: t("landing.partnersStep1"), hint: t("landing.partnersStep1Hint") },
                  { label: t("landing.partnersStep2"), hint: t("landing.partnersStep2Hint") },
                  { label: t("landing.partnersStep3"), hint: t("landing.partnersStep3Hint") },
                  { label: t("landing.partnersStep4"), hint: t("landing.partnersStep4Hint") },
                ].map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3 sm:gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card font-semibold text-foreground sm:size-12 sm:rounded-2xl">
                      {index + 1}
                    </div>
                    <div className="flex-1 rounded-[1.25rem] border border-border bg-card px-4 py-3 shadow-sm sm:rounded-[1.35rem] sm:px-5 sm:py-4">
                      <div className="font-display text-base font-semibold text-foreground sm:text-lg">{step.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{step.hint}</div>
                    </div>
                    {index < 3 && <ArrowRightLeft className="hidden size-4 text-muted-foreground lg:block" />}
                  </div>
                ))}
              </div>

              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_50px_rgba(74,29,31,0.20)] transition hover:scale-[1.02] hover:brightness-110"
              >
                {t("landing.partnersCta")} <CircleDollarSign className="size-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75 }}
              className="rounded-[2rem] border border-border bg-card p-5 shadow-sm"
            >
              <div className="rounded-[1.75rem] border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Partner Dashboard</div>
                    <div className="mt-2 font-display text-2xl font-semibold text-foreground">{t("landing.partnersPanelTitle")}</div>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { label: t("landing.partnersStat1Label"), value: t("landing.partnersStat1Value") },
                    { label: t("landing.partnersStat2Label"), value: t("landing.partnersStat2Value") },
                    { label: t("landing.partnersStat3Label"), value: t("landing.partnersStat3Value") },
                    { label: t("landing.partnersStat4Label"), value: t("landing.partnersStat4Value") },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] border border-border bg-card p-3 sm:rounded-[1.35rem] sm:p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">{item.label}</div>
                      <div className="mt-2 font-display text-lg font-semibold text-foreground sm:mt-3 sm:text-xl">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-card text-primary shadow-sm">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t("landing.partnersFlowTitle")}</div>
                      <div className="text-sm text-muted-foreground">{t("landing.partnersFlowCopy")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 py-12 lg:py-20">
          <SectionLabel eyebrow={t("landing.pricingEyebrow")} title={t("landing.pricingTitle")} />
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("landing.pricingIntro")}
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Standard Plan */}
            <div className="flex flex-col rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h3 className="font-display text-2xl font-semibold text-foreground">{t("landing.pricingPlanTitle")}</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-foreground">
                  {t("landing.pricingPlanPrice")}
                  <span className="ml-1 text-xl font-semibold text-muted-foreground">{t("landing.pricingPlanPeriod")}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t("landing.pricingPlanDesc")}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm text-muted-foreground">
                {[
                  "landing.pricingPlanFeat1",
                  "landing.pricingPlanFeat2",
                  "landing.pricingPlanFeat3",
                  "landing.pricingPlanFeat4",
                  "landing.pricingPlanFeat5",
                  "landing.pricingPlanFeat6",
                  "landing.pricingPlanFeat7",
                  "landing.pricingPlanFeat8",
                  "landing.pricingPlanFeat9",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="size-5 shrink-0 text-primary" />
                    <span>{t(feature)}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`https://api.whatsapp.com/send?phone=21629710282&text=${encodeURIComponent(t("landing.pricingPlanWaText", { defaultValue: "Hello, I would like to subscribe to MenuFlow for my restaurant." }))}`}
                target="_blank"
                rel="noreferrer"
                className="mt-auto block w-full rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all"
              >
                {t("landing.pricingPlanCta")}
              </a>
            </div>

            {/* Referral Discount */}
            <div className="flex flex-col rounded-[2rem] border-2 border-accent/40 bg-accent/5 p-6 shadow-sm sm:p-8 relative">
              <div className="absolute -top-4 left-0 right-0 mx-auto w-max rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-sm">
                {t("landing.pricingRefBadge")}
              </div>
              <div className="mb-6 mt-2">
                <h3 className="font-display text-2xl font-semibold text-foreground">{t("landing.pricingRefTitle")}</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-foreground">
                  {t("landing.pricingRefPrice")}
                  <span className="ml-1 text-xl font-semibold text-muted-foreground">{t("landing.pricingPlanPeriod")}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground font-medium text-accent">{t("landing.pricingRefDesc")}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Check className="size-5 shrink-0 text-accent" />
                  <span>{t("landing.pricingRefFeat1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="size-5 shrink-0 text-accent" />
                  <span>{t("landing.pricingRefFeat2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="size-5 shrink-0 text-accent" />
                  <span dangerouslySetInnerHTML={{ __html: t("landing.pricingRefFeat3") }} />
                </li>
              </ul>
              <button
                onClick={() => setRefModalOpen(true)}
                className="mt-auto block w-full rounded-xl bg-accent px-4 py-3.5 text-center text-sm font-semibold text-accent-foreground shadow-sm hover:brightness-110 transition-all"
              >
                {t("landing.pricingRefCta")}
              </button>
            </div>

            {/* Partner Program */}
            <div className="flex flex-col rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h3 className="font-display text-2xl font-semibold text-foreground">{t("landing.pricingPartnerTitle")}</h3>
                <p className="mt-4 text-sm font-medium text-foreground">{t("landing.pricingPartnerSubtitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("landing.pricingPartnerDesc")}
                </p>
              </div>
              
              <div className="mb-6 rounded-2xl bg-muted/50 p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("landing.pricingPartnerRatesTitle")}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>{t("landing.pricingPartnerRates1")}</span>
                    <span className="font-bold text-foreground">{t("landing.pricingPartnerRates1Val")}</span>
                  </li>
                  <li className="flex justify-between border-t border-border/50 pt-2">
                    <span>{t("landing.pricingPartnerRates2")}</span>
                    <span className="font-bold text-emerald-600">{t("landing.pricingPartnerRates2Val")}</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("landing.pricingPartnerExTitle")}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><ArrowRight className="size-3 text-muted-foreground"/> <span dangerouslySetInnerHTML={{ __html: t("landing.pricingPartnerEx1") }} /></li>
                  <li className="flex items-center gap-2"><ArrowRight className="size-3 text-muted-foreground"/> <span dangerouslySetInnerHTML={{ __html: t("landing.pricingPartnerEx2") }} /></li>
                  <li className="flex items-center gap-2"><ArrowRight className="size-3 text-muted-foreground"/> <span dangerouslySetInnerHTML={{ __html: t("landing.pricingPartnerEx3") }} /></li>
                </ul>
              </div>

              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="mt-auto block w-full rounded-xl border-2 border-primary/20 bg-transparent px-4 py-3.5 text-center text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
              >
                {t("landing.pricingPartnerCta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(74,29,31,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(197,160,89,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(250,249,246,0.9))] p-6 shadow-[0_40px_140px_rgba(74,29,31,0.10)] sm:rounded-[2.5rem] md:p-12"
          >
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" />
            <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl animate-float-slower" />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground shadow-sm">
                  <Sparkles className="size-3.5 text-accent" />
                  {t("landing.finalBadge")}
                </div>
                <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  {t("landing.finalTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  {t("landing.finalCopy")}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_50px_rgba(74,29,31,0.20)] transition hover:scale-[1.02] hover:brightness-110"
                  >
                    {t("landing.ctaStart")} <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/20 hover:bg-muted"
                  >
                    {t("landing.ctaSchedule")} <ChevronRight className="size-4" />
                  </a>
                </div>
              </div>

              <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-1">
                {[
                  { title: t("landing.finalCard1Title"), detail: t("landing.finalCard1Copy") },
                  { title: t("landing.finalCard2Title"), detail: t("landing.finalCard2Copy") },
                  { title: t("landing.finalCard3Title"), detail: t("landing.finalCard3Copy") },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className={`w-[85vw] shrink-0 snap-center rounded-[1.25rem] border border-border bg-card p-4 shadow-sm sm:w-auto sm:rounded-[1.5rem] sm:p-5 ${index === 1 ? "sm:translate-y-4 lg:translate-y-0" : ""}`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">0{index + 1}</div>
                    <div className="mt-2 font-display text-lg font-semibold text-foreground sm:mt-3 sm:text-xl">{item.title}</div>
                    <div className="mt-1.5 text-xs leading-6 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-7">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function BackgroundEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(74,29,31,0.08),transparent_38%),radial-gradient(circle_at_20%_20%,rgba(197,160,89,0.14),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(74,29,31,0.06),transparent_25%)]" />
      <div className="absolute left-1/2 top-8 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-16 right-[-4rem] h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-float-slower" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(74,29,31,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,29,31,0.03)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" />
    </div>
  );
}

function SectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground shadow-sm">
        {eyebrow}
      </div>
      <h2 className="mt-5 text-balance font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function FloatingCard({
  title,
  value,
  subtitle,
  icon,
  className = "",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 text-foreground shadow-[0_16px_40px_rgba(74,29,31,0.08)] backdrop-blur-2xl ${className}`}>
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary/10">{icon}</div>
        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[340px] rounded-[2.5rem] border border-border bg-card p-3 shadow-[0_40px_120px_rgba(74,29,31,0.12)] backdrop-blur-2xl">
      <div className="absolute left-1/2 top-4 z-10 h-1.5 w-28 -translate-x-1/2 rounded-full bg-foreground/15" />
      <div className="absolute left-1/2 top-7 z-10 h-0.5 w-14 -translate-x-1/2 rounded-full bg-foreground/10" />
      <div className="overflow-hidden rounded-[2rem] border border-border bg-background">
        <div className="h-[450px] w-full sm:h-[600px] md:h-[760px]">{children}</div>
      </div>
    </div>
  );
}

function getNestedValue(source: Record<string, any>, path: string): unknown {
  return path.split(".").reduce((current: any, part) => (current ? current[part] : undefined), source);
}

function DishArtwork({ kind }: { kind: "ravioli" | "salade" | "bar" }) {
  if (kind === "ravioli") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="r1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7efe1" />
            <stop offset="100%" stopColor="#d9b77a" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="#f8f3ea" />
        <circle cx="32" cy="33" r="20" fill="#fffaf1" stroke="#ead9bb" strokeWidth="2" />
        <g fill="url(#r1)" stroke="#b98e4b" strokeWidth="1.2">
          <rect x="18" y="20" width="12" height="12" rx="2.5" transform="rotate(-10 18 20)" />
          <rect x="32" y="20" width="12" height="12" rx="2.5" transform="rotate(10 32 20)" />
          <rect x="25" y="31" width="12" height="12" rx="2.5" transform="rotate(6 25 31)" />
        </g>
        <path d="M17 40c4 4 11 7 15 7 6 0 13-3 15-7" fill="none" stroke="#7f5b28" strokeLinecap="round" strokeWidth="1.6" opacity="0.45" />
        <circle cx="20" cy="18" r="3" fill="#c2523d" opacity="0.85" />
        <circle cx="45" cy="19" r="2.5" fill="#8a6f3d" opacity="0.75" />
      </svg>
    );
  }

  if (kind === "salade") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#eef7ef" />
        <circle cx="32" cy="33" r="21" fill="#fffdf8" stroke="#d9ead9" strokeWidth="2" />
        <ellipse cx="25" cy="30" rx="12" ry="8" fill="#63b46d" opacity="0.9" transform="rotate(-22 25 30)" />
        <ellipse cx="39" cy="28" rx="10" ry="7" fill="#4fa95b" opacity="0.88" transform="rotate(20 39 28)" />
        <circle cx="32" cy="37" r="8" fill="#f8efe8" stroke="#e6ddd5" strokeWidth="1.5" />
        <circle cx="21" cy="40" r="4" fill="#df5a58" />
        <circle cx="44" cy="41" r="3.5" fill="#e56f61" />
        <circle cx="27" cy="22" r="3" fill="#f0d56b" />
        <circle cx="42" cy="20" r="2.5" fill="#f2c45f" />
        <path d="M18 47c7-4 20-6 28-2" fill="none" stroke="#7fc48a" strokeLinecap="round" strokeWidth="2" opacity="0.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#f4f1ea" />
      <circle cx="32" cy="33" r="21" fill="#fbf6ed" stroke="#e2d7c5" strokeWidth="2" />
      <path d="M19 33c4-8 26-8 27 0-1 8-8 15-13 15-5 0-11-7-14-15Z" fill="#7e8d5b" />
      <path d="M22 31c3-5 16-5 20 0" fill="none" stroke="#3f4f2d" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 37c5 2 11 2 16 0" fill="none" stroke="#3f4f2d" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 27h12" stroke="#c8a45d" strokeLinecap="round" strokeWidth="2" />
      <circle cx="22" cy="24" r="3" fill="#d67e53" />
      <circle cx="43" cy="23" r="2.4" fill="#a75835" />
    </svg>
  );
}
