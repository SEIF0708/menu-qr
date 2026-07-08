import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Clock, UtensilsCrossed, MessageSquare, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/waiter/$slug/")({
  component: WaiterDashboard,
});

function WaiterDashboard() {
  const { slug } = Route.useParams();
  const { restaurant } = Route.useRouteContext() as { restaurant: any };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [waiter, setWaiter] = useState<{id: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "orders">("requests");

  useEffect(() => {
    const stored = localStorage.getItem(`waiter_${restaurant.id}`);
    if (!stored) {
      navigate({ to: `/waiter/${slug}/login`, replace: true });
    } else {
      setWaiter(JSON.parse(stored));
    }
  }, [restaurant.id, slug, navigate]);

  // Fetch initial data
  const messages = useQuery({
    queryKey: ["waiter-messages", restaurant.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_messages")
        .select("*, restaurant_tables(name)")
        .eq("restaurant_id", restaurant.id)
        .in("status", ["pending", "acknowledged"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!waiter,
  });

  const orders = useQuery({
    queryKey: ["waiter-orders", restaurant.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, restaurant_tables(name)")
        .eq("restaurant_id", restaurant.id)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!waiter,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!waiter) return;

    const playChime = () => {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    };

    const msgsSub = supabase.channel('custom-messages-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_messages', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') playChime();
          queryClient.invalidateQueries({ queryKey: ["waiter-messages", restaurant.id] });
        }
      )
      .subscribe();

    const ordersSub = supabase.channel('custom-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') playChime();
          queryClient.invalidateQueries({ queryKey: ["waiter-orders", restaurant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgsSub);
      supabase.removeChannel(ordersSub);
    };
  }, [waiter, restaurant.id, queryClient]);

  const updateMessage = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from("client_messages")
        .update({ status, claimed_by_waiter_id: waiter?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiter-messages", restaurant.id] });
    }
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, claimed_by_waiter_id: waiter?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiter-orders", restaurant.id] });
    }
  });

  const logout = () => {
    localStorage.removeItem(`waiter_${restaurant.id}`);
    navigate({ to: `/waiter/${slug}/login`, replace: true });
  };

  if (!waiter) return null;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-display font-bold text-lg">Waiter Portal</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
             <span className="size-2 bg-green-500 rounded-full animate-pulse" />
             {waiter.name} • {restaurant.name}
          </p>
        </div>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
           <LogOut className="size-4" />
        </button>
      </header>

      <div className="flex p-4 gap-2 sticky top-[61px] bg-slate-50 z-10 shadow-sm shadow-slate-100">
        <button 
          onClick={() => setActiveTab("requests")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === "requests" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          <Bell className="size-4" />
          Requests
          {messages.data?.length ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{messages.data.length}</span> : null}
        </button>
        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === "orders" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          <UtensilsCrossed className="size-4" />
          Orders
          {orders.data?.length ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{orders.data.length}</span> : null}
        </button>
      </div>

      <main className="flex-1 p-4 pb-20">
        {activeTab === "requests" && (
          <div className="space-y-3">
             {messages.isLoading ? (
               <div className="text-center p-8 text-muted-foreground text-sm">Loading...</div>
             ) : messages.data?.length === 0 ? (
               <div className="text-center p-12 text-muted-foreground">
                 <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Check className="size-6 text-slate-400" />
                 </div>
                 <p>All caught up!</p>
               </div>
             ) : (
               messages.data?.map(msg => (
                 <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                       <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-sm border border-slate-200">
                         {msg.restaurant_tables?.name || "Unknown Table"}
                       </span>
                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                         <Clock className="size-3" />
                         {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                     {msg.status === "acknowledged" && (
                       <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                         Being Handled
                       </span>
                     )}
                   </div>
                   
                   <p className="font-bold text-lg mb-1">
                     {msg.message_type === "call_waiter" && "👋 Needs a Waiter"}
                     {msg.message_type === "request_bill" && "💳 Requested the Bill"}
                     {msg.message_type === "custom" && <><MessageSquare className="size-4 inline mr-1" /> {msg.content}</>}
                   </p>

                   <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                     {msg.status === "pending" && (
                       <button 
                         onClick={() => updateMessage.mutate({ id: msg.id, status: "acknowledged" })}
                         className="flex-1 bg-amber-100 text-amber-700 font-bold py-2.5 rounded-xl text-sm"
                       >
                         Acknowledge
                       </button>
                     )}
                     <button 
                         onClick={() => updateMessage.mutate({ id: msg.id, status: "resolved" })}
                         className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm"
                       >
                         Mark Resolved
                     </button>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
             {orders.isLoading ? (
               <div className="text-center p-8 text-muted-foreground text-sm">Loading...</div>
             ) : orders.data?.length === 0 ? (
               <div className="text-center p-12 text-muted-foreground">
                 <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Check className="size-6 text-slate-400" />
                 </div>
                 <p>No active orders</p>
               </div>
             ) : (
               orders.data?.map(order => {
                 const items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : order.items_json;
                 return (
                 <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                       <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-sm border border-slate-200">
                         {order.restaurant_tables?.name || "Unknown Table"}
                       </span>
                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                         <Clock className="size-3" />
                         {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                     {order.status === "preparing" && (
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                         Preparing
                       </span>
                     )}
                   </div>
                   
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mb-4">
                     {items?.map((item: any, i: number) => (
                       <div key={i} className="text-sm">
                         <span className="font-bold">{item.qty}x</span> {item.name}
                         {item.selectedSize && <div className="text-xs text-muted-foreground ml-5">Size: {item.selectedSize.name_en || item.selectedSize.name}</div>}
                         {item.selectedMods?.length > 0 && <div className="text-xs text-muted-foreground ml-5">+ {item.selectedMods.map((m:any) => m.name_en || m.name).join(', ')}</div>}
                       </div>
                     ))}
                   </div>

                   <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-medium text-muted-foreground">Total</span>
                     <span className="font-bold text-lg">${order.total_amount}</span>
                   </div>

                   <div className="flex gap-2 pt-4 border-t border-slate-100">
                     {order.status === "pending" && (
                       <button 
                         onClick={() => updateOrder.mutate({ id: order.id, status: "preparing" })}
                         className="flex-1 bg-blue-100 text-blue-700 font-bold py-2.5 rounded-xl text-sm"
                       >
                         Accept
                       </button>
                     )}
                     <button 
                         onClick={() => updateOrder.mutate({ id: order.id, status: "completed" })}
                         className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm"
                       >
                         Complete
                     </button>
                   </div>
                 </div>
               )})
             )}
          </div>
        )}
      </main>
    </div>
  );
}
