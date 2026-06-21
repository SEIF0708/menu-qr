import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Gift, Copy, Check, Users, Banknote, Sparkles, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const codeQuery = useQuery({
    queryKey: ["my-referral-code", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const generateCode = useMutation({
    mutationFn: async () => {
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = `PARTNER-${randomStr}`;
      
      const { error } = await supabase.from("referral_codes").insert({
        user_id: user.id,
        code: newCode,
        referrer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Partner",
        commission_rate: 50.00, // 50 DT flat
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-referral-code"] });
      toast.success("Partner account created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const payoutsQuery = useQuery({
    queryKey: ["my-payouts", codeQuery.data?.id],
    enabled: !!codeQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_payouts")
        .select(`*, restaurant:restaurants(name)`)
        .eq("referral_code_id", codeQuery.data.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) return null;

  if (codeQuery.isLoading) {
    return <div className="p-8 flex justify-center"><div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!codeQuery.data) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Gift className="size-8 text-primary" /> Partner Program
          </h1>
          <p className="text-muted-foreground mt-2">Refer other restaurants and earn money for each successful subscription.</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="size-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Become a MenuFlow Partner</h2>
          <p className="text-muted-foreground mb-8">
            Get your unique referral code. When a restaurant uses your code, they get a 50 DT discount (paying only 250 DT), and you earn a 50 DT commission once they subscribe!
          </p>
          <button 
            onClick={() => generateCode.mutate()}
            disabled={generateCode.isPending}
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {generateCode.isPending ? "Generating..." : "Join the Partner Program"}
          </button>
        </div>
      </div>
    );
  }

  const payouts = payoutsQuery.data || [];
  const totalEarned = payouts.filter(p => p.status === "paid").reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pendingEarned = payouts.filter(p => p.status === "pending").reduce((acc, curr) => acc + Number(curr.amount), 0);
  const referralCount = payouts.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Gift className="size-8 text-primary" /> Partner Program
        </h1>
        <p className="text-muted-foreground mt-2">Share your code and track your earnings.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm md:col-span-3 lg:col-span-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div className="bg-muted px-4 py-3 rounded-xl font-mono text-xl font-bold text-foreground flex-1 text-center tracking-wider border border-border/50">
              {codeQuery.data.code}
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(codeQuery.data.code); toast.success("Copied"); }}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-colors"
            >
              <Copy className="size-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Share this code. They get 50 DT off, you get 50 DT.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Banknote className="size-5" />
            <p className="text-sm font-medium">Total Paid</p>
          </div>
          <p className="text-4xl font-bold font-display">{totalEarned} <span className="text-base text-muted-foreground">DT</span></p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <TrendingUp className="size-5" />
            <p className="text-sm font-medium">Pending Earnings</p>
          </div>
          <p className="text-4xl font-bold font-display">{pendingEarned} <span className="text-base text-muted-foreground">DT</span></p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="size-4 text-primary" /> Referral History ({referralCount})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {payouts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              You haven't referred any restaurants yet. Share your code to start earning!
            </div>
          ) : (
            payouts.map(p => (
              <div key={p.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background">
                <div>
                  <p className="font-bold">{p.restaurant?.name || "Unknown Restaurant"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Referred on {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{p.amount} DT</p>
                  {p.status === "paid" ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                      <Check className="size-3" /> Paid
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold uppercase">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
