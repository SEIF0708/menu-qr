export function formatPrice(amount: number | string, currency = "TND", locale = "en") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function pickLocalized<T extends Record<string, any>>(
  obj: T | null | undefined,
  field: string,
  lang: string,
  fallbackLang = "en",
): string {
  if (!obj) return "";
  const key = `${field}_${lang}`;
  const fb = `${field}_${fallbackLang}`;
  return (obj as any)[key] || (obj as any)[fb] || (obj as any)[`${field}_en`] || (obj as any)[`${field}_fr`] || (obj as any)[`${field}_ar`] || (obj as any)[`${field}_tr`] || "";
}
