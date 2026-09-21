import { vi } from "vitest";

// A stand-in for what useStore() returns; tests override only what they care about.
export function makeStore(overrides: Record<string, unknown> = {}) {
  return {
    status: "ready",
    error: null,
    cart: null,
    wishlist: null,
    cartCount: 0,
    wishlistCount: 0,
    categoryName: (id: string) => ({ c1: "Gadgets" })[id],
    quantityInCart: () => 0,
    inWishlist: () => false,
    isPending: () => false,
    reload: vi.fn(),
    addToCart: vi.fn().mockResolvedValue(true),
    setQuantity: vi.fn().mockResolvedValue(true),
    removeFromCart: vi.fn().mockResolvedValue(true),
    clearCart: vi.fn().mockResolvedValue(true),
    addToWishlist: vi.fn().mockResolvedValue(true),
    removeFromWishlist: vi.fn().mockResolvedValue(true),
    toggleWishlist: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export const product = (overrides: Record<string, unknown> = {}) => ({
  productId: "p1",
  name: "Desk Lamp",
  description: "Warm light, adjustable arm",
  price: 24.5,
  categoryId: "c1",
  stock: 10,
  ...overrides,
});
