import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedImage } from "@/lib/use-signed-image";
import { uploadAsset } from "@/lib/storage";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LANGS } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t } = useTranslation();
  const { data: restaurant } = useMyRestaurant();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const logoUrl = useSignedImage(form.logo_url);
  const coverUrl = useSignedImage(form.cover_image_url);

  useEffect(() => { 
    if (restaurant) {
      setForm({ ...restaurant, social_links: restaurant.social_links || {} });
    }
  }, [restaurant]);

  const uploadField = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "cover_image_url", kind: "logo" | "cover") => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { data: u } = await supabase.auth.getUser();
      const path = await uploadAsset(file, u.user!.id, kind);
      setForm({ ...form, [field]: path });
      toast.success(t("common.uploading"));
    } catch (e: any) { toast.error(e.message); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, owner_id, created_at, updated_at, ...payload } = form;
      await supabase.from("restaurants").update(payload).eq("id", restaurant!.id);
      toast.success(t("common.saved"));
      qc.invalidateQueries({ queryKey: ["my-restaurant"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (!restaurant) return null;

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.settings")}</p>
        <h1 className="text-3xl font-display font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </header>

      <form onSubmit={submit} className="space-y-6 bg-card border border-border rounded-2xl p-6">
        <Section title={t("settings.cover")}>
          <div className="aspect-[3/1] bg-muted rounded-xl overflow-hidden mb-2">
            {coverUrl && <img src={coverUrl} alt="" className="size-full object-cover" />}
          </div>
          <FileBtn onChange={(e) => uploadField(e, "cover_image_url", "cover")} label={t("common.add")} />
        </Section>

        <Section title={t("settings.logo")}>
          <div className="flex items-center gap-4">
            <div className="size-20 bg-muted rounded-xl overflow-hidden">
              {logoUrl && <img src={logoUrl} alt="" className="size-full object-cover" />}
            </div>
            <FileBtn onChange={(e) => uploadField(e, "logo_url", "logo")} label={t("common.add")} />
          </div>
        </Section>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("settings.name")}><input required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input3" /></Field>
          <Field label={t("settings.phone")}><input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input3" /></Field>
          <Field label={t("settings.currency")}>
            <select value={form.currency ?? "USD"} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input3">
              {["USD", "EUR", "GBP", "AED", "SAR", "MAD", "TND", "DZD", "EGP"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={t("settings.defaultLanguage")}>
            <select value={form.default_language ?? "en"} onChange={(e) => setForm({ ...form, default_language: e.target.value })} className="input3">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Cuisine Type"><input value={form.cuisine_type ?? ""} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="e.g. Italian, Sushi, Cafe" className="input3" /></Field>
          <Field label="Email"><input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input3" /></Field>
          <Field label="Website"><input type="url" value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input3" /></Field>
          <Field label="Opening Hours (e.g. Mon-Fri 9am-10pm)"><input value={form.opening_hours ?? ""} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} className="input3" /></Field>
          <Field label="Instagram URL"><input type="url" value={form.social_links?.instagram ?? ""} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })} className="input3" /></Field>
          <Field label="Facebook URL"><input type="url" value={form.social_links?.facebook ?? ""} onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, facebook: e.target.value } })} className="input3" /></Field>
        </div>

        <label className="flex items-center gap-2 text-sm bg-card border border-border p-3 rounded-lg">
          <input type="checkbox" checked={form.is_open ?? true} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
          <span className="font-medium text-foreground">Restaurant is currently open for business</span>
        </label>

        <Field label={t("settings.description")}>
          <textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input3" />
        </Field>

        <Field label={t("settings.slug")}>
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <span>/menu/</span>
            <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} className="input3 flex-1" />
          </div>
        </Field>

        <button disabled={saving} className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm disabled:opacity-50">
          {saving ? t("common.saving") : t("common.save")}
        </button>
        <style>{`.input3 { width:100%; padding:0.5rem 0.75rem; border:1px solid var(--color-border); border-radius:0.5rem; font-size:0.875rem; background:var(--color-background); }`}</style>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="font-semibold mb-2 text-sm">{title}</h3>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>{children}</label>;
}
function FileBtn({ onChange, label }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer border border-border px-3 py-2 rounded-lg text-sm hover:bg-muted">
      <Upload className="size-4" /> {label}
      <input type="file" accept="image/*" onChange={onChange} className="hidden" />
    </label>
  );
}
