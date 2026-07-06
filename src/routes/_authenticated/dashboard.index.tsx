import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useSignedImage } from "@/lib/use-signed-image";
import { Plus, FolderPlus, QrCode, ExternalLink, TrendingUp, Copy, Check, Eye, Box, LayoutGrid, BarChart3, Settings } from "lucide-react";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const { t, i18n } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const lang = i18n.language?.split("-")[0] || "en";
  const [copied, setCopied] = useState(false);

  const stats = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["dashboard-stats", restaurant?.id],
    queryFn: async () => {
      const rid = restaurant!.id;
      const [{ count: products }, { count: categories }, { count: views }, recent, { data: weekViews }] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("is_available", true),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("event_type", "menu_view"),
        supabase.from("products").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).limit(5),
        supabase.from("analytics_events").select("created_at").eq("restaurant_id", rid).eq("event_type", "menu_view").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);
      return {
        products: products ?? 0,
        categories: categories ?? 0,
        views: views ?? 0,
        weekViews: weekViews?.length ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const menuUrl = typeof window !== 'undefined' && restaurant?.slug 
    ? `${window.location.origin}/menu/${restaurant.slug}`
    : `https://menuqr.com/menu/${restaurant?.slug || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("overview.subtitle") || "Welcome Back"}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{t("overview.title") || "Dashboard Overview"}</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a 
            href={`/menu/${restaurant?.slug || ''}`} 
            target="_blank" 
            rel="noreferrer"
            className="group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold overflow-hidden shadow-lg hover:shadow-primary/25 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <ExternalLink className="size-4 relative z-10 text-white" /> 
            <span className="relative z-10 text-white drop-shadow-sm">View Live Menu</span>
          </a>
          <Link to="/dashboard/products" className="inline-flex items-center justify-center gap-2 bg-muted text-foreground border border-border px-5 py-2.5 rounded-full font-bold text-sm hover:bg-muted/80 transition-all active:scale-95">
            <Plus className="size-4" /> {t("overview.addProduct") || "Add Product"}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <KPI 
          icon={<Eye className="size-5" />}
          label={t("overview.totalViews") || "Total Menu Views"} 
          value={stats.data?.views ?? 0} 
          hint={`+${stats.data?.weekViews ?? 0} ${t("overview.viewsThisWeek")?.toLowerCase() || "this week"}`} 
          accent 
        />
        <KPI 
          icon={<Box className="size-5" />}
          label={t("overview.totalProducts") || "Active Products"} 
          value={stats.data?.products ?? 0} 
          hint={t("overview.across", { count: stats.data?.categories ?? 0 }) || `Across ${stats.data?.categories ?? 0} categories`} 
        />
        <KPI 
          icon={<LayoutGrid className="size-5" />}
          label={t("overview.totalCategories") || "Total Categories"} 
          value={stats.data?.categories ?? 0} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction to="/dashboard/categories" icon={FolderPlus} label={t("overview.addCategory") || "Add Category"} />
        <QuickAction to="/dashboard/qr" icon={QrCode} label={t("overview.generateQr") || "QR Builder"} />
        <QuickAction to="/dashboard/analytics" icon={BarChart3} label="Analytics" />
        <QuickAction to="/dashboard/settings" icon={Settings} label="Settings" />
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <TrendingUp className="size-5 text-accent" /> {t("overview.recent") || "Recently Added"}
          </h3>
          <Link to="/dashboard/products" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
            View All &rarr;
          </Link>
        </div>
        {stats.data?.recent.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center">
            <Box className="size-12 opacity-20 mb-3" />
            {t("overview.emptyRecent") || "No products added yet."}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {stats.data?.recent.map((p: any) => <RecentRow key={p.id} product={p} lang={lang} currency={restaurant?.currency || "TND"} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${accent ? "bg-primary/10 border-primary/20" : "bg-card border-border"}`}>
      <div className={`flex items-center gap-2 text-sm font-medium opacity-80 mb-3 ${accent ? "text-primary" : "text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <p className={`text-4xl font-display font-bold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
        {value.toLocaleString()}
      </p>
      {hint && <p className="mt-3 text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">{hint}</p>}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to as any} className="group flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all active:scale-95 text-center sm:text-left">
      <div className="size-10 sm:size-12 rounded-xl bg-muted/50 group-hover:bg-primary/10 grid place-items-center transition-colors shrink-0">
        <Icon className="size-5 sm:size-6 text-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="font-bold text-sm sm:text-base sm:mt-2.5">{label}</span>
    </Link>
  );
}

function RecentRow({ product, lang, currency }: { product: any; lang: string; currency: string }) {
  const img = useSignedImage(product.image_url);
  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
      <div className="size-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
        {img ? (
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center bg-muted/50"><Box className="size-5 text-muted-foreground/50" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate text-base">{pickLocalized(product, "name", lang) || "—"}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{formatPrice(product.price, currency, lang)}</p>
      </div>
      {product.is_available ? (
        <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
        </span>
      ) : (
        <span className="px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          Draft
        </span>
      )}
    </div>
  );
}

