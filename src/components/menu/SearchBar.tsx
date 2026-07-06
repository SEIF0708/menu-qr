import React from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
}

export function SearchBar({ search, setSearch }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-background pt-4 pb-2 px-4 sm:px-6 transition-all">
      <div className="relative max-w-3xl mx-auto">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("menu.searchPlaceholder") || "Search for dishes, cuisines..."}
          className="w-full ps-12 pe-4 py-3 rounded-2xl bg-muted border-none shadow-inner text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
