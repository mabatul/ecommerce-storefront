import { API_URL } from "./config";
import type { CartView, Category, Page, Product, ProductDetail, WishlistView } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = the backend could not be reached
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  customerId?: string;
}

async function request<T>(path: string, { customerId, ...init }: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (customerId) headers.set("X-Customer-Id", customerId);
  if (init.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, headers });
  } catch (error) {
    // Only real network failures (fetch throws a TypeError). Anything else, such as Next's own
    // "this render is dynamic" signal, must propagate untouched.
    if (error instanceof TypeError) {
      throw new ApiError(0, "We can't reach the store right now. Please try again in a moment.");
    }
    throw error;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error ?? `Something went wrong (${response.status}).`, body?.details);
  }
  return response.json();
}

const enc = encodeURIComponent;
const json = (body: unknown) => JSON.stringify(body);

// Public catalog — safe to call from server components.
export const catalog = {
  products: (query: URLSearchParams | string) => request<Page<Product>>(`/api/store/products?${query.toString()}`),
  product: (productId: string) => request<ProductDetail>(`/api/store/products/${enc(productId)}`),
  categories: () => request<Category[]>("/api/store/categories"),
};

// Cart and wishlist belong to an anonymous customer id (see lib/customer.ts).
export const shop = {
  cart: (customerId: string) => request<CartView>("/api/store/cart", { customerId }),
  addToCart: (customerId: string, productId: string, quantity: number) =>
    request<CartView>("/api/store/cart/items", { method: "POST", customerId, body: json({ productId, quantity }) }),
  setQuantity: (customerId: string, productId: string, quantity: number) =>
    request<CartView>(`/api/store/cart/items/${enc(productId)}`, { method: "PATCH", customerId, body: json({ quantity }) }),
  removeFromCart: (customerId: string, productId: string) =>
    request<CartView>(`/api/store/cart/items/${enc(productId)}`, { method: "DELETE", customerId }),
  clearCart: (customerId: string) => request<CartView>("/api/store/cart", { method: "DELETE", customerId }),

  wishlist: (customerId: string) => request<WishlistView>("/api/store/wishlist", { customerId }),
  addToWishlist: (customerId: string, productId: string) =>
    request<WishlistView>("/api/store/wishlist/items", { method: "POST", customerId, body: json({ productId }) }),
  removeFromWishlist: (customerId: string, productId: string) =>
    request<WishlistView>(`/api/store/wishlist/items/${enc(productId)}`, { method: "DELETE", customerId }),
};
