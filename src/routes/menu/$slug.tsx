import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSignedImage } from "@/lib/use-signed-image";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, X, Plus, Minus, Info, Clock, Flame, Star } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/menu/$slug")({
  loader: async ({ params }) => {
    const { data: restaurant } = await supabase.from("restaurants_public").select("*").eq("slug", params.slug).maybeSingle();
    if (!restaurant) throw notFound();
    return { restaurant };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.restaurant.name} — Menu` },
      { name: "description", content: loaderData?.restaurant.description ?? "Digital menu" },
    ],
  }),
  component: MenuPage,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="min-h-dvh flex items-center justify-center text-muted-foreground">Menu not found</div>,
});

function MenuPage() {
  const { restaurant } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const cart = useCart(slug);
  const cover = useSignedImage(restaurant.cover_image_url);
  const logo = useSignedImage(restaurant.logo_url);

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

  const featured = useMemo(() => {
    return (prods.data ?? []).filter(p => p.featured || p.popular || p.chef_recommendation);
  }, [prods.data]);

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
    <div className="min-h-dvh bg-background pb-32">
      <div className="relative h-64 sm:h-80 bg-muted">
        {cover && <img src={cover} alt="" className="size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-4 inset-x-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
             {logo ? (
              <img src={logo} alt="" className="size-14 sm:size-16 rounded-xl bg-white shadow-xl object-cover border-2 border-white/20" />
            ) : (
              <div className="size-14 sm:size-16 bg-white rounded-xl grid place-items-center shadow-xl border-2 border-white/20">
                <span className="text-primary font-display font-bold text-xl">{restaurant.name?.[0] ?? "M"}</span>
              </div>
            )}
          </div>
          <LangSwitcher variant="dark" />
        </div>
        <div className="absolute bottom-6 inset-x-4 sm:inset-x-6 flex justify-between items-end">
          <div>
             <div className="flex items-center gap-2 mb-2">
                {restaurant.is_open ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    <span className="size-2 rounded-full bg-green-400 animate-pulse" /> Open
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    <span className="size-2 rounded-full bg-red-400" /> Closed
                  </span>
                )}
                {restaurant.cuisine_type && (
                  <span className="text-xs font-medium text-white/90 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    {restaurant.cuisine_type}
                  </span>
                )}
             </div>
             <h1 className="text-white font-display text-3xl sm:text-4xl font-bold">{restaurant.name}</h1>
             {restaurant.description && <p className="text-white/80 text-sm mt-1 max-w-xl line-clamp-2">{restaurant.description}</p>}
          </div>
          <button onClick={() => setInfoOpen(true)} className="size-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full grid place-items-center text-white transition-colors">
            <Info className="size-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-6 z-10">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("menu.searchPlaceholder")}
            className="w-full ps-12 pe-4 py-3.5 rounded-2xl bg-card border border-border shadow-lg text-sm transition-shadow focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {!search && !activeCat && featured.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Flame className="size-5 text-orange-500" />
              <h2 className="text-lg font-display font-bold">Featured & Popular</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
              {featured.map(p => (
                <FeaturedCard key={p.id} product={p} lang={lang} currency={restaurant.currency} onClick={() => setSelectedProduct(p)} />
              ))}
            </div>
          </div>
        )}

        <div className="sticky top-0 bg-background/95 backdrop-blur-md z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-b border-border mt-6">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            <CatTab active={!activeCat} onClick={() => setActiveCat(null)} label={t("common.all")} />
            {cats.data?.map((c) => (
              <CatTab key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}
                label={pickLocalized(c, "name", lang) || "—"} />
            ))}
          </div>
        </div>

        <div className="py-6 flex flex-col gap-6">
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">{t("menu.noProducts")}</p>}
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} lang={lang} currency={restaurant.currency} onClick={() => setSelectedProduct(p)} onAdd={(e: any) => { e.stopPropagation(); cart.add({ id: p.id, name: pickLocalized(p, "name", lang) || "—", price: Number(p.price), image: p.image_url }); }} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {cart.count > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 pointer-events-none">
            <button onClick={() => setCartOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-4 rounded-full flex items-center justify-between gap-6 shadow-2xl pointer-events-auto active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-black/20 rounded-full grid place-items-center">
                  <span className="text-sm font-bold">{cart.count}</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">{t("menu.viewCart")}</span>
              </div>
              <span className="text-base font-display font-bold">{formatPrice(cart.total, restaurant.currency, lang)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && <CartDrawer cart={cart} currency={restaurant.currency} lang={lang} onClose={() => setCartOpen(false)} />}
        {infoOpen && <InfoDrawer restaurant={restaurant} onClose={() => setInfoOpen(false)} />}
        {selectedProduct && <ProductDrawer product={selectedProduct} lang={lang} currency={restaurant.currency} cart={cart} onClose={() => setSelectedProduct(null)} />}
      </AnimatePresence>
    </div>
  );
}

function CatTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`whitespace-nowrap text-sm pb-2 border-b-2 transition-colors ${active ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground font-medium"}`}>
      {label}
    </button>
  );
}

