import React, { useRef, useEffect } from "react";
import { pickLocalized } from "@/lib/format";
import { useTranslation } from "react-i18next";

interface CategoryNavigationProps {
  categories: any[];
  activeCat: string | null;
  onSelectCategory: (id: string | null) => void;
  lang: string;
}

export function CategoryNavigation({
  categories,
  activeCat,
  onSelectCategory,
  lang,
}: CategoryNavigationProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active category when it changes
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const item = activeItemRef.current;
      
      const containerWidth = container.clientWidth;
      const itemLeft = item.offsetLeft;
      const itemWidth = item.clientWidth;
      
      // Center the active item
      container.scrollTo({
        left: itemLeft - containerWidth / 2 + itemWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeCat]);

  return (
    <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-md py-3 border-b border-border shadow-sm">
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 snap-x"
      >
        <button
          ref={activeCat === null ? activeItemRef : null}
          onClick={() => onSelectCategory(null)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 snap-start ${
            activeCat === null
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("common.all") || "All"}
        </button>
        {categories?.map((c) => {
          const isActive = activeCat === c.id;
          return (
            <button
              key={c.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectCategory(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 snap-start ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {pickLocalized(c, "name", lang) || "—"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
