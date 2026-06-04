import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LangSwitcher } from "@/components/LangSwitcher";
import { toast } from "sonner";

type Search = { mode?: "signin" | "signup" | "reset" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (s.mode === "signup" || s.mode === "reset" ? s.mode : "signin") as Search["mode"],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        
        if (data.session) {
          navigate({ to: "/dashboard" });
        } else {
          toast.success(t("auth.checkEmail"));
        }
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success(t("auth.resetEmailSent"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
    if (result.error) toast.error(result.error.message || "Error");
    if (!result.redirected && !result.error) navigate({ to: "/dashboard" });
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded grid place-items-center">
              <span className="text-primary-foreground font-display font-bold italic text-sm">M</span>
            </div>
            <span className="font-display font-bold text-lg">MenuFlow</span>
          </Link>
          <LangSwitcher />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
            {t("auth.tagline")}
          </p>
          <h1 className="text-3xl font-display font-bold mb-6">
            {mode === "signup" ? t("auth.signUp") : mode === "reset" ? t("auth.resetPassword") : t("auth.signIn")}
          </h1>

          {mode !== "reset" && (
            <>
              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="w-full mb-4 px-4 py-2.5 border border-border rounded-lg flex items-center justify-center gap-2 hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
              >
                <svg className="size-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.3 0 10.1-2 13.8-5.3l-6.4-5.4C29.5 34.4 26.9 35.5 24 35.5c-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.4 5.4C41 35 43.5 30 43.5 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
                {t("auth.continueWithGoogle")}
              </button>
              <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground uppercase tracking-wider">
                <div className="flex-1 h-px bg-border" /> {t("auth.or")} <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label={t("auth.fullName")}>
                <input
                  required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="input"
                />
              </Field>
            )}
            <Field label={t("auth.email")}>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" autoComplete="email"
              />
            </Field>
            {mode !== "reset" && (
              <Field label={t("auth.password")}>
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </Field>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? t("common.loading")
                : mode === "signup" ? t("auth.signUp")
                : mode === "reset" ? t("auth.sendResetLink")
                : t("auth.signIn")}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-center text-muted-foreground">
            {mode === "signin" && (
              <>
                <Link to="/auth" search={{ mode: "reset" }} className="text-accent hover:underline">{t("auth.forgotPassword")}</Link>
                <span>{t("auth.noAccount")} <Link to="/auth" search={{ mode: "signup" }} className="text-foreground font-medium hover:underline">{t("auth.signUp")}</Link></span>
              </>
            )}
            {mode === "signup" && (
              <span>{t("auth.haveAccount")} <Link to="/auth" search={{ mode: "signin" }} className="text-foreground font-medium hover:underline">{t("auth.signIn")}</Link></span>
            )}
            {mode === "reset" && (
              <Link to="/auth" search={{ mode: "signin" }} className="text-accent hover:underline">← {t("auth.signIn")}</Link>
            )}
          </div>
        </div>
      </div>

      <style>{`.input { width:100%; padding:0.625rem 0.75rem; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-background); color:var(--color-foreground); font-size:0.875rem; outline:none; transition:border-color .15s; }
      .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-ring); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
