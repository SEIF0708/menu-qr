import { useTranslation } from "react-i18next";
import { LANGS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LangSwitcher({ variant = "default" }: { variant?: "default" | "subtle" | "dark" }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] || "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "size-10 rounded-full flex items-center justify-center transition-colors shrink-0",
            variant === "default" && "bg-black/5 hover:bg-black/10 text-foreground",
            variant === "subtle" && "bg-muted hover:bg-muted/80 text-foreground",
            variant === "dark" && "bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20 shadow-lg"
          )}
        >
          <Globe className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 rounded-xl">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={cn(
              "flex items-center justify-between font-medium cursor-pointer rounded-lg",
              current === l.code && "bg-primary/10 text-primary"
            )}
          >
            <span>{l.label}</span>
            <span className="text-xs opacity-50 uppercase">{l.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
