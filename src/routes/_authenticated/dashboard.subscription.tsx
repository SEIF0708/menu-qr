import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, Lock, Gift } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const isUnpaid = restaurant?.subscription_status === "unpaid";

  const applyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    try {
      // Find the code
      const { data: refCode, error: refError } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle();

      if (refError || !refCode) {
        throw new Error("Invalid referral code.");
      }

      // Update restaurant
      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ referral_code_id: refCode.id })
        .eq("id", restaurant!.id);

      if (updateError) throw updateError;

      toast.success("Referral code applied successfully!");
      setCode("");
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Subscription & Plan</h1>
        <p className="text-muted-foreground mt-1">Manage your access and upgrades.</p>
      </div>

      {isUnpaid ? (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="size-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
              <Lock className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Free Tier (Limited)</h2>
              <p className="text-muted-foreground mt-2">
                Your restaurant is currently on the free tier. Your public QR menu is hidden and you are limited to 3 categories and 9 products.
              </p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                  <span>Maximum 3 menu categories</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                  <span>Maximum 9 menu products</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-50">
                  <Lock className="size-4 text-muted-foreground ml-0.5 mr-0.5" />
                  <span>Public QR Code Menu (Locked)</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-50">
                  <Lock className="size-4 text-muted-foreground ml-0.5 mr-0.5" />
                  <span>Unlimited Products (Locked)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="size-12 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-700">Premium Plan Active</h2>
              <p className="text-emerald-700/80 mt-2">
                Your menu is fully unlocked! Your QR code is live and you can create unlimited categories and products.
              </p>
            </div>
          </div>
        </div>
      )}

      {isUnpaid && !restaurant?.referral_code_id && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
             <div className="size-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Gift className="size-5" />
             </div>
             <div className="flex-1">
                <h3 className="font-bold">Have a Referral Code?</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                   If you were referred by an agent, enter their code below. To upgrade your account and unlock your menu, please contact support to arrange payment.
                </p>
                <form onSubmit={applyCode} className="flex gap-3">
                   <input
                      type="text"
                      placeholder="e.g. AGENT20"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-sm"
                   />
                   <button
                      type="submit"
                      disabled={saving || !code.trim()}
                      className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-lg disabled:opacity-50"
                   >
                      {saving ? "Applying..." : "Apply Code"}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {isUnpaid && restaurant?.referral_code_id && (
        <div className="bg-muted border border-border rounded-2xl p-6 text-center">
           <p className="text-sm text-muted-foreground">
             Referral code applied. Please contact the platform owner to complete your payment and activate your account.
           </p>
        </div>
      )}
    </div>
  );
}
