import { useTranslation } from "react-i18next";
import { LANGS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LangSwitcher({ variant = "default" }: { variant?: "default" | "subtle" | "dark" }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] || "en";

  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-md text-[11px] font-medium uppercase tracking-wider",
        variant === "default" && "bg-black/5",
        variant === "subtle" && "bg-muted",
        variant === "dark" && "bg-white/15 backdrop-blur-md border border-white/20",
      )}
    >
      {LANGS.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => i18n.changeLanguage(l.code)}
            className={cn(
              "px-2 py-1 rounded transition-colors",
              active
                ? variant === "dark"
                  ? "bg-white text-primary shadow-sm"
                  : "bg-white text-primary shadow-sm"
                : variant === "dark"
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.code === "ar" ? "ع" : l.code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
