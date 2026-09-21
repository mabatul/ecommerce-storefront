import { stockInfo, type StockTone } from "@/lib/format";

const tones: Record<StockTone, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  low: "bg-amber-50 text-amber-700",
  out: "bg-red-50 text-red-700",
};

export function StockBadge({ stock }: { stock: number }) {
  const { label, tone } = stockInfo(stock);
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}
