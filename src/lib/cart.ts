import { useEffect, useState, useCallback } from "react";
import { trackEvent } from "./analytics";

export type CartItem = {
  id: string; // Line item ID (hash of options, or product id)
  productId: string; // Original product ID
  name: string;
  price: number;
  image?: string | null;
  qty: number;
  selectedSize?: any;
  selectedMods?: any[];
};

const KEY = (slug: string) => `menuflow_cart_${slug}`;

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY(slug)) || "[]"); } catch { return []; }
}
function write(slug: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(slug), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(`cart:${slug}`));
}

export function useCart(slug: string, restaurantId?: string) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read(slug));
    const handler = () => setItems(read(slug));
    window.addEventListener(`cart:${slug}`, handler);
    return () => window.removeEventListener(`cart:${slug}`, handler);
  }, [slug]);

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    const cur = read(slug);
    const existing = cur.find((i) => i.id === item.id);
    if (existing) existing.qty += 1;
    else cur.push({ ...item, qty: 1 });
    if (restaurantId) trackEvent(restaurantId, "cart_add");
    write(slug, cur);
  }, [slug, restaurantId]);

  const setQty = useCallback((id: string, qty: number) => {
    const cur = read(slug);
    const existing = cur.find((i) => i.id === id);
    if (existing) {
      if (qty > existing.qty && restaurantId) trackEvent(restaurantId, "cart_add");
      if (qty < existing.qty && restaurantId) trackEvent(restaurantId, "cart_remove");
    }
    const filtered = cur.map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    write(slug, filtered);
  }, [slug, restaurantId]);

  const remove = useCallback((id: string) => {
    if (restaurantId) trackEvent(restaurantId, "cart_remove");
    write(slug, read(slug).filter((i) => i.id !== id));
  }, [slug, restaurantId]);

  const clear = useCallback(() => write(slug, []), [slug]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, setQty, remove, clear, total, count };
}
