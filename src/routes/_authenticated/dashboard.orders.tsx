import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useOrders } from "@/lib/use-orders";
import { formatPrice } from "@/lib/format";
import { ShoppingBag, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({ component: OrdersPage });

function OrdersPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const { data: restaurant } = useMyRestaurant();
  const { data: orders, isLoading } = useOrders(restaurant?.id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>;
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.orders")}</p>
          <h1 className="text-3xl font-display font-bold">{t("orders.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("orders.subtitle")}</p>
        </div>
      </header>

      {orders?.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="size-16 bg-muted rounded-full grid place-items-center mb-4">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg">{t("orders.empty")}</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">{t("orders.emptyHint")}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">{t("orders.dateTime")}</th>
                  <th className="px-6 py-4 font-medium">{t("orders.table")}</th>
                  <th className="px-6 py-4 font-medium">{t("orders.items")}</th>
                  <th className="px-6 py-4 font-medium">{t("orders.total")}</th>
                  <th className="px-6 py-4 font-medium text-right">{t("orders.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders?.map((order) => {
                  const itemsCount = Array.isArray(order.items_json) 
                    ? order.items_json.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
                    : 0;
                  
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {order.table?.name || <span className="text-muted-foreground text-xs italic">{t("orders.noTable")}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {t("orders.itemsCount", { count: itemsCount })}
                      </td>
                      <td className="px-6 py-4 font-display font-bold">
                        {formatPrice(order.total_amount, restaurant!.currency, lang)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.whatsapp_sent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="size-3.5" /> {t("orders.sent")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                            {t("orders.pending")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
