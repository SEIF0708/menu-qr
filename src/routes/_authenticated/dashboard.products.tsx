import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRestaurant } from "@/lib/use-restaurant";
import { useSignedImage } from "@/lib/use-signed-image";
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, Copy, Search, UtensilsCrossed, Upload, X, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { uploadAsset } from "@/lib/storage";
import { formatPrice, pickLocalized } from "@/lib/format";
import { SizesEditor, ModifiersEditor, CrossSellsEditor } from "@/components/dashboard/ProductCustomizationsEditor";

export const Route = createFileRoute("/_authenticated/dashboard/products")({ component: ProductsPage });

function ProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const { data: restaurant } = useMyRestaurant();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const products = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["products", restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, product_sizes(*), modifier_groups(*, modifiers(*)), product_cross_sells!product_id(*)").eq("restaurant_id", restaurant!.id).order("display_order").order("created_at", { ascending: false });
      if (error) {
        console.error("Products fetch error:", error);
        if (error.code === 'PGRST200') {
          toast.error("Database update required. Please run the product customization migration in Supabase.");
        }
        throw error;
      }
      return data ?? [];
    },
  });

  const cats = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["categories-simple", restaurant?.id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name_en, name_fr, name_ar").eq("restaurant_id", restaurant!.id).order("display_order");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (filterCat) list = list.filter((p) => p.category_id === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => [p.name_en, p.name_fr, p.name_ar].some((n) => n?.toLowerCase().includes(q)));
    }
    return list;
  }, [products.data, search, filterCat]);

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("products").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success(t("common.saved")); },
  });
  const dup = useMutation({
    mutationFn: async (p: any) => {
      if (restaurant?.subscription_status === "unpaid" && (products.data?.length ?? 0) >= 9) {
        throw new Error("Free tier limit reached. Maximum 9 products allowed. Please upgrade.");
      }
      const { id, created_at, updated_at, ...rest } = p;
      await supabase.from("products").insert({ ...rest, name_en: (rest.name_en || "") + " (copy)" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      await supabase.from("products").update({ is_available: available }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{t("nav.products")}</p>
          <h1 className="text-3xl font-display font-bold">{t("products.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("products.subtitle")}</p>
        </div>
        <button onClick={() => {
            if (restaurant?.subscription_status === "unpaid" && (products.data?.length ?? 0) >= 9) {
              toast.error("Free tier limit reached. Maximum 9 products allowed. Please upgrade.");
              return;
            }
            setShowNew(true);
          }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-primary/20">
          <Plus className="size-4" /> {t("products.new")}
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("products.searchPlaceholder")}
            className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-card text-sm" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg bg-card text-sm min-w-[180px]">
          <option value="">{t("common.all")}</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{pickLocalized(c, "name", lang) || "—"}</option>)}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden bg-card shrink-0">
          <button 
            onClick={() => setViewMode("list")} 
            className={`px-3 py-2.5 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            title="List View"
          >
            <List className="size-4" />
          </button>
          <button 
            onClick={() => setViewMode("grid")} 
            className={`px-3 py-2.5 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            title="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {(() => {
        if (products.isLoading) {
          return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading products...</div>;
        }
        if (products.isError) {
          return <div className="py-20 text-center text-destructive font-bold">Error loading products. Check console for details.</div>;
        }
        if (filtered.length === 0) {
          return (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
              <UtensilsCrossed className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-1">{t("products.empty")}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t("products.emptyHint")}</p>
              <button onClick={() => {
                if (restaurant?.subscription_status === "unpaid" && (products.data?.length ?? 0) >= 9) {
                  toast.error("Free tier limit reached. Maximum 9 products allowed. Please upgrade.");
                  return;
                }
                setShowNew(true);
              }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium">
                <Plus className="size-4" /> {t("products.new")}
              </button>
            </div>
          );
        }

        const map = new Map();
        if (cats.data) cats.data.forEach(c => map.set(c.id, { category: c, products: [] }));
        map.set("uncategorized", { category: { id: "uncategorized", name_en: "Uncategorized", name_fr: "Non classé", name_ar: "غير مصنف" }, products: [] });

        filtered.forEach(p => {
          const catId = p.category_id || "uncategorized";
          if (map.has(catId)) map.get(catId).products.push(p);
          else map.get("uncategorized").products.push(p);
        });

        const grouped = Array.from(map.values()).filter(g => g.products.length > 0);

        return (
          <div className="space-y-8">
            {grouped.map(group => (
              <div key={group.category.id} className="space-y-3">
                <h2 className="text-lg font-display font-bold text-foreground/80 px-1 border-b border-border/50 pb-2">
                  {pickLocalized(group.category, "name", lang)}
                </h2>
                <div className={viewMode === "list" ? "space-y-3" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-4"}>
                  {group.products.map((p: any) => (
                    <ProductCard key={p.id} product={p} lang={lang} currency={restaurant?.currency || "TND"} viewMode={viewMode}
                      onEdit={() => setEditing(p)} onDelete={() => confirm(t("common.confirmDelete")) && del.mutate(p.id)}
                      onDup={() => dup.mutate(p)} onToggle={(v: boolean) => toggle.mutate({ id: p.id, available: v })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {(showNew || editing) && (
        <ProductDialog restaurantId={restaurant!.id} product={editing} categories={cats.data ?? []}
          onClose={() => { setShowNew(false); setEditing(null); qc.invalidateQueries({ queryKey: ["products"] }); }} />
      )}
    </div>
  );
}

function ProductCard({ product, lang, currency, viewMode, onEdit, onDelete, onDup, onToggle }: any) {
  const img = useSignedImage(product.image_url);

  if (viewMode === "grid") {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group flex flex-col relative">
        <div className="aspect-[4/3] bg-muted relative border-b border-border/50">
          {img ? (
            <img src={img} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground opacity-30"><UtensilsCrossed className="size-12" /></div>
          )}
          <button onClick={() => onToggle(!product.is_available)}
            className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm transition-colors ${product.is_available ? "bg-emerald-500 text-white" : "bg-stone-500 text-white"}`}>
            {product.is_available ? "ON" : "OFF"}
          </button>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold truncate text-foreground/90">{pickLocalized(product, "name", lang) || "—"}</h3>
          <p className="text-sm font-display font-bold text-primary mt-1">{formatPrice(product.price, currency, lang)}</p>
          <div className="flex gap-2 mt-auto pt-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="flex-1 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded flex items-center justify-center transition-colors"><Pencil className="size-4" /></button>
            <button onClick={onDup} className="flex-1 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded flex items-center justify-center transition-colors"><Copy className="size-4" /></button>
            <button onClick={onDelete} className="flex-1 py-1.5 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded flex items-center justify-center transition-colors"><Trash2 className="size-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-3 sm:gap-4 hover:shadow-md hover:border-primary/30 transition-all group relative">
      <div className="size-20 sm:size-24 bg-muted rounded-lg relative overflow-hidden flex-shrink-0 border border-border/50">
        {img ? (
          <img src={img} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground opacity-30"><UtensilsCrossed className="size-8" /></div>
        )}
        <button onClick={() => onToggle(!product.is_available)}
          className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm transition-colors ${product.is_available ? "bg-emerald-500 text-white" : "bg-stone-500 text-white"}`}>
          {product.is_available ? "ON" : "OFF"}
        </button>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h3 className="font-bold truncate text-sm sm:text-base text-foreground/90">{pickLocalized(product, "name", lang) || "—"}</h3>
        <p className="text-sm font-display font-bold text-primary mt-1">{formatPrice(product.price, currency, lang)}</p>
      </div>
      <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pr-1">
        <button onClick={onEdit} className="size-7 sm:size-8 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded flex items-center justify-center transition-colors"><Pencil className="size-3.5 sm:size-4" /></button>
        <button onClick={onDup} className="size-7 sm:size-8 bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded flex items-center justify-center transition-colors"><Copy className="size-3.5 sm:size-4" /></button>
        <button onClick={onDelete} className="size-7 sm:size-8 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded flex items-center justify-center transition-colors"><Trash2 className="size-3.5 sm:size-4" /></button>
      </div>
    </div>
  );
}

function ProductDialog({ restaurantId, product, categories, onClose }: { restaurantId: string; product: any | null; categories: any[]; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const [form, setForm] = useState({
    name_en: product?.name_en ?? "", name_fr: product?.name_fr ?? "", name_ar: product?.name_ar ?? "",
    description_en: product?.description_en ?? "", description_fr: product?.description_fr ?? "", description_ar: product?.description_ar ?? "",
    price: product?.price ?? 0,
    category_id: product?.category_id ?? "",
    is_available: product?.is_available ?? true,
    image_url: product?.image_url ?? "",
    featured: product?.featured ?? false,
    popular: product?.popular ?? false,
    chef_recommendation: product?.chef_recommendation ?? false,
    prep_time_minutes: product?.prep_time_minutes ?? "",
    calories: product?.calories ?? "",
    ingredients: product?.ingredients ?? "",
    allergens: product?.allergens ?? "",
    badges: product?.badges ?? [],
    has_sizes: product?.has_sizes ?? false,
    has_modifiers: product?.has_modifiers ?? false,
    has_cross_sells: product?.has_cross_sells ?? false,
    product_sizes: product?.product_sizes ?? [],
    modifier_groups: product?.modifier_groups ?? [],
    product_cross_sells: product?.product_cross_sells ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const img = useSignedImage(form.image_url);

  // We need to fetch all products for cross-sells
  const allProds = useQuery({
    queryKey: ["all-products-for-cross", restaurantId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_en, name_fr, name_ar").eq("restaurant_id", restaurantId).neq("id", product?.id || "none");
      return data ?? [];
    }
  });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const path = await uploadAsset(file, u.user!.id, "product");
      setForm({ ...form, image_url: path });
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        name_en: form.name_en, name_fr: form.name_fr, name_ar: form.name_ar,
        description_en: form.description_en, description_fr: form.description_fr, description_ar: form.description_ar,
        price: Number(form.price), 
        category_id: form.category_id || null, 
        is_available: form.is_available,
        image_url: form.image_url,
        featured: form.featured, popular: form.popular, chef_recommendation: form.chef_recommendation,
        prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null,
        calories: form.calories ? Number(form.calories) : null,
        ingredients: form.ingredients, allergens: form.allergens, badges: form.badges,
        has_sizes: form.has_sizes, has_modifiers: form.has_modifiers, has_cross_sells: form.has_cross_sells,
        restaurant_id: restaurantId,
      };
      
      let newProductId = product?.id;
      if (product) {
        await supabase.from("products").update(payload).eq("id", product.id);
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        newProductId = data.id;
      }

      // Sync sizes
      if (form.has_sizes && form.product_sizes.length > 0) {
        const sizesToUpsert = form.product_sizes.map((s: any, idx: number) => {
          const { id, created_at, ...rest } = s; // Strip id and created_at to avoid duplicate key errors on insert
          return { ...rest, product_id: newProductId, display_order: idx };
        });
        await supabase.from("product_sizes").delete().eq("product_id", newProductId);
        const { error: sizesErr } = await supabase.from("product_sizes").insert(sizesToUpsert);
        if (sizesErr) throw sizesErr;
      } else {
        await supabase.from("product_sizes").delete().eq("product_id", newProductId);
      }

      // Sync modifiers
      if (form.has_modifiers && form.modifier_groups.length > 0) {
        await supabase.from("modifier_groups").delete().eq("product_id", newProductId);
        for (let i = 0; i < form.modifier_groups.length; i++) {
          const mg = form.modifier_groups[i];
          const { data: mgData, error: mgError } = await supabase.from("modifier_groups").insert({
            product_id: newProductId, name_en: mg.name_en, name_fr: mg.name_fr, name_ar: mg.name_ar,
            is_required: mg.is_required, min_selections: mg.min_selections, max_selections: mg.max_selections, display_order: i
          }).select().single();
          
          if (mgError) throw mgError;

          if (mg.modifiers && mg.modifiers.length > 0) {
            const modsToInsert = mg.modifiers.map((m: any, idx: number) => {
              const { id, created_at, ...rest } = m;
              return { ...rest, group_id: mgData.id, display_order: idx };
            });
            const { error: modErr } = await supabase.from("modifiers").insert(modsToInsert);
            if (modErr) throw modErr;
          }
        }
      } else {
        await supabase.from("modifier_groups").delete().eq("product_id", newProductId);
      }

      // Sync cross sells
      if (form.has_cross_sells && form.product_cross_sells.length > 0) {
        const csToUpsert = form.product_cross_sells.map((c: any, idx: number) => ({ product_id: newProductId, cross_sell_product_id: c.cross_sell_product_id, display_order: idx }));
        await supabase.from("product_cross_sells").delete().eq("product_id", newProductId);
        const { error: csErr } = await supabase.from("product_cross_sells").insert(csToUpsert);
        if (csErr) throw csErr;
      } else {
        await supabase.from("product_cross_sells").delete().eq("product_id", newProductId);
      }

      toast.success(t("common.saved"));
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">{product ? t("products.edit") : t("products.new")}</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="size-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">{t("products.image")}</span>
            <div className="flex gap-3 items-start">
              <div className="size-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {img && <img src={img} alt="" loading="lazy" className="size-full object-cover" />}
              </div>
              <label className="flex-1 cursor-pointer border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground hover:bg-muted transition-colors text-center">
                <Upload className="size-4 mx-auto mb-1" />
                {uploading ? t("common.uploading") : t("products.uploadImage")}
                <input type="file" accept="image/*" onChange={upload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("products.price")}>
              <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value as any })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
            </Field>
            <Field label={t("products.category")}>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{pickLocalized(c, "name", lang) || "—"}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label={t("products.nameEn")}><input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="input2" /></Field>
            <Field label={t("products.nameFr")}><input value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} className="input2" /></Field>
            <Field label={t("products.nameAr")}><input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="input2" /></Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label={t("products.descriptionEn")}><textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="input2" /></Field>
            <Field label={t("products.descriptionFr")}><textarea rows={3} value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} className="input2" /></Field>
            <Field label={t("products.descriptionAr")}><textarea dir="rtl" rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="input2" /></Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            {t("products.available")}
          </label>

          {/* Customization Toggles */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold">Advanced Customization</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.has_sizes} onChange={(e) => setForm({ ...form, has_sizes: e.target.checked })} /> Enable Sizes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.has_modifiers} onChange={(e) => setForm({ ...form, has_modifiers: e.target.checked })} /> Enable Options / Toppings
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.has_cross_sells} onChange={(e) => setForm({ ...form, has_cross_sells: e.target.checked })} /> Enable Cross-Sells
              </label>
            </div>
            
            {form.has_sizes && (
              <SizesEditor sizes={form.product_sizes} setSizes={(s) => setForm({ ...form, product_sizes: s })} />
            )}
            
            {form.has_modifiers && (
              <ModifiersEditor groups={form.modifier_groups} setGroups={(g) => setForm({ ...form, modifier_groups: g })} />
            )}
            
            {form.has_cross_sells && (
              <CrossSellsEditor 
                crossSells={form.product_cross_sells} 
                setCrossSells={(c) => setForm({ ...form, product_cross_sells: c })} 
                availableProducts={allProds.data || []} 
                lang={lang} 
              />
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <Field label="Prep Time (mins)"><input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} className="input2" /></Field>
            <Field label="Calories (kcal)"><input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input2" /></Field>
          </div>

          <Field label="Ingredients (Comma separated)"><textarea rows={2} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} className="input2" /></Field>
          <Field label="Allergens (Comma separated)"><textarea rows={2} value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} className="input2" /></Field>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold">Product Badges & Highlights</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Popular</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.chef_recommendation} onChange={(e) => setForm({ ...form, chef_recommendation: e.target.checked })} /> Chef Recommendation</label>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-3">
              {["Vegetarian", "Vegan", "Halal", "Spicy", "Gluten Free"].map(badge => (
                <label key={badge} className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-full cursor-pointer hover:bg-muted/80">
                  <input type="checkbox" 
                    checked={form.badges.includes(badge)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, badges: [...form.badges, badge] });
                      else setForm({ ...form, badges: form.badges.filter((b: string) => b !== badge) });
                    }} 
                  /> {badge}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium">{t("common.cancel")}</button>
          <button disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">{saving ? t("common.saving") : t("common.save")}</button>
        </div>
        <style>{`.input2 { width:100%; padding:0.5rem 0.75rem; border:1px solid var(--color-border); border-radius:0.5rem; font-size:0.875rem; background:var(--color-background); }`}</style>
      </form>
    </div>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>{children}</label>;
}
