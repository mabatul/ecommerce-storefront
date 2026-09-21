"use client";

import { HeartIcon } from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";

interface WishlistButtonProps {
  productId: string;
  name: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WishlistButton({ productId, name, variant = "icon", className = "" }: WishlistButtonProps) {
  const { inWishlist, toggleWishlist, isPending } = useStore();
  const saved = inWishlist(productId);
  const busy = isPending(`wish:${productId}`);
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggleWishlist(productId, name)}
        disabled={busy}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          saved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        } ${className}`}
      >
        <HeartIcon filled={saved} className="h-4 w-4" />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId, name)}
      disabled={busy}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors disabled:opacity-50 ${
        saved ? "text-rose-600" : "text-slate-500 hover:text-rose-600"
      } ${className}`}
    >
      <HeartIcon filled={saved} className="h-5 w-5" />
    </button>
  );
}
