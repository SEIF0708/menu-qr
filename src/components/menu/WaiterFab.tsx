import React, { useState } from "react";
import { Bell, CreditCard, MessageSquare, Check, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomSheet } from "./ProductModal";
import { AnimatePresence, motion } from "framer-motion";

export function WaiterFab({ restaurant, activeTable }: { restaurant: any, activeTable: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "custom">("menu");
  const [customMsg, setCustomMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // If there's no active table, we probably shouldn't show the call waiter button
  // since the waiter won't know where to go. Or we could just require a table.
  if (!activeTable) return null;

  const handleSend = async (type: string, content?: string) => {
    setIsSubmitting(true);
    try {
      await supabase.from("client_messages").insert({
        restaurant_id: restaurant.id,
        table_id: activeTable.id,
        message_type: type,
        content: content || null
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setMode("menu");
        setCustomMsg("");
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 size-14 bg-amber-500 text-white rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Bell className="size-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <BottomSheet onClose={() => { setIsOpen(false); setMode("menu"); }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-display">
                  {mode === "menu" ? "Need Something?" : "Custom Message"}
                </h2>
              </div>

              {success ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                   <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                     <Check className="size-8" />
                   </div>
                   <h3 className="font-bold text-lg mb-1">Message Sent!</h3>
                   <p className="text-muted-foreground text-sm">A waiter is on their way.</p>
                </div>
              ) : mode === "menu" ? (
                <div className="space-y-3 pb-4">
                  <button onClick={() => handleSend("call_waiter")} disabled={isSubmitting} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                    <div className="size-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <Bell className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Call Waiter</p>
                      <p className="text-xs text-muted-foreground">Request a waiter to your table</p>
                    </div>
                  </button>
                  
                  <button onClick={() => handleSend("request_bill")} disabled={isSubmitting} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                    <div className="size-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <CreditCard className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Request Bill</p>
                      <p className="text-xs text-muted-foreground">Ready to pay and leave</p>
                    </div>
                  </button>

                  <button onClick={() => setMode("custom")} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                    <div className="size-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Custom Request</p>
                      <p className="text-xs text-muted-foreground">Napkins, extra sauce, etc.</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="pb-4">
                  <textarea 
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="E.g., We need some extra napkins please..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setMode("menu")} className="px-6 py-3 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600">
                       Back
                    </button>
                    <button 
                      onClick={() => handleSend("custom", customMsg)} 
                      disabled={!customMsg.trim() || isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Sending..." : "Send Request"} <Send className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </>
  );
}
