import React, { useState } from "react";
import { Plus, Minus, Flame, Clock, X } from "lucide-react";
import { pickLocalized, formatPrice } from "@/lib/format";
import { useSignedImage } from "@/lib/use-signed-image";
import { useProductRecommendations } from "@/lib/promotions-service";
import { motion } from "framer-motion";

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
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  const [qty, setQty] = useState(1);
  const { data: recs } = useProductRecommendations(restaurant.id, product.id);

  const finalPrice = getDiscountedPrice(Number(product.price));
  const isDiscounted = finalPrice < Number(product.price);

  const handleAdd = () => {
    onAddToCart(product, qty);
  };

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
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Calories</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><Flame className="size-4 text-orange-500"/> {product.calories} kcal</span>
                  </div>
                )}
                {product.prep_time_minutes && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Prep Time</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><Clock className="size-4 text-blue-500"/> {product.prep_time_minutes} mins</span>
                  </div>
                )}
              </div>
            )}

            {desc && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{desc}</p>}
            
            {product.ingredients && (
              <div className="mt-6 bg-muted/50 p-4 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ingredients</h4>
                <p className="text-sm">{product.ingredients}</p>
              </div>
            )}
            
            {product.allergens && (
              <div className="mt-4 p-4 bg-red-50 text-red-900 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Allergens</h4>
                <p className="text-sm font-medium">{product.allergens}</p>
              </div>
            )}

            {recs && recs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-display font-bold text-lg mb-4">Frequently Bought Together</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2 snap-x">
                  {recs.map((r: any) => {
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
        <button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground h-14 rounded-full font-bold text-base shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
           <span>Add to order</span>
           <span className="font-normal opacity-80">•</span>
           <span>{formatPrice(finalPrice * qty, currency, lang)}</span>
        </button>
      </div>
    </BottomSheet>
  );
}
