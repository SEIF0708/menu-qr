import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
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

export function useCart(slug: string) {
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
    write(slug, cur);
  }, [slug]);

  const setQty = useCallback((id: string, qty: number) => {
    const cur = read(slug).map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    write(slug, cur);
  }, [slug]);

  const remove = useCallback((id: string) => {
    write(slug, read(slug).filter((i) => i.id !== id));
  }, [slug]);

  const clear = useCallback(() => write(slug, []), [slug]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, setQty, remove, clear, total, count };
}
