import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/storage";
import { useSignedImage } from "@/lib/use-signed-image";
import { Upload, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: restaurant, refetch } = useMyRestaurant();
  const [step, setStep] = useState(1);
  const total = 6;

  const [info, setInfo] = useState({ name: "", description: "", phone: "", currency: "TND" });
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [cat, setCat] = useState({ name_en: "", name_fr: "", name_ar: "" });
  const [catId, setCatId] = useState<string | null>(null);
  const [prod, setProd] = useState({ name_en: "", price: 0 });

  useEffect(() => { if (restaurant && !info.name) setInfo({ name: restaurant.name, description: restaurant.description || "", phone: restaurant.phone || "", currency: restaurant.currency }); }, [restaurant, info.name]);

  const logoUrl = useSignedImage(logo);
  const coverUrl = useSignedImage(cover);

  const upload = async (file: File, kind: "logo" | "cover") => {
    const { data: u } = await supabase.auth.getUser();
    const path = await uploadAsset(file, u.user!.id, kind);
    if (kind === "logo") setLogo(path); else setCover(path);
  };

  const saveAndNext = async () => {
    try {
      if (step === 1) {
        await supabase.from("restaurants").update(info).eq("id", restaurant!.id);
      } else if (step === 2 && logo) {
        await supabase.from("restaurants").update({ logo_url: logo }).eq("id", restaurant!.id);
      } else if (step === 3 && cover) {
        await supabase.from("restaurants").update({ cover_image_url: cover }).eq("id", restaurant!.id);
      } else if (step === 4) {
        if (cat.name_en || cat.name_fr || cat.name_ar) {
          const { data } = await supabase.from("categories").insert({ restaurant_id: restaurant!.id, ...cat, display_order: 0 }).select().single();
          setCatId(data?.id ?? null);
        }
      } else if (step === 5) {
        if (prod.name_en) {
          await supabase.from("products").insert({ restaurant_id: restaurant!.id, category_id: catId, name_en: prod.name_en, price: Number(prod.price) });
        }
      } else if (step === 6) {
        await supabase.from("restaurants").update({ onboarding_completed: true }).eq("id", restaurant!.id);
        await refetch();
        navigate({ to: "/dashboard" });
        return;
      }
      setStep(step + 1);
    } catch (e: any) { toast.error(e.message); }
  };

  if (!restaurant) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("onboarding.step", { n: step, total })}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{t(`onboarding.step${step}`)}</h1>
        </div>

        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">{t("onboarding.intro")}</p>
              <input placeholder={t("settings.name")} value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} className="inp" />
              <textarea placeholder={t("settings.description")} rows={3} value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} className="inp" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={t("settings.phone")} value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className="inp" />
                <select value={info.currency} onChange={(e) => setInfo({ ...info, currency: e.target.value })} className="inp">
                  {["TND", "USD", "EUR", "GBP", "AED", "SAR", "MAD"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col items-center gap-4">
              <div className="size-32 bg-muted rounded-2xl overflow-hidden">
                {logoUrl && <img src={logoUrl} alt="" className="size-full object-cover" />}
              </div>
              <UploadBtn onFile={(f) => upload(f, "logo")} label={t("settings.logo")} />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="aspect-[3/1] bg-muted rounded-xl overflow-hidden">
                {coverUrl && <img src={coverUrl} alt="" className="size-full object-cover" />}
              </div>
              <UploadBtn onFile={(f) => upload(f, "cover")} label={t("settings.cover")} />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <input placeholder={t("categories.nameEn")} value={cat.name_en} onChange={(e) => setCat({ ...cat, name_en: e.target.value })} className="inp" />
              <input placeholder={t("categories.nameFr")} value={cat.name_fr} onChange={(e) => setCat({ ...cat, name_fr: e.target.value })} className="inp" />
              <input dir="rtl" placeholder={t("categories.nameAr")} value={cat.name_ar} onChange={(e) => setCat({ ...cat, name_ar: e.target.value })} className="inp" />
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3">
              <input placeholder={t("products.nameEn")} value={prod.name_en} onChange={(e) => setProd({ ...prod, name_en: e.target.value })} className="inp" />
              <input type="number" step="0.01" placeholder={t("products.price")} value={prod.price} onChange={(e) => setProd({ ...prod, price: e.target.value as any })} className="inp" />
            </div>
          )}
          {step === 6 && (
            <div className="text-center space-y-4">
              <Check className="size-12 text-success mx-auto" />
              <p className="text-sm text-muted-foreground">{t("onboarding.doneHint")}</p>
              <div className="inline-block p-4 bg-white border border-border rounded-xl">
                <QRCodeCanvas value={`${origin}/menu/${restaurant.slug}`} size={160} fgColor="#4A1D1F" />
              </div>
              <p className="text-xs font-mono text-muted-foreground break-all">{`${origin}/menu/${restaurant.slug}`}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30">← {t("common.back")}</button>
          <div className="flex gap-2">
            {step < total && step !== 1 && (
              <button onClick={() => setStep(step + 1)} className="text-sm text-muted-foreground">{t("common.skip")}</button>
            )}
            <button onClick={saveAndNext} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium">
              {step === total ? t("onboarding.done") : t("common.next")} <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <style>{`.inp { width:100%; padding:0.625rem 0.75rem; border:1px solid var(--color-border); border-radius:0.5rem; font-size:0.875rem; background:var(--color-background); }`}</style>
    </div>
  );
}

function UploadBtn({ onFile, label }: { onFile: (f: File) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer border border-border px-4 py-2 rounded-full text-sm hover:bg-muted">
      <Upload className="size-4" /> {label}
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="hidden" />
    </label>
  );
}
