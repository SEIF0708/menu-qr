import { formatPrice, pickLocalized } from "./format";
import type { CartItem } from "./cart";

const dict: Record<string, any> = {
  en: { order: "New Order", total: "Total", powered: "Powered by MenuFlow", size: "Size" },
  fr: { order: "Nouvelle Commande", total: "Total", powered: "Propulsé par MenuFlow", size: "Taille" },
  ar: { order: "طلب جديد", total: "المجموع", powered: "بدعم من MenuFlow", size: "الحجم" },
  es: { order: "Nuevo Pedido", total: "Total", powered: "Desarrollado por MenuFlow", size: "Tamaño" },
  it: { order: "Nuovo Ordine", total: "Totale", powered: "Offerto da MenuFlow", size: "Dimensione" },
  de: { order: "Neue Bestellung", total: "Gesamt", powered: "Unterstützt von MenuFlow", size: "Größe" }
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
  
  const header = tableName ? `*${t.order} - ${tableName}*` : `*${t.order}*`;
  
  const itemsPart = items.map(item => {
    let line = `${item.qty}x ${item.name}`;
    const extras = [];
    
    if (item.selectedSize) {
      extras.push(`${t.size}: ${pickLocalized(item.selectedSize, "name", lang)}`);
    }
    if (item.selectedMods && item.selectedMods.length > 0) {
      const mods = item.selectedMods.map((m: any) => pickLocalized(m, "name", lang)).join(", ");
      extras.push(`+ ${mods}`);
    }
    
    if (extras.length > 0) {
      line += `\n  (${extras.join(" | ")})`;
    }
    return line;
  }).join("\n");
  
  return `${header}\n\n${itemsPart}\n\n*${t.total}: ${formatPrice(totalAmount, currency, lang)}*\n\n⚡ ${t.powered}`;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  // Ensure phone number only contains digits
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
