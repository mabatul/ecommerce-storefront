"use client";

import Link from "next/link";
import { formatPrice, maxOrderable } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Button } from "@/components/Button";
import { ProductImage } from "@/components/ProductImage";
import { StockBadge } from "@/components/StockBadge";
import { useStore } from "@/components/StoreProvider";
import { WishlistButton } from "@/components/WishlistButton";

export function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const { addToCart, quantityInCart, isPending } = useStore();
  const soldOut = product.stock <= 0;
  const atLimit = quantityInCart(product.productId) >= maxOrderable(product.stock);
  const href = `/products/${encodeURIComponent(product.productId)}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
          <ProductImage src={product.imageUrl} alt={product.name} className={`aspect-square w-full ${soldOut ? "opacity-60" : ""}`} />
        </Link>
        <WishlistButton productId={product.productId} name={product.name} className="absolute right-2 top-2" />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-900">Featured</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {categoryName && <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{categoryName}</span>}
        <Link href={href} className="line-clamp-2 text-sm font-medium text-slate-900 hover:underline">
          {product.name}
        </Link>
        {product.description && <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-slate-900">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} />
        </div>
        <Button
          className="mt-auto w-full"
          disabled={soldOut || atLimit || isPending(`cart:${product.productId}`)}
          onClick={() => addToCart(product.productId, 1, product.name)}
        >
          {soldOut ? "Out of stock" : atLimit ? "All available in cart" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
