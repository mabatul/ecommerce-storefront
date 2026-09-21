// Mirrors the backend's storefront API (ecommerce-admin-backend, /api/store/*).

export interface Product {
  productId: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  imageUrl?: string;
  featured?: boolean;
}

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProductDetail {
  product: Product;
  category: Category | null;
  related: Product[];
}

export type LineStatus = "ok" | "insufficient_stock" | "unavailable";

export interface CartLine {
  productId: string;
  quantity: number;
  name: string | null;
  imageUrl?: string;
  unitPrice: number | null;
  lineTotal: number;
  availableStock: number;
  status: LineStatus;
}

export interface CartView {
  userId: string;
  lines: CartLine[];
  subtotal: number;
  totalQuantity: number;
  hasIssues: boolean;
  updatedAt: string | null;
}

export type WishlistStatus = "available" | "out_of_stock" | "unavailable";

export interface WishlistEntry {
  productId: string;
  product: Product | null;
  status: WishlistStatus;
}

export interface WishlistView {
  userId: string;
  items: WishlistEntry[];
  updatedAt: string | null;
}
