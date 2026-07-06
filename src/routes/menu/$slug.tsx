import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import { useActivePromotions } from "@/lib/promotions-service";
import { pickLocalized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lock, X, Utensils } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// New Components
import { RestaurantThemeProvider } from "@/components/menu/RestaurantThemeProvider";
import { RestaurantHero } from "@/components/menu/RestaurantHero";
import { PromotionCarousel } from "@/components/menu/PromotionCarousel";
import { SearchBar } from "@/components/menu/SearchBar";
import { CategoryNavigation } from "@/components/menu/CategoryNavigation";
import { FeaturedProducts } from "@/components/menu/FeaturedProducts";
import { ComboSection } from "@/components/menu/ComboSection";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductModal, BottomSheet } from "@/components/menu/ProductModal";
import { StickyCart } from "@/components/menu/StickyCart";

export const Route = createFileRoute("/menu/$slug")({
  loader: async ({ params, context }) => {
    const { data: restaurant } = await supabase.from("restaurants_public").select("*").eq("slug", params.slug).maybeSingle();
    if (!restaurant) throw notFound();

    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["public-cats", restaurant.id],
        queryFn: async () => {
          const { data } = await supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).eq("is_active", true).order("display_order");
          return data ?? [];
        }
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["public-prods", restaurant.id],
        queryFn: async () => {
          const { data } = await supabase.from("products").select("*").eq("restaurant_id", restaurant.id).order("display_order");
          return data ?? [];
        }
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["public-promotions", restaurant.id],
        queryFn: async () => {
          const { data } = await supabase.from("promotions").select("*").eq("restaurant_id", restaurant.id).eq("is_active", true);
          return data ?? [];
        }
      })
    ]);

    return { restaurant };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.restaurant.name} — Menu` },
      { name: "description", content: loaderData?.restaurant.description ?? "Digital menu" },
    ],
  }),
  component: MenuPage,
  pendingComponent: MenuLoadingScreen,
  pendingMs: 0,
  pendingMinMs: 1500,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="min-h-dvh flex items-center justify-center text-muted-foreground">Menu not found</div>,
});

function MenuPage() {
  const { restaurant } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const searchParams = Route.useSearch() as any;
  const isIframe = searchParams.iframe === "true";

  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const cart = useCart(slug, restaurant.id);

  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [activeTable, setActiveTable] = useState<{ id: string; name: string; table_number: number } | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [checkingTable, setCheckingTable] = useState(!!searchParams.table);

  useEffect(() => {
    trackEvent({ restaurant_id: restaurant.id, event_type: "menu_view" });
    if (restaurant.default_language && !localStorage.getItem("menuflow_lang")) {
      i18n.changeLanguage(restaurant.default_language);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("restaurants").select("id").eq("id", restaurant.id).maybeSingle().then(({ data }) => {
          setIsOwner(!!data);
          setCheckingOwner(false);
        });
      } else {
        setCheckingOwner(false);
      }
    });
  }, [restaurant.id, restaurant.default_language, i18n]);

  useEffect(() => {
    const tableParam = searchParams.table;
    const storageKey = `menuflow_table_${restaurant.id}`;
    
    if (tableParam) {
      supabase
        .from("restaurant_tables")
        .select("id, name, table_number, is_active")
        .eq("qr_identifier", tableParam)
        .eq("restaurant_id", restaurant.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.is_active) {
            setActiveTable(data);
            localStorage.setItem(storageKey, JSON.stringify(data));
            trackEvent({ restaurant_id: restaurant.id, table_id: data.id, event_type: "table_session_started" });
            
            const url = new URL(window.location.href);
            url.searchParams.delete("table");
            window.history.replaceState({}, "", url.toString());
          } else {
            setTableError(data ? "This QR code is currently inactive." : "Invalid QR code.");
          }
          setCheckingTable(false);
        });
    } else {
      setCheckingTable(false);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setActiveTable(JSON.parse(saved));
        } catch {}
      }
    }
  }, [searchParams.table, restaurant.id]);

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

  const promos = useActivePromotions(restaurant.id);
  
  const banners = useMemo(() => promos.data?.filter(p => p.type === 'banner') || [], [promos.data]);
  const combos = useMemo(() => promos.data?.filter(p => p.type === 'combo') || [], [promos.data]);
  const happyHour = useMemo(() => promos.data?.find(p => p.type === 'happy_hour'), [promos.data]);

  const getDiscountedPrice = (price: number) => {
    if (!happyHour || !happyHour.metadata_json?.discount_percent) return price;
    return price * (1 - happyHour.metadata_json.discount_percent / 100);
  };

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

  const displayedProducts = useMemo(() => {
    if (!activeCat && !search) {
      return filtered.slice(0, visibleCount);
    }
    return filtered;
  }, [filtered, activeCat, search, visibleCount]);

  if (restaurant.subscription_status === "unpaid") {
    if (checkingOwner) {
       return <MenuLoadingScreen />;
    }
    if (!isOwner) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-background">
           <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Lock className="size-8 text-muted-foreground" />
           </div>
           <h1 className="text-2xl font-display font-bold mb-2">Menu Unavailable</h1>
           <p className="text-muted-foreground max-w-sm">This restaurant's digital menu is currently inactive. Please check back later.</p>
        </div>
      );
    }
  }

  if (checkingTable) {
    return <MenuLoadingScreen />;
  }

  if (tableError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-background">
         <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <X className="size-8 text-muted-foreground" />
         </div>
         <h1 className="text-2xl font-display font-bold mb-2">QR Code Unavailable</h1>
         <p className="text-muted-foreground max-w-sm">{tableError}</p>
      </div>
    );
  }

  const handleAddToCart = (p: any, qty: number = 1) => {
    const finalPrice = getDiscountedPrice(Number(p.price));
    for (let i = 0; i < qty; i++) {
      cart.add({ id: p.id, name: pickLocalized(p, "name", lang) || "—", price: finalPrice, image: p.image_url });
      trackEvent({ restaurant_id: restaurant.id, event_type: 'add_to_cart', entity_type: 'product', entity_id: p.id, table_id: activeTable?.id });
    }
  };

  return (
    <RestaurantThemeProvider restaurant={restaurant}>
      <div className={cn("min-h-dvh bg-background pb-32", isIframe && "no-scrollbar")}>
        {isIframe && <style>{`::-webkit-scrollbar { display: none; } * { scrollbar-width: none; -ms-overflow-style: none; }`}</style>}
        {restaurant.subscription_status === "unpaid" && isOwner && (
          <div className="bg-orange-500 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 sticky top-0 z-[60] shadow-md flex items-center justify-center gap-2">
            <Lock className="size-4" /> PREVIEW MODE — This menu is hidden from the public until you activate your subscription.
          </div>
        )}

        <RestaurantHero 
          restaurant={restaurant} 
          activeTable={activeTable} 
          onOpenInfo={() => setInfoOpen(true)} 
          onToggleSearch={() => setIsSearchOpen(prev => {
            if (prev) setSearch(""); // clear search when closing
            return !prev;
          })}
        />

        {!search && !activeCat && (
          <PromotionCarousel 
            banners={banners} 
            happyHour={happyHour} 
            lang={lang} 
          />
        )}

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 0 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <SearchBar search={search} setSearch={setSearch} />
            </motion.div>
          )}
        </AnimatePresence>

        <CategoryNavigation 
          categories={cats.data || []} 
          activeCat={activeCat} 
          onSelectCategory={(id) => {
            setActiveCat(id);
            if (id) {
              trackEvent({ restaurant_id: restaurant.id, event_type: 'category_view', entity_type: 'category', entity_id: id, table_id: activeTable?.id });
            }
          }} 
          lang={lang} 
        />

        <div className="max-w-3xl mx-auto">
          {!search && !activeCat && (
            <FeaturedProducts 
              products={featured} 
              lang={lang} 
              currency={restaurant.currency} 
              getDiscountedPrice={getDiscountedPrice} 
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                trackEvent({ restaurant_id: restaurant.id, event_type: 'product_view', entity_type: 'product', entity_id: p.id, table_id: activeTable?.id });
              }}
              onAddToCart={(p) => handleAddToCart(p, 1)}
            />
          )}

          {!search && !activeCat && (
            <ComboSection 
              combos={combos} 
              lang={lang} 
              currency={restaurant.currency} 
              onAddToCart={(c) => {
                cart.add({
                  id: c.id,
                  name: pickLocalized(c, "title", lang) || "Combo",
                  price: Number(c.metadata_json?.price || 0),
                  image: c.metadata_json?.image_url
                });
                trackEvent({ restaurant_id: restaurant.id, event_type: 'promotion_click', entity_type: 'combo', entity_id: c.id, table_id: activeTable?.id });
              }}
            />
          )}

          <div className="py-8 flex flex-col gap-4 px-4 sm:px-6">
            {displayedProducts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                {t("menu.noProducts")}
              </p>
            )}
            
            {displayedProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                lang={lang} 
                currency={restaurant.currency} 
                getDiscountedPrice={getDiscountedPrice} 
                onClick={() => {
                  setSelectedProduct(p);
                  trackEvent({ restaurant_id: restaurant.id, event_type: 'product_view', entity_type: 'product', entity_id: p.id, table_id: activeTable?.id });
                }} 
                onAddToCart={(e) => { 
                  e.stopPropagation(); 
                  handleAddToCart(p, 1);
                }} 
              />
            ))}
            
            {!activeCat && !search && filtered.length > visibleCount && (
              <div className="flex justify-center pt-8 pb-4">
                <button 
                  onClick={() => setVisibleCount(v => v + 8)} 
                  className="px-6 py-3 bg-muted text-foreground rounded-full font-bold text-sm hover:bg-muted/80 active:scale-95 transition-all shadow-sm"
                >
                  Show more products
                </button>
              </div>
            )}
          </div>
        </div>

        <StickyCart 
          cart={cart} 
          restaurant={restaurant} 
          activeTable={activeTable} 
          lang={lang} 
          currency={restaurant.currency} 
        />

        <AnimatePresence>
          {infoOpen && <InfoDrawer restaurant={restaurant} onClose={() => setInfoOpen(false)} />}
          {selectedProduct && (
            <ProductModal 
              product={selectedProduct} 
              lang={lang} 
              currency={restaurant.currency} 
              restaurant={restaurant}
              activeTable={activeTable}
              getDiscountedPrice={getDiscountedPrice} 
              onClose={() => setSelectedProduct(null)} 
              onAddToCart={(p, qty) => {
                handleAddToCart(p, qty);
                setSelectedProduct(null);
              }}
              onTrackUpsellClick={(pId) => {
                 trackEvent({ restaurant_id: restaurant.id, event_type: 'upsell_click', entity_type: 'product', entity_id: pId, table_id: activeTable?.id });
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </RestaurantThemeProvider>
  );
}

function InfoDrawer({ restaurant, onClose }: any) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="p-6 rounded-t-[2rem]">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-display font-bold">Restaurant Info</h2>
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

function MenuLoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background pulse */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[150vw] h-[150vw] sm:w-[50vw] sm:h-[50vw] bg-primary rounded-full blur-[100px] pointer-events-none"
      />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Filling Icon Container */}
        <div className="relative size-20 sm:size-24 bg-muted/50 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden mb-8 shadow-inner border border-border/50">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: ["100%", "0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary"
          />
          <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay">
            <Utensils className="size-8 sm:size-10 text-white drop-shadow-md" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Utensils className="size-8 sm:size-10 text-background/80 drop-shadow-md" />
          </div>
        </div>
        
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">Loading Menu</h2>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Preparing something delicious...</p>
        </motion.div>
      </div>
    </div>
  );
}
