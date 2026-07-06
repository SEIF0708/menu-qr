import { createFileRoute } from "@tanstack/react-router";
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
import { BarChart3, TrendingUp, Eye, ShoppingCart, Percent, Box, Clock } from "lucide-react";

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
  if (timeStats && timeStats.length > 0) {
    const hourlyGroups: Record<number, number> = {};
    timeStats.forEach(stat => {
      hourlyGroups[stat.hour_of_day] = (hourlyGroups[stat.hour_of_day] || 0) + stat.total_events;
    });
    
    let maxHour = -1;
    let maxEvents = -1;
    Object.entries(hourlyGroups).forEach(([hour, events]) => {
      if (events > maxEvents) {
        maxEvents = events;
        maxHour = Number(hour);
      }
    });
    
    if (maxHour !== -1) {
      peakTime = `${maxHour.toString().padStart(2, '0')}:00 - ${(maxHour + 1).toString().padStart(2, '0')}:00`;
    }
  }

  const overallConversion = overview?.views ? ((overview.orders / overview.views) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Intelligence</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
            <BarChart3 className="size-8 text-primary" /> Analytics V2
          </h1>
        </div>
      </header>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPI 
          icon={<Eye className="size-5" />} 
          label="Total Menu Views" 
          value={overview?.views?.toLocaleString() || "0"} 
          loading={loadingOverview} 
        />
        <KPI 
          icon={<ShoppingCart className="size-5" />} 
          label="Total Orders Sent" 
          value={overview?.orders?.toLocaleString() || "0"} 
          loading={loadingOverview} 
        />
        <KPI 
          icon={<Percent className="size-5" />} 
          label="Avg Conversion Rate" 
          value={`${overallConversion}%`} 
          loading={loadingOverview} 
          accent 
        />
        <KPI 
          icon={<Clock className="size-5" />} 
          label="Peak Activity Hour" 
          value={peakTime} 
          loading={loadingTime} 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="size-5 text-accent" />
            <h2 className="text-xl font-display font-bold">Top Products</h2>
          </div>
          {loadingProducts ? (
            <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : topProducts?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data available yet.</p>
          ) : (
            <div className="space-y-4">
              {topProducts?.map((product, i) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-6 bg-muted rounded flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="font-medium truncate text-sm">
                      {lang === 'fr' ? product.name_fr : lang === 'ar' ? product.name_ar : product.name_en || '—'}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-muted-foreground shrink-0 pl-4">
                    <span className="w-16 text-right">{product.views} views</span>
                    <span className="w-12 text-right">{product.orders} ord.</span>
                    <span className="w-12 text-right font-bold text-accent">{product.conversion_rate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Box className="size-5 text-blue-500" />
            <h2 className="text-xl font-display font-bold">Category Performance</h2>
          </div>
          {loadingCategories ? (
            <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : topCategories?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data available yet.</p>
          ) : (
            <div className="space-y-4">
              {topCategories?.map((cat, i) => (
                <div key={cat.category_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {lang === 'fr' ? cat.name_fr : lang === 'ar' ? cat.name_ar : cat.name_en || '—'}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-muted-foreground shrink-0 pl-4">
                    <span className="w-16 text-right">{cat.views} views</span>
                    <span className="w-16 text-right">{cat.cart_adds} adds</span>
                    <span className="w-12 text-right text-primary">{cat.orders} ord.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Tables */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-display font-bold mb-6">Active Tables</h2>
        {loadingTables ? (
          <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : topTables?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Table</th>
                  <th className="px-4 py-3">Total Sessions</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3 rounded-r-lg">Service Requests</th>
                </tr>
              </thead>
              <tbody>
                {topTables?.map((table) => (
                  <tr key={table.table_id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{table.name}</td>
                    <td className="px-4 py-3">{table.sessions}</td>
                    <td className="px-4 py-3 font-bold text-primary">{table.orders}</td>
                    <td className="px-4 py-3">{table.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion Performance */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-display font-bold mb-6">Promotion Performance</h2>
        {loadingPromotions ? (
          <div className="h-40 grid place-items-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : promotionStats?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No active promotions tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Promotion Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 rounded-r-lg">Clicks / Interactions</th>
                </tr>
              </thead>
              <tbody>
                {promotionStats?.map((promo) => (
                  <tr key={promo.promotion_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {lang === 'fr' ? promo.title_fr : lang === 'ar' ? promo.title_ar : promo.title_en || '—'}
                    </td>
                    <td className="px-4 py-3 capitalize">{promo.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-bold text-primary">{promo.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, loading, accent }: { icon: React.ReactNode; label: string; value: string; loading: boolean; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${accent ? "bg-primary/10 border-primary/20 text-primary" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80 mb-3">
        {icon} {label}
      </div>
      {loading ? (
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      ) : (
        <p className={`text-4xl font-display font-bold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      )}
    </div>
  );
}