function FeaturedCard({ product, lang, currency, onClick }: any) {
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  return (
    <div onClick={onClick} className="w-40 sm:w-48 flex-shrink-0 cursor-pointer group">
      <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 relative">
        {img ? <img src={img} alt="" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}
        {product.chef_recommendation && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Star className="size-3 fill-current" /> Chef's Choice
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm line-clamp-2">{name}</h3>
      <p className="text-sm font-display font-bold mt-1 text-primary">{formatPrice(product.price, currency, lang)}</p>
    </div>
  );
}

function ProductRow({ product, lang, currency, onClick, onAdd }: any) {
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  return (
    <div onClick={onClick} className="flex gap-4 items-start p-3 -mx-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base">{name}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{desc}</p>}
        
        <div className="flex flex-wrap gap-1.5 mt-2">
           {product.popular && <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Popular</span>}
           {product.badges?.map((b: string) => <span key={b} className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{b}</span>)}
        </div>

        <div className="flex items-center gap-4 mt-3">
          <span className="text-sm font-display font-bold">{formatPrice(product.price, currency, lang)}</span>
          {(product.calories || product.prep_time_minutes) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground border-l border-border pl-4">
              {product.calories && <span className="flex items-center gap-1"><Flame className="size-3" /> {product.calories}</span>}
              {product.prep_time_minutes && <span className="flex items-center gap-1"><Clock className="size-3" /> {product.prep_time_minutes}m</span>}
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <div className="size-28 sm:size-32 rounded-2xl bg-muted overflow-hidden flex-shrink-0 shadow-sm">
          {img && <img src={img} alt="" loading="lazy" className="size-full object-cover" />}
        </div>
        {product.is_available && (
          <button onClick={onAdd} className="absolute -bottom-3 -right-3 size-10 bg-background rounded-full grid place-items-center shadow-lg">
             <div className="size-8 bg-primary text-primary-foreground rounded-full grid place-items-center active:scale-90 transition-transform">
                <Plus className="size-4" />
             </div>
          </button>
        )}
      </div>
    </div>
  );
}

function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} 
        className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-[2rem] flex flex-col max-h-[90dvh] shadow-2xl">
        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
        {children}
      </motion.div>
    </>
  );
}

function ProductDrawer({ product, lang, currency, cart, onClose }: any) {
  const { t } = useTranslation();
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  const [qty, setQty] = useState(1);

  const add = () => {
    for (let i=0; i<qty; i++) {
      cart.add({ id: product.id, name, price: Number(product.price), image: product.image_url });
    }
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="overflow-y-auto pb-24">
         {img && <div className="w-full h-64 sm:h-80 bg-muted/30 flex items-center justify-center p-4"><img src={img} alt="" className="max-w-full max-h-full object-contain rounded-xl shadow-sm" /></div>}
         <div className="p-6">
            <div className="flex justify-between items-start gap-4">
               <div>
                 <h2 className="text-2xl font-display font-bold">{name}</h2>
                 <p className="text-xl font-display font-bold text-primary mt-1">{formatPrice(product.price, currency, lang)}</p>
               </div>
            </div>
            
            {(product.calories || product.prep_time_minutes) && (
              <div className="flex items-center gap-4 mt-4 py-3 border-y border-border">
                {product.calories && <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Calories</span><span className="text-sm font-medium flex items-center gap-1"><Flame className="size-4 text-orange-500"/> {product.calories} kcal</span></div>}
                {product.prep_time_minutes && <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</span><span className="text-sm font-medium flex items-center gap-1"><Clock className="size-4 text-blue-500"/> {product.prep_time_minutes} mins</span></div>}
              </div>
            )}

            {desc && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{desc}</p>}
            
            {product.ingredients && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ingredients</h4>
                <p className="text-sm">{product.ingredients}</p>
              </div>
            )}
            
            {product.allergens && (
              <div className="mt-4 p-3 bg-red-50 text-red-900 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Allergens</h4>
                <p className="text-sm font-medium">{product.allergens}</p>
              </div>
            )}
         </div>
      </div>
      
      <div className="absolute bottom-0 inset-x-0 p-4 bg-background border-t border-border flex items-center gap-4">
        <div className="flex items-center gap-3 bg-muted rounded-full p-1 border border-border/50">
           <button onClick={() => setQty(Math.max(1, qty-1))} className="size-10 rounded-full bg-background shadow-sm grid place-items-center active:scale-95"><Minus className="size-4" /></button>
           <span className="w-4 text-center font-bold text-sm">{qty}</span>
           <button onClick={() => setQty(qty+1)} className="size-10 rounded-full bg-background shadow-sm grid place-items-center active:scale-95"><Plus className="size-4" /></button>
        </div>
        <button onClick={add} className="flex-1 bg-primary text-primary-foreground h-12 rounded-full font-bold text-sm shadow-xl active:scale-[0.98] transition-transform">
           Add to order — {formatPrice(product.price * qty, currency, lang)}
        </button>
      </div>
    </BottomSheet>
  );
}

