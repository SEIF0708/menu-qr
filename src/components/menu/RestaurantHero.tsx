import React from "react";
import { Info, Table as TableIcon, Search } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useSignedImage } from "@/lib/use-signed-image";
import { useTranslation } from "react-i18next";

interface RestaurantHeroProps {
  restaurant: any;
  activeTable?: any;
  onOpenInfo: () => void;
  onToggleSearch?: () => void;
}

export function RestaurantHero({
  restaurant,
  activeTable,
  onOpenInfo,
  onToggleSearch,
}: RestaurantHeroProps) {
  const { t } = useTranslation();
  const cover = useSignedImage(restaurant.cover_image_url);
  const logo = useSignedImage(restaurant.logo_url);

  const rating = restaurant.rating || "4.8";
  const reviewsCount = restaurant.reviews_count || "230+";

  return (
    <div className="relative min-h-[16rem] sm:min-h-[20rem] flex flex-col justify-end bg-muted pt-24 pb-12 sm:pb-16 overflow-hidden">
      {/* Cover Image Background */}
      <div className="absolute inset-0">
        {cover && (
          <img
            src={cover}
            alt=""
            fetchpriority="high"
            className="size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
      </div>

      {/* Top actions */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between z-20">
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="size-12 sm:size-16 rounded-xl bg-white shadow-xl object-cover border-2 border-white/20"
            />
          ) : (
            <div className="size-12 sm:size-16 bg-white rounded-xl grid place-items-center shadow-xl border-2 border-white/20">
              <span className="text-primary font-display font-bold text-lg sm:text-xl">
                {restaurant.name?.[0] ?? "M"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              className="size-9 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full grid place-items-center text-white transition-colors shadow-lg"
            >
              <Search className="size-4" />
            </button>
          )}
          <LangSwitcher variant="dark" />
        </div>
      </div>

      {/* Info Card / Bottom Content */}
      <div className="relative z-10 px-4 sm:px-6 w-full max-w-3xl mx-auto flex items-end justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {restaurant.is_open ? (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-md">
                <span className="size-1.5 sm:size-2 rounded-full bg-green-400 animate-pulse" />{" "}
                {t("menu.open")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-2 py-1 rounded-full backdrop-blur-md">
                <span className="size-1.5 sm:size-2 rounded-full bg-red-400" /> {t("menu.closed")}
              </span>
            )}
            {restaurant.cuisine_type && (
              <span className="text-[10px] sm:text-xs font-medium text-white/90 bg-white/20 px-2 py-1 rounded-full backdrop-blur-md">
                {restaurant.cuisine_type}
              </span>
            )}
            {activeTable && (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-primary-foreground bg-primary px-2 py-1 rounded-full shadow-lg">
                <TableIcon className="size-3" /> {activeTable.name}
              </span>
            )}
          </div>
          
          <h1 className="text-white font-display text-2xl sm:text-4xl font-bold leading-tight truncate">
            {restaurant.name}
          </h1>
          
          {restaurant.description && (
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl line-clamp-2">
              {restaurant.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3 text-white/90 text-[11px] sm:text-sm font-medium">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-yellow-400">★</span> {rating} ({reviewsCount})
            </span>
            {restaurant.opening_hours && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">{restaurant.opening_hours}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onOpenInfo}
          className="pointer-events-auto size-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full grid place-items-center text-white transition-colors flex-shrink-0 shadow-lg"
        >
          <Info className="size-5" />
        </button>
      </div>
    </div>
  );
}
