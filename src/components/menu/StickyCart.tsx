import React, { useState } from "react";
import { ShoppingBag, X, Plus, Minus, Check } from "lucide-react";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useTranslation } from "react-i18next";
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
  onOrderSubmitted?: (orderId: string) => void;
}

export function StickyCart({ cart, restaurant, activeTable, lang, currency, onOrderSubmitted }: StickyCartProps) {
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
            onOrderSubmitted={onOrderSubmitted}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CartModal({ cart, restaurant, activeTable, lang, currency, onClose, onOrderSubmitted }: any) {
  const { t } = useTranslation();
  const submitOrder = useSubmitOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const order = await submitOrder.mutateAsync({
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

      setSuccess(true);
      setTimeout(() => {
        cart.clear();
        onClose();
        if (onOrderSubmitted) onOrderSubmitted(order.id);
      }, 1500);
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
                    {i.selectedSize && <p className="text-[11px] text-muted-foreground mt-0.5">Size: {pickLocalized(i.selectedSize, "name", lang)}</p>}
                    {i.selectedMods && i.selectedMods.length > 0 && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug break-words whitespace-normal">{i.selectedMods.map((m: any) => pickLocalized(m, "name", lang)).join(", ")}</p>}
                    <p className="text-sm text-primary font-bold mt-1">
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

              {success ? (
                <div className="mb-3 py-4 text-sm font-bold bg-green-500 text-white rounded-full flex items-center justify-center gap-2">
                  <Check className="size-5" /> Order Sent!
                </div>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full mb-3 py-4 text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 rounded-full shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Submit Order</>
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
