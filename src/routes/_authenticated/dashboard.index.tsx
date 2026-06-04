import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useSignedImage } from "@/lib/use-signed-image";
import { Plus, FolderPlus, QrCode, ExternalLink, TrendingUp } from "lucide-react";
import { formatPrice, pickLocalized } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const { t, i18n } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const lang = i18n.language?.split("-")[0] || "en";

  const stats = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["dashboard-stats", restaurant?.id],
    queryFn: async () => {
      const rid = restaurant!.id;
      const [{ count: products }, { count: categories }, { count: views }, recent, { data: weekViews }] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("is_available", true),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
        supabase.from("menu_views").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
        supabase.from("products").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).limit(5),
        supabase.from("menu_views").select("viewed_at").eq("restaurant_id", rid).gte("viewed_at", new Date(Date.now() - 7 * 86400000).toISOString()),
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

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("overview.subtitle")}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{t("overview.title")}</h1>
        </div>
        <Link to="/dashboard/products" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20">
          <Plus className="size-4" /> {t("overview.addProduct")}
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        <KPI label={t("overview.totalViews")} value={stats.data?.views ?? 0} hint={`+${stats.data?.weekViews ?? 0} ${t("overview.viewsThisWeek").toLowerCase()}`} accent />
        <KPI label={t("overview.totalProducts")} value={stats.data?.products ?? 0} hint={t("overview.across", { count: stats.data?.categories ?? 0 })} />
        <KPI label={t("overview.totalCategories")} value={stats.data?.categories ?? 0} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <QuickAction to="/dashboard/categories" icon={FolderPlus} label={t("overview.addCategory")} />
        <QuickAction to="/dashboard/qr" icon={QrCode} label={t("overview.generateQr")} />
        <QuickAction
          to={`/menu/${restaurant?.slug ?? ""}` as any} icon={ExternalLink} label={t("overview.openMenu")} external
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-accent" /> {t("overview.recent")}</h3>
          <Link to="/dashboard/products" className="text-sm text-accent hover:underline">→</Link>
        </div>
        {stats.data?.recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t("overview.emptyRecent")}</div>
        ) : (
          <div className="divide-y divide-border">
            {stats.data?.recent.map((p: any) => <RecentRow key={p.id} product={p} lang={lang} currency={restaurant?.currency || "USD"} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${accent ? "bg-accent/10 border-accent/20" : "bg-card border-border"}`}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-4xl font-display font-bold">{value.toLocaleString()}</p>
      {hint && <p className="mt-2 text-[10px] font-mono text-muted-foreground uppercase tracking-tight">{hint}</p>}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, external }: { to: string; icon: any; label: string; external?: boolean }) {
  const cls = "group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all";
  const content = (
    <>
      <div className="size-10 rounded-lg bg-primary/5 grid place-items-center group-hover:bg-primary/10 transition-colors">
        <Icon className="size-5 text-primary" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </>
  );
  if (external) return <a href={to} target="_blank" rel="noreferrer" className={cls}>{content}</a>;
  return <Link to={to as any} className={cls}>{content}</Link>;
}

function RecentRow({ product, lang, currency }: { product: any; lang: string; currency: string }) {
  const img = useSignedImage(product.image_url);
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="size-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {img && <img src={img} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{pickLocalized(product, "name", lang) || "—"}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(product.price, currency, lang)}</p>
      </div>
      {product.is_available ? (
        <span className="px-2 py-1 rounded bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase">●</span>
      ) : (
        <span className="px-2 py-1 rounded bg-muted text-[10px] font-bold text-muted-foreground uppercase">○</span>
      )}
    </div>
  );
}
