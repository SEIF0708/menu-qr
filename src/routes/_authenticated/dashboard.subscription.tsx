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

      toast.success(t("subscription.successApplied"));
      setCode("");
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
    } catch (err: any) {
      toast.error(err.message); // we still use err.message if supabase returns something else, or t("subscription.invalidCode")
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">{t("subscription.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subscription.subtitle")}</p>
      </div>

      {isUnpaid ? (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="size-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
              <Lock className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("subscription.freeTier")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("subscription.freeDesc")}
              </p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                  <span>{t("subscription.maxCats")}</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                  <span>{t("subscription.maxProds")}</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-50">
                  <Lock className="size-4 text-muted-foreground ml-0.5 mr-0.5" />
                  <span>{t("subscription.publicQrLocked")}</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-50">
                  <Lock className="size-4 text-muted-foreground ml-0.5 mr-0.5" />
                  <span>{t("subscription.unlimitedLocked")}</span>
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
              <h2 className="text-xl font-bold text-emerald-700">{t("subscription.premiumTitle")}</h2>
              <p className="text-emerald-700/80 mt-2">
                {t("subscription.premiumDesc")}
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
                <h3 className="font-bold">{t("subscription.refTitle")}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                   {t("subscription.refDesc")}
                </p>
                <form onSubmit={applyCode} className="flex gap-3">
                   <input
                      type="text"
                      placeholder={t("subscription.refPlaceholder")}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-sm"
                   />
                   <button
                      type="submit"
                      disabled={saving || !code.trim()}
                      className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-lg disabled:opacity-50"
                   >
                      {saving ? t("subscription.refApplying") : t("subscription.refBtn")}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {isUnpaid && restaurant?.referral_code_id && (
        <div className="bg-muted border border-border rounded-2xl p-6 text-center">
           <p className="text-sm text-muted-foreground">
             {t("subscription.refApplied")}
           </p>
        </div>
      )}
    </div>
  );
}
