import React, { useState, useEffect } from "react";
import { Megaphone, Clock } from "lucide-react";
import { pickLocalized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PromotionCarouselProps {
  banners: any[];
  happyHour?: any;
  lang: string;
}

export function PromotionCarousel({
  banners,
  happyHour,
  lang,
}: PromotionCarouselProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!happyHour?.end_date) return;
    const end = new Date(happyHour.end_date).getTime();

    const calc = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    };

    calc();
    const int = setInterval(calc, 1000);
    return () => clearInterval(int);
  }, [happyHour]);

  const hasPromotions = banners.length > 0 || happyHour;

  if (!hasPromotions) return null;

  const displayTime = timeLeft ?? 0;
  const hours = Math.floor(displayTime / 3600);
  const minutes = Math.floor((displayTime % 3600) / 60);
  const seconds = displayTime % 60;
  const showHappyHour = happyHour && (timeLeft === null || timeLeft > 0);
  const totalPromos = (showHappyHour ? 1 : 0) + banners.length;

  return (
    <div className="relative z-20 -mt-6 sm:-mt-8 mb-4 max-w-3xl mx-auto w-full overflow-hidden">
      <div className={cn(
        "flex gap-3 px-4 sm:px-6 w-full after:content-[''] after:w-1 after:flex-shrink-0 sm:after:hidden",
        totalPromos === 1 ? "justify-center" : "overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 sm:scroll-px-6"
      )}>
        
        {/* Happy Hour Card */}
        {showHappyHour && (
          <div className={cn(
            "bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-3 flex flex-nowrap items-center justify-between relative overflow-hidden shadow-lg gap-2 border border-white/10",
            totalPromos === 1 ? "w-full max-w-[400px]" : "snap-start flex-shrink-0 w-[85%] max-w-[320px]"
          )}>
            <div className="absolute -right-4 -top-4 size-24 bg-white/20 blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div className="size-8 sm:size-9 bg-white/20 rounded-full flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                <Clock className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                  {pickLocalized(happyHour, "title", lang) || t("menu.happyHour")}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/90 font-medium mt-0.5 truncate">
                  {happyHour.metadata_json?.discount_percent}% OFF
                </p>
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col items-end shrink-0 ml-auto pl-2">
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-white/90 mb-1">
                {t("menu.endsIn")}
              </span>
              <div className="flex items-center gap-0.5 font-display font-bold text-white text-xs sm:text-sm bg-black/20 rounded-lg px-2 py-1 backdrop-blur-sm">
                {(hours > 0 || timeLeft === null) && (
                  <>
                    <span>
                      {timeLeft === null
                        ? "--"
                        : hours.toString().padStart(2, "0")}
                    </span>
                    <span className="text-white/50 text-[10px] mx-0.5">:</span>
                  </>
                )}
                <span>
                  {timeLeft === null
                    ? "--"
                    : minutes.toString().padStart(2, "0")}
                </span>
                <span className="text-white/50 text-[10px] mx-0.5">:</span>
                <span>
                  {timeLeft === null
                    ? "--"
                    : seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Banners */}
        {banners.map((b) => (
          <div
            key={b.id}
            className={cn(
              "bg-card border border-border/50 rounded-2xl p-3 flex flex-nowrap items-center gap-3 shadow-lg",
              totalPromos === 1 ? "w-full max-w-[400px]" : "snap-start flex-shrink-0 w-[85%] max-w-[320px]"
            )}
          >
            <div className="size-8 sm:size-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Megaphone className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base truncate">
                {pickLocalized(b, "title", lang)}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                {pickLocalized(b, "description", lang)}
              </p>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}
