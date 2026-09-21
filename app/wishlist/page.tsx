"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, maxOrderable } from "@/lib/format";
import type { WishlistEntry } from "@/lib/types";
import { Button, ButtonLink } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProductImage } from "@/components/ProductImage";
import { StockBadge } from "@/components/StockBadge";
import { useStore } from "@/components/StoreProvider";
import { EmptyState, ErrorState, TextSkeleton } from "@/components/states";

function EntryCard({ entry, onRemove }: { entry: WishlistEntry; onRemove: (entry: WishlistEntry) => void }) {
  const { addToCart, quantityInCart, isPending } = useStore();
  const product = entry.product;

  if (!product) {
    return (
      <li className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-sm text-slate-500">This product is no longer available.</p>
        <Button variant="secondary" onClick={() => onRemove(entry)} disabled={isPending(`wish:${entry.productId}`)}>
          Remove from wishlist
        </Button>
      </li>
    );
  }

  const soldOut = product.stock <= 0;
  const atLimit = quantityInCart(product.productId) >= maxOrderable(product.stock);
  const href = `/products/${encodeURIComponent(product.productId)}`;

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.imageUrl} alt={product.name} className={`aspect-square w-full ${soldOut ? "opacity-60" : ""}`} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={href} className="line-clamp-2 text-sm font-medium text-slate-900 hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-900">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} />
        </div>
        <div className="mt-auto flex gap-2">
          <Button
            className="flex-1"
            disabled={soldOut || atLimit || isPending(`cart:${product.productId}`)}
            onClick={() => addToCart(product.productId, 1, product.name)}
          >
            {soldOut ? "Out of stock" : atLimit ? "In cart" : "Add to cart"}
          </Button>
          <Button variant="secondary" onClick={() => onRemove(entry)} disabled={isPending(`wish:${product.productId}`)} aria-label={`Remove ${product.name} from wishlist`}>
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function WishlistPage() {
  const { status, error, wishlist, reload, removeFromWishlist, isPending } = useStore();
  const [toRemove, setToRemove] = useState<WishlistEntry | null>(null);

  if (status === "error" && !wishlist) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your wishlist</h1>
        <div className="mt-6">
          <ErrorState message={error ?? "We couldn't load your wishlist."} action={<Button onClick={reload}>Try again</Button>} />
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div role="status" aria-label="Loading your wishlist">
        <h1 className="text-2xl font-bold text-slate-900">Your wishlist</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <TextSkeleton lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Your wishlist</h1>

      <div className="mt-6">
        {wishlist.items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it for later."
            action={<ButtonLink href="/products">Browse products</ButtonLink>}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {wishlist.items.map((entry) => (
              <EntryCard key={entry.productId} entry={entry} onRemove={setToRemove} />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title={`Remove "${toRemove?.product?.name ?? "this item"}" from your wishlist?`}
        confirmLabel="Remove"
        busy={toRemove ? isPending(`wish:${toRemove.productId}`) : false}
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          if (toRemove && (await removeFromWishlist(toRemove.productId, toRemove.product?.name))) setToRemove(null);
        }}
      />
    </div>
  );
}
