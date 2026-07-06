import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, FolderKanban, GripVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { pickLocalized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/dashboard/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const { data: restaurant } = useMyRestaurant();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  const cats = useQuery({
    queryKey: ["categories", restaurant?.id],
    enabled: !!restaurant?.id,
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
    <div className="max-w-5xl mx-auto pb-12">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wide uppercase mb-2">
            <FolderKanban className="size-3.5" />
            {t("nav.categories")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">{t("categories.title")}</h1>
          <p className="text-base text-muted-foreground">{t("categories.subtitle")}</p>
        </div>
        <button onClick={() => {
            if (restaurant?.subscription_status === "unpaid" && (cats.data?.length ?? 0) >= 3) {
              toast.error("Free tier limit reached. Maximum 3 categories allowed. Please upgrade.");
              return;
            }
            setShowNew(true);
          }} className="group relative inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <Plus className="size-4 relative z-10" />
          <span className="relative z-10">{t("categories.new")}</span>
        </button>
      </header>

      {cats.data?.length === 0 ? (
        <EmptyState onClick={() => {
          if (restaurant?.subscription_status === "unpaid" && (cats.data?.length ?? 0) >= 3) {
            toast.error("Free tier limit reached. Maximum 3 categories allowed. Please upgrade.");
            return;
          }
          setShowNew(true);
        }} />
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence mode="popLayout">
            {cats.data?.map((c: any, i: number) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={c.id} 
                className="group relative overflow-hidden bg-card border border-border/60 hover:border-primary/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col p-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex items-start justify-between relative z-10 mb-2">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 grid place-items-center shadow-sm size-8 rounded-lg">
                    <FolderKanban className="text-primary size-4" />
                  </div>
                  <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border/50 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => move.mutate({ id: c.id, dir: -1 })} disabled={i === 0} className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronUp className="size-3" /></button>
                    <button onClick={() => move.mutate({ id: c.id, dir: 1 })} disabled={i === (cats.data?.length ?? 0) - 1} className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronDown className="size-3" /></button>
                  </div>
                </div>
                
                <div className="flex-1 relative z-10">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors text-sm mb-1">{pickLocalized(c, "name", lang) || "—"}</h3>
                  <div className="inline-flex items-center rounded-full bg-secondary/50 border border-border/50 font-medium text-secondary-foreground text-[10px] px-1.5 py-0 mb-2">
                    {t("categories.itemsCount", { count: c.products?.length ?? 0 })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/50 mt-auto relative z-10 pt-2.5">
                  <button 
                    onClick={() => toggle.mutate({ id: c.id, active: !c.is_active })}
                    className="flex items-center gap-2 group/toggle"
                  >
                    <div className={cn("relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none h-4 w-7", c.is_active ? "bg-primary" : "bg-muted")}>
                      <span className={cn("pointer-events-none inline-block transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out h-3 w-3", c.is_active ? "translate-x-3" : "translate-x-0")} />
                    </div>
                  </button>

                  <div className="flex gap-1">
                    <button onClick={() => setEditing(c)} className="bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 rounded-lg transition-all text-muted-foreground p-1.5">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => confirm(t("common.confirmDelete")) && del.mutate(c.id)} className="bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 rounded-lg transition-all text-muted-foreground p-1.5">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {(showNew || editing) && (
          <CategoryDialog
            restaurantId={restaurant!.id}
            category={editing}
            nextOrder={(cats.data?.length ?? 0)}
            onClose={() => { setShowNew(false); setEditing(null); qc.invalidateQueries({ queryKey: ["categories"] }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 px-6 bg-card/50 backdrop-blur-sm border border-dashed border-border/60 hover:border-primary/30 rounded-3xl transition-colors duration-300 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-primary/10 text-primary"
        >
          <FolderKanban className="size-10" />
        </motion.div>
        <h3 className="font-display text-2xl font-bold tracking-tight mb-2 text-foreground">{t("categories.empty")}</h3>
        <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto">{t("categories.emptyHint")}</p>
        <button onClick={onClick} className="group relative inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <Plus className="size-5 relative z-10" /> 
          <span className="relative z-10">{t("categories.new")}</span>
        </button>
      </div>
    </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
      />
      <motion.form 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onSubmit={submit} 
        onClick={(e) => e.stopPropagation()} 
        className="relative z-10 bg-card border border-border/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90dvh] overflow-y-auto flex flex-col"
      >
        <div className="mb-8">
          <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            {category ? <Pencil className="size-6" /> : <Plus className="size-6" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {category ? t("categories.edit") : t("categories.new")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {category ? "Update your category details below." : "Fill in the details to create a new category."}
          </p>
        </div>

        <div className="space-y-5 flex-1">
          <LangField label={t("categories.nameEn")} value={name_en} onChange={setEn} placeholder="e.g. Starters" />
          <LangField label={t("categories.nameFr")} value={name_fr} onChange={setFr} placeholder="e.g. Entrées" />
          <LangField label={t("categories.nameAr")} value={name_ar} onChange={setAr} dir="rtl" placeholder="مثال: المقبلات" />
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
          <button type="button" onClick={onClose} className="flex-1 py-3 px-4 border border-border/80 hover:bg-muted/50 rounded-xl text-sm font-semibold transition-colors">
            {t("common.cancel")}
          </button>
          <button disabled={saving} className="group relative flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-70 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t("common.saving")}
                </>
              ) : t("common.save")}
            </span>
          </button>
        </div>
      </motion.form>
    </div>
  );
}

function LangField({ label, value, onChange, dir, placeholder }: { label: string; value: string; onChange: (s: string) => void; dir?: "rtl", placeholder?: string }) {
  return (
    <label className="block group">
      <span className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input 
          dir={dir} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-border/60 rounded-xl text-sm bg-background/50 hover:bg-background focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
        />
      </div>
    </label>
  );
}
