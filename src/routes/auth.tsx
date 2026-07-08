import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LangSwitcher } from "@/components/LangSwitcher";
import { toast } from "sonner";
import { ArrowRight, ShieldAlert, Store } from "lucide-react";

type Search = { mode?: "signin" | "signup" | "reset"; role?: "owner" | "staff" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (s.mode === "signup" || s.mode === "reset" ? s.mode : "signin") as Search["mode"],
    role: (s.role === "staff" ? "staff" : "owner") as Search["role"],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { mode, role } = Route.useSearch();
  const navigate = useNavigate();
  
  // Owner state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff state
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");
  const [staffError, setStaffError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onOwnerSubmit = async (e: React.FormEvent) => {
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

  const onStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !pin) return;
    setLoading(true);
    setStaffError("");
    try {
      const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("slug", slug.toLowerCase().trim())
        .single();

      if (restError || !restaurant) {
        setStaffError("Restaurant not found. Check the code.");
        return;
      }

      const { data: waiter, error: waitError } = await supabase
        .from("waiters")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("pin_code", pin)
        .eq("is_active", true)
        .single();

      if (waitError || !waiter) {
        setStaffError("Invalid PIN code.");
        return;
      }

      localStorage.setItem(`waiter_${restaurant.id}`, JSON.stringify({
        id: waiter.id,
        name: waiter.name
      }));
      
      navigate({ to: `/waiter/${restaurant.slug}` });
    } catch (err) {
      setStaffError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast.error(error.message || "Error");
      setLoading(false);
    }
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

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          
          <div className="flex bg-muted p-1 rounded-xl mb-8">
            <Link
              to="/auth"
              search={{ mode: "signin", role: "owner" }}
              className={`flex-1 text-center text-sm py-2 rounded-lg font-medium transition-colors ${role !== "staff" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Restaurant Owner
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin", role: "staff" }}
              className={`flex-1 text-center text-sm py-2 rounded-lg font-medium transition-colors ${role === "staff" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Waitstaff
            </Link>
          </div>

          {role === "staff" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-center mb-4">
                <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Store className="size-6" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-center mb-2">
                Waitstaff Login
              </h1>
              <p className="text-sm text-center text-muted-foreground mb-6">
                Enter your restaurant code and your 4-digit PIN to access your portal.
              </p>

              {staffError && (
                <div className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-xl flex items-center gap-2 font-medium">
                  <ShieldAlert className="size-4 shrink-0" />
                  {staffError}
                </div>
              )}

              <form onSubmit={onStaffSubmit} className="space-y-4">
                <Field label="Restaurant Code (Slug)">
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. my-restaurant"
                    className="input"
                  />
                </Field>

                <Field label="Your 4-Digit PIN">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    className="input font-mono tracking-widest text-lg"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading || !slug || pin.length < 4}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? "Verifying..." : "Login to Portal"}
                  {!loading && <ArrowRight className="size-4" />}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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

              <form onSubmit={onOwnerSubmit} className="space-y-4">
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
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:brightness-110 transition-all disabled:opacity-50 mt-2"
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
                    <Link to="/auth" search={{ mode: "reset", role: "owner" }} className="text-accent hover:underline">{t("auth.forgotPassword")}</Link>
                    <span>{t("auth.noAccount")} <Link to="/auth" search={{ mode: "signup", role: "owner" }} className="text-foreground font-medium hover:underline">{t("auth.signUp")}</Link></span>
                  </>
                )}
                {mode === "signup" && (
                  <span>{t("auth.haveAccount")} <Link to="/auth" search={{ mode: "signin", role: "owner" }} className="text-foreground font-medium hover:underline">{t("auth.signIn")}</Link></span>
                )}
                {mode === "reset" && (
                  <Link to="/auth" search={{ mode: "signin", role: "owner" }} className="text-accent hover:underline">← {t("auth.signIn")}</Link>
                )}
              </div>
            </div>
          )}
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
