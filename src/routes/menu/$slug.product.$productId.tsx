import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useSignedImage } from "@/lib/use-signed-image";
import { useQuery } from "@tanstack/react-query";
import { formatPrice, pickLocalized } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { ArrowLeft, Plus } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";

export const Route = createFileRoute("/menu/$slug/product/$productId")({
  loader: async ({ params }) => {
    const { data: restaurant } = await supabase.from("restaurants").select("*").eq("slug", params.slug).maybeSingle();
    if (!restaurant) throw notFound();
    const { data: product } = await supabase.from("products").select("*").eq("id", params.productId).eq("restaurant_id", restaurant.id).maybeSingle();
    if (!product) throw notFound();
    return { restaurant, product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name_en ?? "Dish"} — ${loaderData?.restaurant.name}` },
      { name: "description", content: loaderData?.product.description_en ?? "" },
    ],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="min-h-screen grid place-items-center text-muted-foreground">Not found</div>,
});

function ProductPage() {
  const { restaurant, product } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const img = useSignedImage(product.image_url);
  const cart = useCart(slug);

  const related = useQuery({
    queryKey: ["related", product.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("restaurant_id", restaurant.id)
        .eq("is_available", true).neq("id", product.id)
        .eq("category_id", product.category_id ?? "00000000-0000-0000-0000-000000000000")
        .limit(4);
      return data ?? [];
    },
  });

  const name = pickLocalized(product, "name", lang) || "—";
  const desc = pickLocalized(product, "description", lang);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative aspect-square sm:aspect-[16/9] bg-muted">
        {img && <img src={img} alt={name} className="size-full object-cover" />}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between">
          <Link to="/menu/$slug" params={{ slug }} className="size-10 bg-white/90 backdrop-blur rounded-full grid place-items-center shadow-lg">
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <LangSwitcher variant="dark" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">{name}</h1>
        <p className="text-2xl font-display text-accent mt-2">{formatPrice(product.price, restaurant.currency, lang)}</p>
        {!product.is_available && <p className="mt-2 text-sm text-destructive">{t("menu.unavailable")}</p>}
        {desc && <p className="text-muted-foreground leading-relaxed mt-6 text-pretty">{desc}</p>}

        {product.is_available && (
          <button onClick={() => cart.add({ id: product.id, name, price: Number(product.price), image: product.image_url })}
            className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <Plus className="size-4" /> {t("common.add")}
          </button>
        )}

        {(related.data?.length ?? 0) > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold mb-4">{t("menu.relatedProducts")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.data!.map((p) => <RelatedCard key={p.id} product={p} slug={slug} lang={lang} currency={restaurant.currency} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedCard({ product, slug, lang, currency }: any) {
  const img = useSignedImage(product.image_url);
  return (
    <Link to="/menu/$slug/product/$productId" params={{ slug, productId: product.id }} className="block">
      <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-2">
        {img && <img src={img} alt="" loading="lazy" className="size-full object-cover" />}
      </div>
      <p className="text-sm font-medium truncate">{pickLocalized(product, "name", lang) || "—"}</p>
      <p className="text-xs font-display font-bold text-primary">{formatPrice(product.price, currency, lang)}</p>
    </Link>
  );
}
