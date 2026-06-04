import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { pickLocalized } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const { data: restaurant } = useMyRestaurant();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  const cats = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["categories", restaurant?.id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*, products(id)").eq("restaurant_id", restaurant!.id).order("display_order");
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success(t("common.saved")); },
    onError: (e: any) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const list = cats.data ?? [];
      const idx = list.findIndex((c) => c.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= list.length) return;
      const a = list[idx], b = list[swap];
      await supabase.from("categories").update({ display_order: b.display_order }).eq("id", a.id);
      await supabase.from("categories").update({ display_order: a.display_order }).eq("id", b.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("categories").update({ is_active: active }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-8 flex justify-between items-end gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.categories")}</p>
          <h1 className="text-3xl font-display font-bold">{t("categories.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("categories.subtitle")}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-primary/20">
          <Plus className="size-4" /> {t("categories.new")}
        </button>
      </header>

      {cats.data?.length === 0 ? (
        <EmptyState onClick={() => setShowNew(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.data?.map((c: any, i: number) => (
            <div key={c.id} className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="size-9 rounded-lg bg-primary/5 grid place-items-center">
                  <FolderKanban className="size-4 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => move.mutate({ id: c.id, dir: -1 })} disabled={i === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button onClick={() => move.mutate({ id: c.id, dir: 1 })} disabled={i === (cats.data?.length ?? 0) - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ChevronDown className="size-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold mb-1 truncate">{pickLocalized(c, "name", lang) || "—"}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("categories.itemsCount", { count: c.products?.length ?? 0 })}</p>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={c.is_active} onChange={(e) => toggle.mutate({ id: c.id, active: e.target.checked })} />
                  {c.is_active ? t("common.active") : t("common.inactive")}
                </label>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-muted rounded"><Pencil className="size-3.5" /></button>
                  <button onClick={() => confirm(t("common.confirmDelete")) && del.mutate(c.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showNew || editing) && (
        <CategoryDialog
          restaurantId={restaurant!.id}
          category={editing}
          nextOrder={(cats.data?.length ?? 0)}
          onClose={() => { setShowNew(false); setEditing(null); qc.invalidateQueries({ queryKey: ["categories"] }); }}
        />
      )}
    </div>
  );
}

function EmptyState({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
      <FolderKanban className="size-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-display text-xl font-semibold mb-1">{t("categories.empty")}</h3>
      <p className="text-sm text-muted-foreground mb-6">{t("categories.emptyHint")}</p>
      <button onClick={onClick} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium">
        <Plus className="size-4" /> {t("categories.new")}
      </button>
    </div>
  );
}

function CategoryDialog({ restaurantId, category, nextOrder, onClose }: { restaurantId: string; category: any | null; nextOrder: number; onClose: () => void }) {
  const { t } = useTranslation();
  const [name_en, setEn] = useState(category?.name_en ?? "");
  const [name_fr, setFr] = useState(category?.name_fr ?? "");
  const [name_ar, setAr] = useState(category?.name_ar ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (category) {
        await supabase.from("categories").update({ name_en, name_fr, name_ar }).eq("id", category.id);
      } else {
        await supabase.from("categories").insert({ restaurant_id: restaurantId, name_en, name_fr, name_ar, display_order: nextOrder });
      }
      toast.success(t("common.saved"));
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-display font-bold mb-6">{category ? t("categories.edit") : t("categories.new")}</h2>
        <div className="space-y-4">
          <LangField label={t("categories.nameEn")} value={name_en} onChange={setEn} />
          <LangField label={t("categories.nameFr")} value={name_fr} onChange={setFr} />
          <LangField label={t("categories.nameAr")} value={name_ar} onChange={setAr} dir="rtl" />
        </div>
        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium">{t("common.cancel")}</button>
          <button disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">{saving ? t("common.saving") : t("common.save")}</button>
        </div>
      </form>
    </div>
  );
}

function LangField({ label, value, onChange, dir }: { label: string; value: string; onChange: (s: string) => void; dir?: "rtl" }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input dir={dir} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
    </label>
  );
}
