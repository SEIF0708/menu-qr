import React from "react";
import { Flame, Star, Plus } from "lucide-react";
import { pickLocalized, formatPrice } from "@/lib/format";
import { useSignedImage } from "@/lib/use-signed-image";

interface FeaturedProductsProps {
  products: any[];
  lang: string;
  currency: string;
  getDiscountedPrice: (price: number) => number;
  onSelectProduct: (p: any) => void;
  onAddToCart: (p: any) => void;
}

export function FeaturedProducts({
  products,
  lang,
  currency,
  getDiscountedPrice,
  onSelectProduct,
  onAddToCart,
}: FeaturedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4 px-4 sm:px-6">
        <Flame className="size-5 text-orange-500" />
        <h2 className="text-xl font-display font-bold">Featured & Popular</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-4 sm:px-6 snap-x">
        {products.map((p) => {
          const finalPrice = getDiscountedPrice(Number(p.price));
          return (
            <FeaturedCard
              key={p.id}
              product={p}
              lang={lang}
              currency={currency}
              finalPrice={finalPrice}
              onClick={() => onSelectProduct(p)}
              onAdd={(e) => {
                e.stopPropagation();
                onAddToCart(p);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FeaturedCard({
  product,
  lang,
  currency,
  finalPrice,
  onClick,
  onAdd,
}: any) {
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);
  const isDiscounted = finalPrice < Number(product.price);

  return (
    <div
      onClick={onClick}
      className="w-48 sm:w-56 flex-shrink-0 snap-start cursor-pointer group bg-card border border-border rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3 relative">
        {img ? (
          <img
            src={img}
            alt=""
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : null}
        {product.chef_recommendation && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Star className="size-3 fill-current" /> Chef's Choice
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm line-clamp-1">{name}</h3>
      {desc && (
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {desc}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-display font-bold text-primary">
            {formatPrice(finalPrice, currency, lang)}
          </span>
          {isDiscounted && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatPrice(product.price, currency, lang)}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="bg-primary/10 text-primary hover:bg-primary/20 size-8 rounded-full grid place-items-center transition-colors"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