function CartDrawer({ cart, currency, lang, onClose }: any) {
  const { t } = useTranslation();
  return (
    <BottomSheet onClose={onClose}>
      <div className="p-6 flex flex-col max-h-[80dvh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">{t("menu.cart")}</h2>
          <button onClick={onClose} className="size-8 bg-muted rounded-full grid place-items-center"><X className="size-4" /></button>
        </div>
        {cart.items.length === 0 ? (
          <div className="py-12 text-center">
             <div className="size-16 bg-muted rounded-full grid place-items-center mx-auto mb-4"><ShoppingBag className="size-6 text-muted-foreground" /></div>
             <p className="text-muted-foreground font-medium">{t("menu.emptyCart")}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
              {cart.items.map((i: any) => (
                <div key={i.id} className="py-4 flex items-center gap-4 border-b border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{i.name}</p>
                    <p className="text-sm text-primary font-bold mt-0.5">{formatPrice(i.price, currency, lang)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
                    <button onClick={() => cart.setQty(i.id, i.qty - 1)} className="size-8 rounded-full bg-background shadow-sm grid place-items-center"><Minus className="size-3" /></button>
                    <span className="w-6 text-center text-xs font-bold">{i.qty}</span>
                    <button onClick={() => cart.setQty(i.id, i.qty + 1)} className="size-8 rounded-full bg-background shadow-sm grid place-items-center"><Plus className="size-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-auto">
              <div className="flex justify-between items-center mb-6 bg-muted p-4 rounded-2xl">
                <span className="font-medium">{t("menu.total")}</span>
                <span className="font-display font-bold text-2xl">{formatPrice(cart.total, currency, lang)}</span>
              </div>
              <button onClick={cart.clear} className="w-full py-3 text-sm font-bold text-destructive bg-destructive/10 rounded-full">{t("menu.clearCart")}</button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function InfoDrawer({ restaurant, onClose }: any) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-display font-bold">Restaurant Info</h2>
           <button onClick={onClose} className="size-8 bg-muted rounded-full grid place-items-center"><X className="size-4" /></button>
        </div>
        <div className="space-y-6 pb-8">
           {restaurant.opening_hours && (
             <div>
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Opening Hours</h4>
               <p className="text-sm font-medium">{restaurant.opening_hours}</p>
             </div>
           )}
           {restaurant.phone && (
             <div>
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Phone</h4>
               <a href={`tel:${restaurant.phone}`} className="text-sm font-medium text-primary">{restaurant.phone}</a>
             </div>
           )}
           {restaurant.email && (
             <div>
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Email</h4>
               <a href={`mailto:${restaurant.email}`} className="text-sm font-medium text-primary">{restaurant.email}</a>
             </div>
           )}
           {restaurant.website && (
             <div>
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Website</h4>
               <a href={restaurant.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">{restaurant.website}</a>
             </div>
           )}
           {restaurant.social_links && Object.keys(restaurant.social_links).length > 0 && (
             <div>
               <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Social</h4>
               <div className="flex gap-4">
                 {restaurant.social_links.instagram && <a href={restaurant.social_links.instagram} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">Instagram</a>}
                 {restaurant.social_links.facebook && <a href={restaurant.social_links.facebook} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">Facebook</a>}
               </div>
             </div>
           )}
        </div>
      </div>
    </BottomSheet>
  );
}
