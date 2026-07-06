import React, { useState } from "react";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { buildOrderMessage, generateWhatsAppLink } from "@/lib/whatsapp";
import { useSubmitOrder } from "@/lib/use-orders";
import { trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "./ProductModal";

interface StickyCartProps {
  cart: any;
  restaurant: any;
  activeTable: any;
  lang: string;
  currency: string;
}

export function StickyCart({ cart, restaurant, activeTable, lang, currency }: StickyCartProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-t border-border p-4 pointer-events-none"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-full max-w-3xl mx-auto bg-primary text-primary-foreground px-4 py-3.5 rounded-full flex items-center justify-between gap-6 shadow-2xl pointer-events-auto active:scale-[0.98] transition-transform hover:brightness-110"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 bg-black/20 rounded-full grid place-items-center">
                  <span className="text-sm font-bold">{cart.count}</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">
                  {t("menu.viewCart") || "View Cart"}
                </span>
              </div>
              <span className="text-base font-display font-bold">
                {formatPrice(cart.total, currency, lang)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isOpen && (
          <CartModal
            cart={cart}
            restaurant={restaurant}
            activeTable={activeTable}
            lang={lang}
            currency={currency}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CartModal({ cart, restaurant, activeTable, lang, currency, onClose }: any) {
  const { t } = useTranslation();
  const submitOrder = useSubmitOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWhatsAppOrder = async () => {
    if (!restaurant.whatsapp_phone) return;
    setIsSubmitting(true);
    try {
      await submitOrder.mutateAsync({
        restaurant_id: restaurant.id,
        table_id: activeTable?.id || null,
        items: cart.items,
        total_amount: cart.total,
      });
      // Track order_sent for each product
      cart.items.forEach((item: any) => {
        for (let i = 0; i < item.qty; i++) {
          trackEvent({
            restaurant_id: restaurant.id,
            event_type: "order_sent",
            entity_type: "product",
            entity_id: item.id,
            table_id: activeTable?.id,
          });
        }
      });
      const message = buildOrderMessage(
        restaurant.name,
        activeTable?.name || null,
        cart.items,
        cart.total,
        currency,
        lang
      );
      const link = generateWhatsAppLink(restaurant.whatsapp_phone, message);
      cart.clear();
      onClose();
      window.open(link, "_blank");
    } catch (e) {
      console.error("Failed to submit order", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="p-6 flex flex-col max-h-[85dvh] rounded-t-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">{t("menu.cart") || "Cart"}</h2>
        </div>
        {cart.items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="size-16 bg-muted rounded-full grid place-items-center mx-auto mb-4">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {t("menu.emptyCart") || "Your cart is empty"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
              {cart.items.map((i: any) => (
                <div key={i.id} className="py-4 flex items-center gap-4 border-b border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{i.name}</p>
                    <p className="text-sm text-primary font-bold mt-0.5">
                      {formatPrice(i.price, currency, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
                    <button
                      onClick={() => {
                        cart.setQty(i.id, i.qty - 1);
                        trackEvent({
                          restaurant_id: restaurant.id,
                          event_type: "remove_from_cart",
                          entity_type: "product",
                          entity_id: i.id,
                          table_id: activeTable?.id,
                        });
                      }}
                      className="size-8 rounded-full bg-background shadow-sm grid place-items-center"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{i.qty}</span>
                    <button
                      onClick={() => {
                        cart.setQty(i.id, i.qty + 1);
                        trackEvent({
                          restaurant_id: restaurant.id,
                          event_type: "add_to_cart",
                          entity_type: "product",
                          entity_id: i.id,
                          table_id: activeTable?.id,
                        });
                      }}
                      className="size-8 rounded-full bg-background shadow-sm grid place-items-center"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6 bg-muted p-4 rounded-2xl">
                <span className="font-medium">{t("menu.total") || "Total"}</span>
                <span className="font-display font-bold text-2xl">
                  {formatPrice(cart.total, currency, lang)}
                </span>
              </div>

              {!restaurant.whatsapp_phone ? (
                <div className="mb-4 text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ordering is currently unavailable.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleWhatsAppOrder}
                  disabled={isSubmitting}
                  className="w-full mb-3 py-4 text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 rounded-full shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="size-5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      Send Order to WhatsApp
                    </>
                  )}
                </button>
              )}

              <button
                onClick={cart.clear}
                className="w-full py-3 text-sm font-bold text-destructive bg-destructive/10 rounded-full hover:bg-destructive/20 transition-colors"
              >
                {t("menu.clearCart") || "Clear Cart"}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
