import React from "react";
import { Plus, Flame, Clock } from "lucide-react";
import { pickLocalized, formatPrice } from "@/lib/format";
import { useSignedImage } from "@/lib/use-signed-image";

interface ProductCardProps {
  product: any;
  lang: string;
  currency: string;
  getDiscountedPrice: (price: number) => number;
  onClick: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
}

export function ProductCard({
  product,
  lang,
  currency,
  getDiscountedPrice,
  onClick,
  onAddToCart,
}: ProductCardProps) {
  const img = useSignedImage(product.image_url);
  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);

  const finalPrice = getDiscountedPrice(Number(product.price));
  const isDiscounted = finalPrice < Number(product.price);

  return (
    <div
      onClick={onClick}
      className="group bg-card border-b border-border/50 sm:border sm:rounded-2xl sm:shadow-sm p-4 -mx-4 sm:mx-0 flex gap-4 items-start hover:bg-muted/30 transition-colors cursor-pointer active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-base sm:text-lg">{name}</h3>
          {desc && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {desc}
            </p>
          )}

          {/* Badges */}
          {(product.popular || (product.badges && product.badges.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.popular && (
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {t("menu.popular")}
                </span>
              )}
              {product.badges?.map((b: string) => (
                <span
                  key={b}
                  className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-display font-bold text-primary">
              {formatPrice(finalPrice, currency, lang)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price, currency, lang)}
              </span>
            )}
          </div>
          {(product.calories || product.prep_time_minutes) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground border-l border-border pl-4">
              {product.calories && (
                <span className="flex items-center gap-1">
                  <Flame className="size-3 text-orange-400" />{" "}
                  {product.calories}
                </span>
              )}
              {product.prep_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-blue-400" />{" "}
                  {product.prep_time_minutes}m
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative shrink-0">
        <div className="size-28 sm:size-32 rounded-2xl bg-muted overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
          {img && (
            <img
              src={img}
              alt=""
              loading="lazy"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>
        {product.is_available && (
          <button
            onClick={onAddToCart}
            className="absolute -bottom-2 -right-2 size-10 bg-background rounded-full grid place-items-center shadow-lg border border-border/50"
          >
            <div className="size-8 bg-primary text-primary-foreground rounded-full grid place-items-center active:scale-90 transition-transform shadow-inner shadow-white/20">
              <Plus className="size-4" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
