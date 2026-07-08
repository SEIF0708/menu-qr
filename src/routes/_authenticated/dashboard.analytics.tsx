import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { 
  getAnalyticsOverview, 
  getTopProducts, 
  getTopCategories, 
  getActiveTables,
  getTimeAnalytics,
  getPromotionStats
} from "@/lib/analytics-service";
import { BarChart3, TrendingUp, Eye, ShoppingCart, Percent, Box, Clock, Users, Activity, Tag, MousePointerClick, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsDashboard,
});

function AnalyticsDashboard() {
  const { t, i18n } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const lang = i18n.language?.split("-")[0] || "en";

  const { data: overview, isLoading: loadingOverview } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-overview", restaurant?.id],
    queryFn: () => getAnalyticsOverview(restaurant!.id),
  });

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-products", restaurant?.id],
    queryFn: () => getTopProducts(restaurant!.id),
  });

  const { data: topCategories, isLoading: loadingCategories } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-categories", restaurant?.id],
    queryFn: () => getTopCategories(restaurant!.id),
  });

  const { data: topTables, isLoading: loadingTables } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-tables", restaurant?.id],
    queryFn: () => getActiveTables(restaurant!.id),
  });
  
  const { data: timeStats, isLoading: loadingTime } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-time", restaurant?.id],
    queryFn: () => getTimeAnalytics(restaurant!.id),
  });

  const { data: promotionStats, isLoading: loadingPromotions } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["analytics-promotions", restaurant?.id],
    queryFn: () => getPromotionStats(restaurant!.id),
  });

  // Simple peak time logic
  let peakTime = "N/A";
  const hourlyData = useMemo(() => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      events: 0
    }));
    
    if (!timeStats) return data;
    
    timeStats.forEach(stat => {
      data[stat.hour_of_day].events += stat.total_events;
    });
    
    return data;
  }, [timeStats]);

  if (timeStats && timeStats.length > 0) {
    let maxHour = -1;
    let maxEvents = -1;
    hourlyData.forEach((d, i) => {
      if (d.events > maxEvents) {
        maxEvents = d.events;
        maxHour = i;
      }
    });
    if (maxHour !== -1) {
      peakTime = `${maxHour.toString().padStart(2, '0')}:00 - ${(maxHour + 1).toString().padStart(2, '0')}:00`;
    }
  }

  const overallConversion = overview?.views ? ((overview.orders / overview.views) * 100).toFixed(1) : "0.0";

  if (restaurant?.subscription_status === "unpaid") {
    return (
      <div className="max-w-md mx-auto mt-12 text-center bg-card border border-border p-8 rounded-3xl shadow-sm animate-fade-up">
        <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="size-8" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">{t("analytics_dashboard.lockedTitle", "Analytics Locked")}</h1>
        <p className="text-muted-foreground mb-6">
          {t("analytics_dashboard.lockedDesc", "Upgrade to a paid subscription to access detailed analytics, top products, category performance, and hourly activity.")}
        </p>
        <Link 
          to="/dashboard/subscription" 
          className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all"
        >
          {t("nav.subscription")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("analytics_dashboard.eyebrow")}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
            <BarChart3 className="size-8 text-primary" /> {t("analytics_dashboard.title")}
          </h1>
        </div>
      </header>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPI 
          icon={<Eye className="size-5" />} 
          label={t("analytics_dashboard.totalViews")} 
          value={overview?.views?.toLocaleString() || "0"} 
          loading={loadingOverview} 
        />
        <KPI 
          icon={<ShoppingCart className="size-5" />} 
          label={t("analytics_dashboard.totalOrders")} 
          value={overview?.orders?.toLocaleString() || "0"} 
          loading={loadingOverview} 
        />
        <KPI 
          icon={<Percent className="size-5" />} 
          label={t("analytics_dashboard.conversionRate")} 
          value={`${overallConversion}%`} 
          loading={loadingOverview} 
          accent 
        />
        <KPI 
          icon={<Clock className="size-5" />} 
          label={t("analytics_dashboard.peakHour")} 
          value={peakTime} 
          loading={loadingTime} 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="size-5 text-accent" />
            <h2 className="text-xl font-display font-bold">{t("analytics_dashboard.topProducts")}</h2>
          </div>
          {loadingProducts ? (
            <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : topProducts?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{t("analytics_dashboard.noData")}</p>
          ) : (
            <div className="space-y-4">
              {topProducts?.map((product, i) => (
                <div key={product.product_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-6 bg-muted rounded flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="font-medium truncate text-sm">
                      {lang === 'fr' ? product.name_fr : lang === 'ar' ? product.name_ar : product.name_en || '—'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-medium text-muted-foreground ml-9 sm:ml-0 bg-muted/30 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg">
                    <div className="flex items-center gap-1.5" title="Views"><Eye className="size-3.5" /> <span>{product.views}</span></div>
                    <div className="flex items-center gap-1.5" title="Orders"><ShoppingCart className="size-3.5" /> <span>{product.orders}</span></div>
                    <div className="flex items-center gap-1.5 font-bold text-accent" title="Conversion Rate"><Percent className="size-3.5" /> <span>{product.conversion_rate?.toFixed(1) || 0}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories Chart & List */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Box className="size-5 text-blue-500" />
            <h2 className="text-xl font-display font-bold">{t("analytics_dashboard.categoryPerformance")}</h2>
          </div>
          {loadingCategories ? (
            <div className="flex-1 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : topCategories?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{t("analytics_dashboard.noData")}</p>
          ) : (
            <>
              <div className="h-48 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={topCategories?.slice(0, 5)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey={lang === 'fr' ? 'name_fr' : 'name_en'} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="views" name="Views" fill="currentColor" className="text-blue-400" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill="currentColor" className="text-primary" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {topCategories?.map((cat, i) => (
                  <div key={cat.category_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {lang === 'fr' ? cat.name_fr : lang === 'ar' ? cat.name_ar : cat.name_en || '—'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-medium text-muted-foreground bg-muted/30 sm:bg-transparent px-3 py-2 sm:p-0 rounded-xl">
                      <div className="flex items-center gap-1.5" title="Views"><Eye className="size-3.5" /> <span>{cat.views}</span></div>
                      <div className="flex items-center gap-1.5" title="Cart Adds"><ShoppingCart className="size-3.5" /> <span>{cat.cart_adds}</span></div>
                      <div className="flex items-center gap-1.5 font-bold text-primary" title="Orders"><BarChart3 className="size-3.5" /> <span>{cat.orders}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hourly Activity Chart */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="size-5 text-purple-500" />
          <h2 className="text-xl font-display font-bold">{t("analytics_dashboard.hourlyActivity")}</h2>
        </div>
        {loadingTime ? (
          <div className="h-64 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" className="text-purple-500" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="currentColor" className="text-purple-500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="events" name="Interactions" stroke="currentColor" className="text-purple-500" strokeWidth={3} fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Active Tables & Promotions Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Tables */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="size-5 text-emerald-500" />
            <h2 className="text-xl font-display font-bold">{t("analytics_dashboard.activeTables")}</h2>
          </div>
          {loadingTables ? (
            <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : topTables?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{t("analytics_dashboard.noData")}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {topTables?.map((table) => (
                <div key={table.table_id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-lg">{table.name}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{table.sessions} {t("analytics_dashboard.sessions")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-background rounded-xl p-2.5 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">{t("analytics_dashboard.orders")}</p>
                      <p className="font-bold text-primary">{table.orders}</p>
                    </div>
                    <div className="bg-background rounded-xl p-2.5 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">{t("analytics_dashboard.requests")}</p>
                      <p className="font-bold">{table.requests}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promotion Performance */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="size-5 text-orange-500" />
            <h2 className="text-xl font-display font-bold">{t("analytics_dashboard.promotionPerformance")}</h2>
          </div>
          {loadingPromotions ? (
            <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : promotionStats?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{t("analytics_dashboard.noPromotions")}</p>
          ) : (
            <div className="space-y-3">
              {promotionStats?.map((promo) => (
                <div key={promo.promotion_id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {lang === 'fr' ? promo.title_fr : lang === 'ar' ? promo.title_ar : promo.title_en || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5 flex items-center gap-1">
                      <Tag className="size-3" /> {promo.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-background border border-border/50 rounded-xl px-3 py-2">
                    <MousePointerClick className="size-4 text-orange-500" />
                    <span className="font-bold">{promo.clicks}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, loading, accent }: { icon: React.ReactNode; label: string; value: string; loading: boolean; accent?: boolean }) {
  return (
    <div className={`p-4 sm:p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${accent ? "bg-primary/10 border-primary/20 text-primary" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium opacity-80 mb-2 sm:mb-3">
        {icon} {label}
      </div>
      {loading ? (
        <div className="h-8 sm:h-10 w-24 bg-muted animate-pulse rounded" />
      ) : (
        <p className={`text-2xl sm:text-4xl font-display font-bold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      )}
    </div>
  );
}
