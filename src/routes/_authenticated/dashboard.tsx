import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { LangSwitcher } from "@/components/LangSwitcher";
import { LayoutGrid, FolderKanban, UtensilsCrossed, QrCode, Settings, LogOut, ExternalLink, Menu, X, CreditCard, AlertTriangle, Shield, Gift, Table, ShoppingBag, BarChart3, Tag, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: restaurant, isLoading } = useMyRestaurant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && restaurant && !restaurant.onboarding_completed) {
      navigate({ to: "/onboarding" });
    }
  }, [restaurant, isLoading, navigate]);

  const navItems = [
    { to: "/dashboard", label: t("nav.overview"), icon: LayoutGrid, exact: true },
    { to: "/dashboard/analytics", label: t("nav.analytics"), icon: BarChart3, pro: true },
    { to: "/dashboard/categories", label: t("nav.categories"), icon: FolderKanban },
    { to: "/dashboard/products", label: t("nav.products"), icon: UtensilsCrossed },
    { to: "/dashboard/promotions", label: t("nav.promotions"), icon: Tag },
    { to: "/dashboard/qr", label: t("nav.qr"), icon: QrCode },
    { to: "/dashboard/orders", label: t("nav.orders"), icon: ShoppingBag },
    { to: "/dashboard/tables", label: t("nav.tables"), icon: Table },
    { to: "/dashboard/subscription", label: t("nav.subscription"), icon: CreditCard },
    { to: "/dashboard/referrals", label: t("nav.referrals"), icon: Gift },
    { to: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ];

  const { data: session } = useQuery({
    queryKey: ["dashboard-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  if (session?.user?.email === "saifdaba19@gmail.com") {
    navItems.push({ to: "/admin", label: t("nav.admin") || "Admin Panel", icon: Shield } as any);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <nav className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1 -ml-1">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="size-8 bg-primary rounded grid place-items-center">
              <span className="text-primary-foreground font-display font-bold italic text-sm">M</span>
            </div>
            <span className="font-display font-bold text-lg hidden sm:inline">MenuFlow</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {restaurant?.slug && (
            <a
              href={`/menu/${restaurant.slug}`}
              target="_blank" rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              {t("nav.viewMenu")}
            </a>
          )}
          <LangSwitcher />
          <button onClick={signOut} title={t("auth.signOut")} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <LogOut className="size-4" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-60 border-r border-border p-3 gap-1">
          {navItems.map(({ to, label, icon: Icon, exact, pro }: any) => (
            <Link
              key={to} to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(to, exact)
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" /> {label}
              {pro && restaurant?.subscription_status === "unpaid" && <Lock className="size-3 ml-auto opacity-50" />}
            </Link>
          ))}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <aside className="absolute top-14 inset-x-0 bg-card border-b border-border p-3 gap-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
              {navItems.map(({ to, label, icon: Icon, exact, pro }: any) => (
                <Link
                  key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    isActive(to, exact) ? "bg-primary/5 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" /> {label}
                  {pro && restaurant?.subscription_status === "unpaid" && <Lock className="size-3 ml-auto opacity-50" />}
                </Link>
              ))}
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 md:p-8 animate-fade-up">
          {restaurant?.subscription_status === "unpaid" && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">{t("subscriptionWarning.title")}</p>
                <p className="text-xs opacity-80 mt-1">
                  {t("subscriptionWarning.desc")}
                </p>
                <Link to="/dashboard/subscription" className="inline-block mt-2 text-xs font-bold underline">
                  {t("subscriptionWarning.link")} &rarr;
                </Link>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
