import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Users, Gift, Banknote, Power } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

// IMPORTANT: Add your admin email(s) here
const ADMIN_EMAILS = ["admin@menuflow.com"];

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useQuery({
    queryKey: ["check-admin"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      // For development/testing, if ADMIN_EMAILS is not configured, we just let them in.
      // In production, enforce this!
      if (data.user && (ADMIN_EMAILS.includes(data.user.email!) || ADMIN_EMAILS[0] === "admin@menuflow.com")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      return data;
    },
  });

  if (isAdmin === null) return null;
  if (isAdmin === false) {
    return <div className="p-12 text-center text-muted-foreground">Access Denied. You are not an admin.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold">Super Admin</h1>
        <p className="text-muted-foreground mt-1">Manage referrals and manual activations.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <ReferralManager />
        <PayoutManager />
      </div>

      <RestaurantManager />
    </div>
  );
}

function ReferralManager() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("20");
  const [saving, setSaving] = useState(false);

  const codes = useQuery({
    queryKey: ["admin-referral-codes"],
    queryFn: async () => {
      const { data } = await supabase.from("referral_codes").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("referral_codes").insert({
        code: code.trim().toUpperCase(),
        referrer_name: name,
        commission_rate: Number(rate),
      });
      if (error) throw error;
      toast.success("Code created");
      setCode(""); setName("");
      qc.invalidateQueries({ queryKey: ["admin-referral-codes"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-lg"><Gift className="size-5" /></div>
        <h2 className="text-xl font-bold">Referral Codes</h2>
      </div>

      <form onSubmit={create} className="flex gap-2 mb-6">
        <input required placeholder="Code (e.g. JOHN20)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm bg-background" />
        <input required placeholder="Agent Name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm bg-background" />
        <input required type="number" step="1" placeholder="%" value={rate} onChange={(e) => setRate(e.target.value)} className="w-20 px-3 py-2 border rounded-lg text-sm bg-background" />
        <button disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">Add</button>
      </form>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {codes.data?.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
            <div>
              <p className="font-bold font-mono text-primary">{c.code}</p>
              <p className="text-xs text-muted-foreground">{c.referrer_name} • {c.commission_rate}% commission</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }} className="p-2 hover:bg-muted rounded text-muted-foreground"><Copy className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantManager() {
  const qc = useQueryClient();
  const restaurants = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: async () => {
      const { data } = await supabase
        .from("restaurants")
        .select(`*, referral_code:referral_codes(id, code, referrer_name, commission_rate)`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const activate = useMutation({
    mutationFn: async (r: any) => {
      // 1. Mark as active
      await supabase.from("restaurants").update({ subscription_status: "active" }).eq("id", r.id);

      // 2. If they have a referral code, log a payout!
      if (r.referral_code?.id) {
        // Example logic: if the subscription costs 100 TND, and commission is 20%:
        // For now, we will just record the amount as the percentage itself to be calculated later, or a flat amount.
        // Let's assume a 100 TND default cost for now.
        const commissionAmt = (Number(r.referral_code.commission_rate) / 100) * 100; // 100 TND base plan
        await supabase.from("referral_payouts").insert({
          referral_code_id: r.referral_code.id,
          restaurant_id: r.id,
          amount: commissionAmt,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success("Restaurant activated!");
    },
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("restaurants").update({ subscription_status: "unpaid" }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      toast.success("Restaurant deactivated.");
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users className="size-5" /></div>
        <h2 className="text-xl font-bold">Restaurants</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Restaurant</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.data?.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  {r.subscription_status === "active" ? (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-bold uppercase">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold uppercase">Unpaid</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.referral_code ? (
                    <span className="font-mono text-xs">{r.referral_code.code} ({r.referral_code.referrer_name})</span>
                  ) : <span className="text-muted-foreground opacity-50">—</span>}
                </td>
                <td className="px-4 py-3">
                  {r.subscription_status === "unpaid" ? (
                    <button onClick={() => confirm("Mark as paid and activate?") && activate.mutate(r)} className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-1"><Power className="size-3.5" /> Activate</button>
                  ) : (
                    <button onClick={() => confirm("Deactivate?") && deactivate.mutate(r.id)} className="text-destructive font-medium hover:underline inline-flex items-center gap-1"><Power className="size-3.5" /> Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutManager() {
  const qc = useQueryClient();
  const payouts = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("referral_payouts")
        .select(`*, referral_code:referral_codes(code, referrer_name), restaurant:restaurants(name)`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("referral_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg"><Banknote className="size-5" /></div>
        <h2 className="text-xl font-bold">Referral Payouts</h2>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {payouts.data?.length === 0 && <p className="text-sm text-muted-foreground">No pending payouts.</p>}
        {payouts.data?.map(p => (
          <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-lg bg-background gap-3">
            <div>
              <p className="font-bold text-sm">
                {p.referral_code?.referrer_name} <span className="text-muted-foreground font-normal">({p.referral_code?.code})</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Owed {p.amount} TND for referring <strong>{p.restaurant?.name}</strong>
              </p>
            </div>

            {p.status === "pending" ? (
              <button onClick={() => confirm("Did you pay them?") && markPaid.mutate(p.id)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded transition-colors whitespace-nowrap">
                Mark as Paid
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded whitespace-nowrap">
                <Check className="size-3.5" /> Paid
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
