import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.passwordUpdated"));
      navigate({ to: "/auth" });
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-display font-bold mb-6">{t("auth.resetPassword")}</h1>
        <input
          type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.newPassword")}
          className="w-full px-3 py-2.5 border border-border rounded-lg mb-4 text-sm"
        />
        <button disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium disabled:opacity-50">
          {t("common.save")}
        </button>
      </form>
    </div>
  );
}
