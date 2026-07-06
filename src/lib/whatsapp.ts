import { formatPrice } from "./format";
import type { CartItem } from "./cart";

const dict: Record<string, any> = {
  en: { greeting: "Hello, new order", items: "Items:", total: "Total:" },
  fr: { greeting: "Bonjour, nouvelle commande", items: "Articles :", total: "Total :" },
  ar: { greeting: "مرحباً، طلب جديد", items: "الطلب:", total: "المجموع:" },
  es: { greeting: "Hola, nuevo pedido", items: "Artículos:", total: "Total:" },
  it: { greeting: "Ciao, nuovo ordine", items: "Articoli:", total: "Totale:" },
  de: { greeting: "Hallo, neue Bestellung", items: "Artikel:", total: "Gesamt:" }
};

export function buildOrderMessage(
  restaurantName: string,
  tableName: string | null,
  items: CartItem[],
  totalAmount: number,
  currency: string,
  lang: string
): string {
  const t = dict[lang] || dict.en;
  
  const header = tableName ? `${t.greeting} - ${tableName}` : t.greeting;
  const itemsPart = items.map(item => `- ${item.qty}x ${item.name}`).join("\n");
  
  return `${header}\n\n${t.items}\n${itemsPart}\n\n${t.total} ${formatPrice(totalAmount, currency, lang)}`;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  // Ensure phone number only contains digits
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
