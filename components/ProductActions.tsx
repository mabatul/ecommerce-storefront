"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { maxOrderable } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Button } from "@/components/Button";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useStore } from "@/components/StoreProvider";
import { WishlistButton } from "@/components/WishlistButton";

// Quantity picker + add to cart + wishlist for the product page. What can still be added is
// stock minus what's already in the cart; the server enforces the same rule.
export function ProductActions({ product }: { product: Product }) {
  const { addToCart, quantityInCart, isPending, status } = useStore();
  const inCart = quantityInCart(product.productId);
  const remaining = Math.max(0, maxOrderable(product.stock) - inCart);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, remaining)));
  }, [remaining]);

  const soldOut = product.stock <= 0;
  const busy = isPending(`cart:${product.productId}`);

  async function add() {
    if (await addToCart(product.productId, quantity, product.name)) setQuantity(1);
  }

  return (
    <div className="space-y-4">
      {!soldOut && remaining > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Quantity</span>
          <QuantityStepper value={quantity} max={remaining} onChange={setQuantity} disabled={busy} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button className="min-w-40 flex-1 sm:flex-none" onClick={add} disabled={soldOut || remaining === 0 || busy || status === "error"}>
          {soldOut ? "Out of stock" : remaining === 0 ? "All available in cart" : busy ? "Adding..." : "Add to cart"}
        </Button>
        <WishlistButton productId={product.productId} name={product.name} variant="full" />
      </div>

      {inCart > 0 && (
        <p className="text-sm text-slate-600">
          {inCart} in your cart ·{" "}
          <Link href="/cart" className="font-medium text-slate-900 underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
