"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, shop } from "@/lib/api";
import { getCustomerId } from "@/lib/customer";
import type { CartView, WishlistView } from "@/lib/types";
import { useToast } from "@/components/Toast";

type Status = "loading" | "ready" | "error";

interface StoreValue {
  status: Status;
  error: string | null;
  cart: CartView | null;
  wishlist: WishlistView | null;
  cartCount: number;
  wishlistCount: number;
  quantityInCart: (productId: string) => number;
  inWishlist: (productId: string) => boolean;
  isPending: (key: string) => boolean;
  reload: () => Promise<void>;
  addToCart: (productId: string, quantity: number, name?: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string, name?: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  addToWishlist: (productId: string, name?: string) => Promise<boolean>;
  removeFromWishlist: (productId: string, name?: string) => Promise<boolean>;
  toggleWishlist: (productId: string, name?: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreValue | null>(null);

// Holds the anonymous customer's cart and wishlist. Every change goes to the API, which
// answers with the full updated view, so what's shown is always what the server has.
export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const customerId = useRef<string | null>(null);
  const [cart, setCart] = useState<CartView | null>(null);
  const [wishlist, setWishlist] = useState<WishlistView | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const reload = useCallback(async () => {
    const id = (customerId.current ??= getCustomerId());
    setStatus("loading");
    try {
      const [nextCart, nextWishlist] = await Promise.all([shop.cart(id), shop.wishlist(id)]);
      setCart(nextCart);
      setWishlist(nextWishlist);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your cart.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Runs one mutation: marks it pending, applies the returned view, toasts the outcome.
  const mutate = useCallback(
    async (key: string, run: (id: string) => Promise<void>, success?: string): Promise<boolean> => {
      const id = (customerId.current ??= getCustomerId());
      setPending((prev) => new Set(prev).add(key));
      try {
        await run(id);
        if (success) toast.success(success);
        return true;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        return false;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [toast]
  );

  const value = useMemo<StoreValue>(() => {
    const inWishlist = (productId: string) => wishlist?.items.some((i) => i.productId === productId) ?? false;

    const addToWishlist = (productId: string, name?: string) =>
      mutate(`wish:${productId}`, async (id) => setWishlist(await shop.addToWishlist(id, productId)), name ? `Saved “${name}” to your wishlist.` : "Saved to your wishlist.");

    const removeFromWishlist = (productId: string, name?: string) =>
      mutate(`wish:${productId}`, async (id) => setWishlist(await shop.removeFromWishlist(id, productId)), name ? `Removed “${name}” from your wishlist.` : "Removed from your wishlist.");

    return {
      status,
      error,
      cart,
      wishlist,
      cartCount: cart?.totalQuantity ?? 0,
      wishlistCount: wishlist?.items.length ?? 0,
      quantityInCart: (productId) => cart?.lines.find((l) => l.productId === productId)?.quantity ?? 0,
      inWishlist,
      isPending: (key) => pending.has(key),
      reload,
      addToCart: (productId, quantity, name) =>
        mutate(`cart:${productId}`, async (id) => setCart(await shop.addToCart(id, productId, quantity)), name ? `Added “${name}” to your cart.` : "Added to your cart."),
      setQuantity: (productId, quantity) =>
        mutate(`cart:${productId}`, async (id) => setCart(await shop.setQuantity(id, productId, quantity))),
      removeFromCart: (productId, name) =>
        mutate(`cart:${productId}`, async (id) => setCart(await shop.removeFromCart(id, productId)), name ? `Removed “${name}” from your cart.` : "Removed from your cart."),
      clearCart: () => mutate("cart:*", async (id) => setCart(await shop.clearCart(id)), "Your cart is now empty."),
      addToWishlist,
      removeFromWishlist,
      toggleWishlist: (productId, name) => (inWishlist(productId) ? removeFromWishlist(productId, name) : addToWishlist(productId, name)),
    };
  }, [status, error, cart, wishlist, pending, mutate, reload]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
