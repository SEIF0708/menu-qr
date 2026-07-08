import React, { useState } from "react";
import { Plus, Minus, Flame, Clock, X } from "lucide-react";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useSignedImage } from "@/lib/use-signed-image";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProductRecommendations } from "@/lib/promotions-service";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} 
        className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-[2rem] flex flex-col max-h-[90dvh] shadow-2xl">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full z-10" />
        <button onClick={onClose} className="absolute top-4 right-4 z-10 size-8 bg-background/50 backdrop-blur-md rounded-full grid place-items-center">
            <X className="size-4" />
        </button>
        {children}
      </motion.div>
    </>
  );
}

interface ProductModalProps {
  product: any;
  lang: string;
  currency: string;
  restaurant: any;
  activeTable: any;
  getDiscountedPrice: (price: number) => number;
  onClose: () => void;
  onAddToCart: (product: any, qty: number) => void;
  onTrackUpsellClick: (productId: string) => void;
}

export function ProductModal({
  product,
  lang,
  currency,
  restaurant,
  activeTable,
  getDiscountedPrice,
  onClose,
  onAddToCart,
  onTrackUpsellClick,
}: ProductModalProps) {
  const { t } = useTranslation();
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  const [qty, setQty] = useState(1);
  const { data: recs } = useProductRecommendations(restaurant.id, product.id);
  const { data: crossSellsData } = useQuery({
    queryKey: ["cross-sells", product.id],
    queryFn: async () => {
      const ids = product.product_cross_sells?.map((c: any) => c.cross_sell_product_id) || [];
      if (ids.length === 0) return [];
      const { data } = await supabase.from("products").select("*").in("id", ids);
      return data ?? [];
    },
    enabled: !!product.product_cross_sells?.length
  });

  const displayRecs = (crossSellsData && crossSellsData.length > 0) 
    ? crossSellsData.map(p => ({ recommended_product: p, id: p.id })) 
    : recs;

  const [selectedSize, setSelectedSize] = useState<any>(
    product.has_sizes && product.product_sizes?.length > 0 ? product.product_sizes[0] : null
  );
  
  const [selectedMods, setSelectedMods] = useState<Record<string, any>>({});

  const toggleMod = (group: any, mod: any) => {
    const isSelected = !!selectedMods[mod.id];
    const groupSelectedMods = Object.values(selectedMods).filter((m: any) => m.group_id === group.id);
    
    if (isSelected) {
      const next = { ...selectedMods };
      delete next[mod.id];
      setSelectedMods(next);
    } else {
      if (group.max_selections && groupSelectedMods.length >= group.max_selections) {
        // Can't add more
        return;
      }
      setSelectedMods({ ...selectedMods, [mod.id]: mod });
    }
  };

  const baseProductPrice = selectedSize ? Number(selectedSize.price) : Number(product.price);
  const modsPrice = Object.values(selectedMods).reduce((acc: number, mod: any) => acc + Number(mod.price || 0), 0);
  const rawPrice = baseProductPrice + modsPrice;
  const finalPrice = getDiscountedPrice(rawPrice);

  const isDiscounted = finalPrice < rawPrice;

  const handleAdd = () => {
    // Validate required groups
    if (product.has_modifiers && product.modifier_groups) {
      for (const g of product.modifier_groups) {
        const selectedForGroup = Object.values(selectedMods).filter((m: any) => m.group_id === g.id);
        if (g.is_required && selectedForGroup.length < (g.min_selections || 1)) {
          // Could show a toast here, but we will just disable the button instead
          return;
        }
      }
    }
    
    onAddToCart({
      ...product,
      cartItemId: crypto.randomUUID(),
      selectedSize,
      selectedMods: Object.values(selectedMods),
      calculatedPrice: finalPrice
    }, qty);
  };

  // Check if Add to Cart should be disabled
  let canAdd = true;
  if (product.has_modifiers && product.modifier_groups) {
    for (const g of product.modifier_groups) {
      const selectedForGroup = Object.values(selectedMods).filter((m: any) => m.group_id === g.id);
      if (g.is_required && selectedForGroup.length < (g.min_selections || 1)) canAdd = false;
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div className="overflow-y-auto pb-24 rounded-t-[2rem]">
         {img && (
           <div className="aspect-[4/3] sm:aspect-video bg-muted w-full relative">
             <img src={img} alt="" loading="lazy" className="size-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
           </div>
         )}
         
         <div className="p-6">
            <div className="flex justify-between items-start gap-4">
               <div>
                 <h2 className="text-2xl font-display font-bold">{name}</h2>
                 <div className="flex items-center gap-2 mt-2">
                   <p className="text-2xl font-display font-bold text-primary">{formatPrice(finalPrice, currency, lang)}</p>
                   {isDiscounted && <p className="text-sm text-muted-foreground line-through">{formatPrice(product.price, currency, lang)}</p>}
                 </div>
               </div>
            </div>
            
            {(product.calories || product.prep_time_minutes) && (
              <div className="flex items-center gap-6 mt-6 py-4 border-y border-border">
                {product.calories && (
                  <div className="flex flex-col border-r border-border/50 pr-4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t("menu.calories")}</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><Flame className="size-4 text-orange-500"/> {product.calories} kcal</span>
                  </div>
                )}
                {product.prep_time_minutes && (
                  <div className="flex flex-col pl-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{t("menu.prepTime")}</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><Clock className="size-4 text-blue-500"/> {product.prep_time_minutes} mins</span>
                  </div>
                )}
              </div>
            )}

            {desc && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{desc}</p>}
            
            {product.ingredients && (
              <div className="mt-6 bg-muted/50 p-4 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("menu.ingredients")}</h4>
                <p className="text-sm">{product.ingredients}</p>
              </div>
            )}
            
            {product.allergens && (
              <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-800 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1">{t("menu.allergens")}</h4>
                <p className="text-sm font-medium">{product.allergens}</p>
              </div>
            )}

            {/* Sizes */}
            {product.has_sizes && product.product_sizes?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-display font-bold text-lg mb-3">Choose Size</h3>
                <div className="space-y-2">
                  {product.product_sizes.map((s: any) => (
                    <label key={s.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedSize?.id === s.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`size-5 rounded-full border flex items-center justify-center ${selectedSize?.id === s.id ? 'border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedSize?.id === s.id && <div className="size-2.5 rounded-full bg-primary" />}
                        </div>
                        <span className="font-medium">{pickLocalized(s, "name", lang)}</span>
                      </div>
                      <span className="font-medium">{formatPrice(getDiscountedPrice(s.price), currency, lang)}</span>
                      <input type="radio" className="hidden" name="product_size" checked={selectedSize?.id === s.id} onChange={() => setSelectedSize(s)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {product.has_modifiers && product.modifier_groups?.map((g: any) => {
              const selectedCount = Object.values(selectedMods).filter((m: any) => m.group_id === g.id).length;
              const isMet = !g.is_required || selectedCount >= (g.min_selections || 1);
              
              return (
                <div key={g.id} className="mt-8">
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="font-display font-bold text-lg">{pickLocalized(g, "name", lang)}</h3>
                    {g.is_required && !isMet && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">Required</span>}
                    {g.max_selections && <span className="text-xs text-muted-foreground">Max {g.max_selections}</span>}
                  </div>
                  <div className="space-y-2">
                    {g.modifiers?.map((m: any) => {
                      const isSelected = !!selectedMods[m.id];
                      const disabled = !isSelected && g.max_selections && selectedCount >= g.max_selections;
                      
                      return (
                        <label key={m.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`size-5 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                              {isSelected && <svg viewBox="0 0 24 24" fill="none" className="size-3.5" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                            </div>
                            <span className="font-medium">{pickLocalized(m, "name", lang)}</span>
                          </div>
                          {m.price > 0 && <span className="font-medium text-muted-foreground">+{formatPrice(m.price, currency, lang)}</span>}
                          <input type="checkbox" className="hidden" checked={isSelected} disabled={disabled} onChange={() => toggleMod(g, m)} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {displayRecs && displayRecs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-display font-bold text-lg mb-4">{t("menu.frequentlyBought")}</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2 snap-x">
                  {displayRecs.map((r: any) => {
                    const p = r.recommended_product;
                    if (!p) return null;
                    const rPrice = getDiscountedPrice(Number(p.price));
                    return (
                      <div key={r.id} className="w-36 flex-shrink-0 snap-start group cursor-pointer" onClick={() => {
                        onAddToCart(p, 1);
                        onTrackUpsellClick(p.id);
                      }}>
                        <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 relative">
                           {p.image_url ? <img src={p.image_url} alt="" className="size-full object-cover group-hover:scale-105 transition-transform" /> : null}
                           <button className="absolute bottom-2 right-2 size-8 bg-background/90 backdrop-blur rounded-full grid place-items-center shadow-md border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                             <Plus className="size-4" />
                           </button>
                        </div>
                        <h4 className="font-semibold text-sm line-clamp-2">{pickLocalized(p, "name", lang)}</h4>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(rPrice, currency, lang)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
         </div>
      </div>
      
      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-background border-t border-border flex items-center gap-4">
        <div className="flex items-center justify-between gap-3 bg-muted rounded-full p-1.5 border border-border/50 min-w-[120px]">
           <button onClick={() => setQty(Math.max(1, qty-1))} className="size-10 rounded-full bg-background shadow-sm grid place-items-center active:scale-95 transition-transform"><Minus className="size-4" /></button>
           <span className="font-bold text-base">{qty}</span>
           <button onClick={() => setQty(qty+1)} className="size-10 rounded-full bg-background shadow-sm grid place-items-center active:scale-95 transition-transform"><Plus className="size-4" /></button>
        </div>
        <button 
          onClick={handleAdd} 
          disabled={!canAdd}
          className="flex-1 bg-primary text-primary-foreground rounded-full flex items-center justify-between px-6 py-3 font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
           <span>{t("menu.addToCart")}</span>
           <span className="size-1.5 rounded-full bg-primary-foreground/30" />
           <span>{formatPrice(finalPrice * qty, currency, lang)}</span>
        </button>
      </div>
    </BottomSheet>
  );
}
