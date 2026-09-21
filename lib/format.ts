const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatPrice = (value: number) => usd.format(value);

export const LOW_STOCK_THRESHOLD = 5;
export const MAX_PER_PRODUCT = 99;

export type StockTone = "ok" | "low" | "out";

export function stockInfo(stock: number): { label: string; tone: StockTone } {
  if (stock <= 0) return { label: "Out of stock", tone: "out" };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: `Only ${stock} left`, tone: "low" };
  return { label: "In stock", tone: "ok" };
}

// Most units of a product that can be ordered in one go.
export const maxOrderable = (stock: number) => Math.max(0, Math.min(stock, MAX_PER_PRODUCT));
