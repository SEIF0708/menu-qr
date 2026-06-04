import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSignedImage } from "@/lib/use-signed-image";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, X, Plus, Minus } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/menu/$slug")({
  loader: async ({ params }) => {
    // We must query the public view because anon role cannot select('*') on the base table due to column-level security.
    const { data: restaurant } = await supabase.from("restaurants_public").select("*").eq("slug", params.slug).maybeSingle();
    if (!restaurant) throw notFound();
    return { restaurant };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.restaurant.name} — Menu` },
      { name: "description", content: loaderData?.restaurant.description ?? "Digital menu" },
      { property: "og:title", content: loaderData?.restaurant.name },
    ],
  }),
  component: MenuPage,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="min-h-screen flex items-center justify-center text-muted-foreground">Menu not found</div>,
});

function MenuPage() {
  const { restaurant } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart(slug);

  const cover = useSignedImage(restaurant.cover_image_url);
  const logo = useSignedImage(restaurant.logo_url);

  // Track view once
  useEffect(() => {
    supabase.from("menu_views").insert({ restaurant_id: restaurant.id }).then(() => {});
    if (restaurant.default_language && !localStorage.getItem("menuflow_lang")) {
      i18n.changeLanguage(restaurant.default_language);
    }
  }, [restaurant.id, restaurant.default_language, i18n]);

  const cats = useQuery({
    queryKey: ["public-cats", restaurant.id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).eq("is_active", true).order("display_order");
      return data ?? [];
    },
  });
  const prods = useQuery({
    queryKey: ["public-prods", restaurant.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("restaurant_id", restaurant.id).order("display_order");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = prods.data ?? [];
    if (activeCat) list = list.filter((p) => p.category_id === activeCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => [p.name_en, p.name_fr, p.name_ar].some((n) => n?.toLowerCase().includes(q)));
    }
    return list;
  }, [prods.data, activeCat, search]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="relative h-56 sm:h-72">
        <div className="absolute inset-0 bg-muted">
          {cover && <img src={cover} alt="" className="size-full object-cover" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 inset-x-4 flex items-start justify-between">
          {logo ? (
            <img src={logo} alt="" className="size-12 rounded-lg bg-white shadow-lg object-cover" />
          ) : (
            <div className="size-12 bg-white rounded-lg grid place-items-center shadow-lg">
              <span className="text-primary font-display font-bold">{restaurant.name?.[0] ?? "M"}</span>
            </div>
          )}
          <LangSwitcher variant="dark" />
        </div>
        <div className="absolute bottom-4 inset-x-4">
          <h1 className="text-white font-display text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
          {restaurant.description && <p className="text-white/80 text-sm mt-1 max-w-xl">{restaurant.description}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Search */}
        <div className="relative -mt-6 z-10">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("menu.searchPlaceholder")}
            className="w-full ps-10 pe-3 py-3 rounded-xl bg-card border border-border shadow-md text-sm" />
        </div>

        {/* Sticky tabs */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-b border-border mt-6">
          <div className="flex gap-5 overflow-x-auto no-scrollbar">
            <CatTab active={!activeCat} onClick={() => setActiveCat(null)} label={t("common.all")} />
            {cats.data?.map((c) => (
              <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}
                label={pickLocalized(c, "name", lang) || "—"} />
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="py-6 flex flex-col gap-6">
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">{t("menu.noProducts")}</p>}
          {filtered.map((p) => <ProductRow key={p.id} product={p} slug={slug} lang={lang} currency={restaurant.currency} onAdd={() => cart.add({ id: p.id, name: pickLocalized(p, "name", lang) || "—", price: Number(p.price), image: p.image_url })} />)}
        </div>
      </div>

      {/* Floating cart */}
      {cart.count > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full flex items-center gap-3 shadow-xl active:scale-95 transition-transform z-30">
          <ShoppingBag className="size-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{t("menu.viewCart")}</span>
          <span className="size-6 bg-white/20 rounded-full grid place-items-center text-[11px] font-bold">{cart.count}</span>
          <span className="text-sm font-display">{formatPrice(cart.total, restaurant.currency, lang)}</span>
        </button>
      )}

      {cartOpen && <CartDrawer slug={slug} currency={restaurant.currency} lang={lang} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function CatTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`whitespace-nowrap text-sm pb-2 border-b-2 transition-colors ${active ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground"}`}>
      {label}
    </button>
  );
}

function ProductRow({ product, slug, lang, currency, onAdd }: any) {
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0">
        <Link to="/menu/$slug/product/$productId" params={{ slug, productId: product.id }} className="block">
          <h3 className="font-semibold text-base">{name}</h3>
          {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{desc}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-display font-bold">{formatPrice(product.price, currency, lang)}</span>
            {!product.is_available && <span className="text-[10px] uppercase text-muted-foreground">·  {/* fallback */}</span>}
          </div>
        </Link>
      </div>
      <div className="relative">
        <Link to="/menu/$slug/product/$productId" params={{ slug, productId: product.id }} className="block size-24 sm:size-28 rounded-xl bg-muted overflow-hidden flex-shrink-0">
          {img && <img src={img} alt="" loading="lazy" className="size-full object-cover" />}
        </Link>
        {product.is_available && (
          <button onClick={onAdd} className="absolute -bottom-2 -right-2 size-8 bg-primary text-primary-foreground rounded-full shadow-lg grid place-items-center active:scale-90 transition-transform">
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CartDrawer({ slug, currency, lang, onClose }: { slug: string; currency: string; lang: string; onClose: () => void }) {
  const { t } = useTranslation();
  const cart = useCart(slug);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">{t("menu.cart")}</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        {cart.items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">{t("menu.emptyCart")}</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {cart.items.map((i) => (
                <div key={i.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(i.price, currency, lang)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cart.setQty(i.id, i.qty - 1)} className="size-7 border border-border rounded grid place-items-center"><Minus className="size-3" /></button>
                    <span className="w-7 text-center text-sm">{i.qty}</span>
                    <button onClick={() => cart.setQty(i.id, i.qty + 1)} className="size-7 border border-border rounded grid place-items-center"><Plus className="size-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex justify-between mb-3">
                <span className="font-medium">{t("menu.total")}</span>
                <span className="font-display font-bold text-lg">{formatPrice(cart.total, currency, lang)}</span>
              </div>
              <button onClick={cart.clear} className="w-full py-2 text-xs text-muted-foreground hover:text-destructive">{t("menu.clearCart")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
