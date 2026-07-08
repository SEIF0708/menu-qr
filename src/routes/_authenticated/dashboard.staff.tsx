import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { Plus, Users, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/dashboard/staff")({
  component: StaffDashboard,
});

function StaffDashboard() {
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<any>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  const waiters = useQuery({
    queryKey: ["waiters", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("waiters")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurant?.id,
  });

  const waiterMetrics = useQuery({
    queryKey: ["waiter-metrics", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return {};
      const { data } = await supabase
        .from("orders")
        .select("id, claimed_by_waiter_id, status")
        .eq("restaurant_id", restaurant.id)
        .not("claimed_by_waiter_id", "is", null);
      
      const metrics: Record<string, { preparing: number; completed: number }> = {};
      data?.forEach(order => {
        const wid = order.claimed_by_waiter_id as string;
        if (!metrics[wid]) metrics[wid] = { preparing: 0, completed: 0 };
        if (order.status === "preparing") metrics[wid].preparing++;
        if (order.status === "completed") metrics[wid].completed++;
      });
      return metrics;
    },
    enabled: !!restaurant?.id,
  });

  const maxWaitersReached = (waiters.data?.length || 0) >= 3;

  const saveWaiter = useMutation({
    mutationFn: async () => {
      if (!restaurant?.id) throw new Error("No restaurant");
      if (pin.length < 4) throw new Error("PIN must be at least 4 characters");
      
      if (editingWaiter) {
        const { error } = await supabase
          .from("waiters")
          .update({ name, pin_code: pin })
          .eq("id", editingWaiter.id);
        if (error) throw error;
      } else {
        if (maxWaitersReached) throw new Error("Maximum of 3 waiters allowed");
        const { error } = await supabase
          .from("waiters")
          .insert({ restaurant_id: restaurant.id, name, pin_code: pin });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiters", restaurant?.id] });
      closeModal();
    },
  });

  const deleteWaiter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waiters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiters", restaurant?.id] });
    },
  });

  const openModal = (waiter?: any) => {
    if (waiter) {
      setEditingWaiter(waiter);
      setName(waiter.name);
      setPin(waiter.pin_code);
    } else {
      setEditingWaiter(null);
      setName("");
      setPin("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWaiter(null);
    setName("");
    setPin("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Waitstaff</h1>
          <p className="text-muted-foreground mt-1">Manage your waiters and their PIN codes to access the Waiter Portal.</p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={maxWaitersReached}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="size-4" />
          Add Waiter
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {waiters.isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : waiters.data?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Users className="size-8" />
            </div>
            <h3 className="text-lg font-bold">No waiters added</h3>
            <p className="text-muted-foreground max-w-sm mt-1 mb-6">Create your first waiter to give them access to the live orders and messaging portal.</p>
            <button onClick={() => openModal()} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold">Add Waiter</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {waiters.data?.map((w) => (
              <div key={w.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{w.name}</p>
                    <p className="text-sm text-muted-foreground font-mono mt-0.5">PIN: {w.pin_code}</p>
                  </div>
                </div>

                <div className="hidden md:flex gap-6 text-center bg-muted/50 py-2 px-6 rounded-xl border border-border/50">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-0.5">Preparing</p>
                    <p className="font-display font-bold text-blue-600 text-lg leading-none">{waiterMetrics.data?.[w.id]?.preparing || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-0.5">Completed</p>
                    <p className="font-display font-bold text-green-600 text-lg leading-none">{waiterMetrics.data?.[w.id]?.completed || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(w)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <Edit2 className="size-4" />
                  </button>
                  <button onClick={() => { if(confirm("Delete this waiter?")) deleteWaiter.mutate(w.id); }} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-muted/30 border-t border-border text-sm text-muted-foreground flex items-center justify-between">
          <span>{waiters.data?.length || 0} / 3 Waiters used</span>
          <span>Waiters log in at: <strong className="font-mono text-foreground select-all">/waiter/{restaurant?.slug}</strong></span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingWaiter ? "Edit Waiter" : "Add Waiter"}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full font-mono bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Waiters will use this code to log into the portal.</p>
              </div>

              {saveWaiter.isError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl flex items-center gap-2">
                  <ShieldAlert className="size-4" />
                  {saveWaiter.error.message}
                </div>
              )}

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl font-bold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveWaiter.mutate()}
                  disabled={!name || pin.length < 4 || saveWaiter.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saveWaiter.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
