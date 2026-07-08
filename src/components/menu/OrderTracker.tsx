import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChefHat, Clock, PartyPopper, ReceiptText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface OrderTrackerProps {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}

export function OrderTracker({ orderId, onClose, onDone }: OrderTrackerProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (data) setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    const channel = supabase.channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) return null;

  // Status mapping: pending -> Sent to Kitchen, preparing -> Preparing, completed -> Served
  const isPending = order?.status === "pending";
  const isPreparing = order?.status === "preparing";
  const isCompleted = order?.status === "completed";

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-2xl rounded-t-3xl"
    >
      <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <ReceiptText className="size-5" />
          {t("menu.orderTracker") || "Order Tracker"}
        </h3>
        <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-6 pb-4">
        {/* Step 1: Sent */}
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${order ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Clock className="size-5" />
          </div>
          <div>
            <p className={`font-bold ${order ? 'text-foreground' : 'text-muted-foreground'}`}>{t("menu.sentToKitchen") || "Sent to Kitchen"}</p>
            <p className="text-xs text-muted-foreground">{t("menu.sentDesc") || "Your order has been placed."}</p>
          </div>
        </div>

        {/* Step 2: Preparing */}
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPreparing || isCompleted ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
            <ChefHat className="size-5" />
          </div>
          <div>
            <p className={`font-bold ${isPreparing || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{t("menu.preparing") || "Preparing"}</p>
            <p className="text-xs text-muted-foreground">{t("menu.preparingDesc") || "The chef is preparing your meal."}</p>
          </div>
        </div>

        {/* Step 3: Served */}
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
            <PartyPopper className="size-5" />
          </div>
          <div>
            <p className={`font-bold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{t("menu.served") || "Served"}</p>
            <p className="text-xs text-muted-foreground">{t("menu.servedDesc") || "Enjoy your meal!"}</p>
          </div>
        </div>
      </div>

      {isCompleted && (
        <button
          onClick={onDone}
          className="w-full mt-4 bg-green-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
        >
          {t("menu.done") || "Done"}
        </button>
      )}
    </motion.div>
  );
}
