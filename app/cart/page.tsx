"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, maxOrderable } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import { Button, ButtonLink } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProductImage } from "@/components/ProductImage";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useStore } from "@/components/StoreProvider";
import { EmptyState, ErrorState, TextSkeleton } from "@/components/states";

function LineRow({ line, onRemove }: { line: CartLine; onRemove: (line: CartLine) => void }) {
  const { setQuantity, isPending } = useStore();
  const busy = isPending(`cart:${line.productId}`);
  const unavailable = line.status === "unavailable";
  const short = line.status === "insufficient_stock";
  const name = line.name ?? "Unavailable product";
  const href = `/products/${encodeURIComponent(line.productId)}`;

  return (
    <li className="flex gap-4 py-4">
      <ProductImage src={line.imageUrl} alt={name} className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 sm:h-24 sm:w-24" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.name ? (
              <Link href={href} className="line-clamp-2 font-medium text-slate-900 hover:underline">
                {name}
              </Link>
            ) : (
              <span className="font-medium text-slate-500">{name}</span>
            )}
            {line.unitPrice !== null && <div className="text-sm text-slate-500">{formatPrice(line.unitPrice)} each</div>}
          </div>
          <div className="shrink-0 text-right font-semibold text-slate-900">{unavailable || short ? "—" : formatPrice(line.lineTotal)}</div>
        </div>

        {unavailable && (
          <p role="alert" className="text-sm text-red-600">
            {line.name ? "This product is out of stock." : "This product is no longer available."} It isn&apos;t included in your total.
          </p>
        )}
        {short && (
          <p role="alert" className="text-sm text-amber-700">
            Only {line.availableStock} left, but you have {line.quantity} in your cart.{" "}
            <button
              type="button"
              className="font-medium underline disabled:opacity-50"
              disabled={busy}
              onClick={() => setQuantity(line.productId, line.availableStock)}
            >
              Change to {line.availableStock}
            </button>
          </p>
        )}

        <div className="flex items-center justify-between">
          {!unavailable ? (
            <QuantityStepper
              value={line.quantity}
              max={maxOrderable(line.availableStock)}
              disabled={busy}
              label={`Quantity of ${name}`}
              onChange={(q) => setQuantity(line.productId, q)}
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onRemove(line)}
            disabled={busy}
            className="text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
            aria-label={`Remove ${name} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CartPage() {
  const { status, error, cart, reload, removeFromCart, clearCart, isPending } = useStore();
  const [toRemove, setToRemove] = useState<CartLine | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (status === "error" && !cart) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
        <div className="mt-6">
          <ErrorState message={error ?? "We couldn't load your cart."} action={<Button onClick={reload}>Try again</Button>} />
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div role="status" aria-label="Loading your cart">
        <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <TextSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
        <div className="mt-6">
          <EmptyState
            title="Your cart is empty"
            message="Find something you like and add it here."
            action={<ButtonLink href="/products">Start shopping</ButtonLink>}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
        <button type="button" onClick={() => setConfirmClear(true)} className="text-sm font-medium text-slate-500 hover:text-red-600">
          Empty cart
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4 sm:px-6">
          {cart.lines.map((line) => (
            <LineRow key={line.productId} line={line} onRemove={setToRemove} />
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5" aria-label="Order summary">
          <h2 className="text-base font-semibold text-slate-900">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Items</dt>
              <dd className="font-medium text-slate-900">{cart.totalQuantity}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
              <dt className="font-semibold text-slate-900">Subtotal</dt>
              <dd className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</dd>
            </div>
          </dl>
          {cart.hasIssues && (
            <p className="mt-3 text-xs text-amber-700">Some items need attention and aren&apos;t counted in the subtotal.</p>
          )}
          <p className="mt-4 text-xs text-slate-500">This is a demo store: there is no checkout or payment step.</p>
          <ButtonLink href="/products" variant="secondary" className="mt-4 w-full">
            Continue shopping
          </ButtonLink>
        </aside>
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title={`Remove "${toRemove?.name ?? "this item"}" from your cart?`}
        confirmLabel="Remove"
        busy={toRemove ? isPending(`cart:${toRemove.productId}`) : false}
        onCancel={() => setToRemove(null)}
        onConfirm={async () => {
          if (toRemove && (await removeFromCart(toRemove.productId, toRemove.name ?? undefined))) setToRemove(null);
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Empty your cart?"
        description="Every item will be removed."
        confirmLabel="Empty cart"
        busy={isPending("cart:*")}
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          if (await clearCart()) setConfirmClear(false);
        }}
      />
    </div>
  );
}
