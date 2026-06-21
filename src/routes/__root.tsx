import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, Suspense } from "react";

import appCss from "../styles.css?url";
import i18n, { LANGS } from "@/lib/i18n";
import { getInitialLanguage } from "@/utils/i18n-helpers";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MenuFlow — Digital menus for modern restaurants" },
      { name: "description", content: "Create a beautiful multilingual QR-code menu in under 10 minutes." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <Suspense fallback={null}>
      <RootComponent />
    </Suspense>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  // Determine initial language and direction for both server and client
  const initLang = getInitialLanguage();
  i18n.language = initLang;
  i18n.resolvedLanguage = initLang;
  void i18n.changeLanguage(initLang);
  const cfg = LANGS.find((l) => l.code === initLang);
  const dir = cfg?.dir ?? 'ltr';
  return (
    <html
      lang={initLang}
      dir={dir}
      data-qb-installed=""
      suppressHydrationWarning={true}
    >
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    // Ensure direction matches stored language on hydrate
    import("@/lib/i18n").then(({ applyDirection }) => applyDirection(i18n.language));
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
