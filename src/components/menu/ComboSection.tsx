import React from "react";
import { Tag as TagIcon, Plus } from "lucide-react";
import { pickLocalized, formatPrice } from "@/lib/format";
import { useTranslation } from "react-i18next";

interface ComboSectionProps {
  combos: any[];
  lang: string;
  currency: string;
  onAddToCart: (combo: any) => void;
}

export function ComboSection({
  combos,
  lang,
  currency,
  onAddToCart,
}: ComboSectionProps) {
  const { t } = useTranslation();
  if (!combos || combos.length === 0) return null;

  return (
    <div className="pt-8">
      <div className="flex items-center gap-2 mb-4 px-4 sm:px-6">
        <TagIcon className="size-5 text-indigo-500" />
        <h2 className="text-xl font-display font-bold">{t("menu.combos")}</h2>
      </div>
      <div className="flex flex-col gap-4 px-4 sm:px-6">
        {combos.map((c) => {
          const price = Number(c.metadata_json?.price || 0);
          const imageUrl = c.metadata_json?.image_url;
          return (
            <div
              key={c.id}
              className="group bg-card border border-border rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onAddToCart(c)}
            >
              {imageUrl ? (
                <div className="size-24 sm:size-32 bg-muted rounded-xl overflow-hidden shrink-0">
                  <img
                    src={imageUrl}
                    alt=""
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : null}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                <div>
                  <h3 className="font-semibold text-base line-clamp-1">
                    {pickLocalized(c, "title", lang)}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {pickLocalized(c, "description", lang)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-primary">
                    {formatPrice(price, currency, lang)}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddToCart(c); }}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                  >
                    <Plus className="size-3" />
                    <span>{t("menu.addToCart")}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
