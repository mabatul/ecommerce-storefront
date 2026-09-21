// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStore, product } from "../../components/__tests__/store-mock";

let store = makeStore();
const productsMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }));
vi.mock("@/components/StoreProvider", () => ({ useStore: () => store }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, catalog: { ...actual.catalog, products: (...args: unknown[]) => productsMock(...args) } };
});

import { ApiError } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";
import CartPage from "../cart/page";
import WishlistPage from "../wishlist/page";

const line = (overrides: Record<string, unknown> = {}) => ({
  productId: "p1",
  quantity: 2,
  name: "Desk Lamp",
  unitPrice: 24.5,
  lineTotal: 49,
  availableStock: 10,
  status: "ok",
  ...overrides,
});
const cart = (lines: unknown[], extra: Record<string, unknown> = {}) => ({
  userId: "guest-x",
  lines,
  subtotal: 49,
  totalQuantity: 2,
  hasIssues: false,
  updatedAt: null,
  ...extra,
});

beforeEach(() => {
  store = makeStore();
  productsMock.mockReset();
});

describe("cart page", () => {
  it("shows a loading state until the cart arrives", () => {
    store = makeStore({ status: "loading", cart: null });
    render(<CartPage />);
    expect(screen.getByRole("status", { name: "Loading your cart" })).toBeTruthy();
  });

  it("offers a retry when the cart can't be loaded", async () => {
    store = makeStore({ status: "error", error: "We can't reach the store right now.", cart: null });
    render(<CartPage />);

    expect(screen.getByRole("alert").textContent).toContain("can't reach the store");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(store.reload).toHaveBeenCalled();
  });

  it("shows an empty state with a way to start shopping", () => {
    store = makeStore({ cart: cart([], { subtotal: 0, totalQuantity: 0 }) });
    render(<CartPage />);

    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start shopping" }).getAttribute("href")).toBe("/products");
  });

  it("lists each line with its total, and the subtotal and item count", () => {
    store = makeStore({ cart: cart([line(), line({ productId: "p2", name: "Mug", unitPrice: 8, lineTotal: 8, quantity: 1 })], { subtotal: 57, totalQuantity: 3 }) });
    render(<CartPage />);

    expect(screen.getByText("Desk Lamp")).toBeTruthy();
    expect(screen.getByText("$49.00")).toBeTruthy();
    const summary = screen.getByLabelText("Order summary");
    expect(within(summary).getByText("$57.00")).toBeTruthy();
    expect(within(summary).getByText("3")).toBeTruthy();
  });

  it("changes quantity through the server, and stops at the stock limit", async () => {
    store = makeStore({ cart: cart([line({ quantity: 2, availableStock: 3 })]) });
    render(<CartPage />);

    await userEvent.click(screen.getByLabelText(/increase quantity of desk lamp/i));
    expect(store.setQuantity).toHaveBeenCalledWith("p1", 3);

    store = makeStore({ cart: cart([line({ quantity: 3, availableStock: 3 })]) });
    render(<CartPage />);
    expect((screen.getAllByLabelText(/increase quantity of desk lamp/i)[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it("flags a product that is gone, with no stepper, and leaves it out of the total", () => {
    store = makeStore({ cart: cart([line({ name: null, unitPrice: null, lineTotal: 0, availableStock: 0, status: "unavailable" })], { subtotal: 0, hasIssues: true }) });
    render(<CartPage />);

    expect(screen.getByText(/no longer available/)).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.getByText(/aren't counted in the subtotal/)).toBeTruthy();
  });

  it("flags a line above the remaining stock and offers to fix it", async () => {
    store = makeStore({ cart: cart([line({ quantity: 5, availableStock: 2, lineTotal: 0, status: "insufficient_stock" })], { subtotal: 0, hasIssues: true }) });
    render(<CartPage />);

    expect(screen.getByRole("alert").textContent).toContain("Only 2 left, but you have 5");
    await userEvent.click(screen.getByRole("button", { name: "Change to 2" }));
    expect(store.setQuantity).toHaveBeenCalledWith("p1", 2);
  });

  it("asks before removing an item, and only removes on confirm", async () => {
    store = makeStore({ cart: cart([line()]) });
    render(<CartPage />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Desk Lamp from cart" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(store.removeFromCart).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Remove Desk Lamp from cart" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));
    expect(store.removeFromCart).toHaveBeenCalledWith("p1", "Desk Lamp");
  });

  it("asks before emptying the whole cart", async () => {
    store = makeStore({ cart: cart([line()]) });
    render(<CartPage />);

    await userEvent.click(screen.getByRole("button", { name: "Empty cart" }));
    expect(store.clearCart).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Empty cart" }));
    expect(store.clearCart).toHaveBeenCalled();
  });

  it("says there is no checkout instead of pretending", () => {
    store = makeStore({ cart: cart([line()]) });
    render(<CartPage />);
    expect(screen.getByText(/no checkout or payment step/)).toBeTruthy();
  });
});

describe("wishlist page", () => {
  const entry = (overrides: Record<string, unknown> = {}) => ({ productId: "p1", product: product(), status: "available", ...overrides });
  const wishlist = (items: unknown[]) => ({ userId: "guest-x", items, updatedAt: null });

  it("shows an empty state", () => {
    store = makeStore({ wishlist: wishlist([]) });
    render(<WishlistPage />);
    expect(screen.getByText("Your wishlist is empty")).toBeTruthy();
  });

  it("lists saved products with their category, and adds one to the cart", async () => {
    store = makeStore({ wishlist: wishlist([entry()]) });
    render(<WishlistPage />);

    expect(screen.getByText("Gadgets")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(store.addToCart).toHaveBeenCalledWith("p1", 1, "Desk Lamp");
  });

  it("can't add an out-of-stock product to the cart", () => {
    store = makeStore({ wishlist: wishlist([entry({ product: product({ stock: 0 }), status: "out_of_stock" })]) });
    render(<WishlistPage />);
    expect((screen.getByRole("button", { name: "Out of stock" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a deleted product as unavailable, and lets you drop it (after confirming)", async () => {
    store = makeStore({ wishlist: wishlist([entry({ product: null, status: "unavailable" })]) });
    render(<WishlistPage />);

    expect(screen.getByText(/no longer available/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Remove from wishlist" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));
    expect(store.removeFromWishlist).toHaveBeenCalledWith("p1", undefined);
  });
});

describe("ProductGrid", () => {
  const page = (ids: string[], next: string | null) => ({
    items: ids.map((id) => product({ productId: id, name: `Item ${id}` })),
    nextCursor: next,
    hasMore: next !== null,
  });

  it("explains an empty search and offers to clear it", () => {
    render(<ProductGrid initial={page([], null)} filters={{ q: "zzz" }} clearHref="/products" />);
    expect(screen.getByText("No products found")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Clear filters" }).getAttribute("href")).toBe("/products");
  });

  it("an empty catalog with no filters has nothing to clear", () => {
    render(<ProductGrid initial={page([], null)} filters={{}} clearHref="/products" />);
    expect(screen.queryByRole("link", { name: "Clear filters" })).toBeNull();
  });

  it("loads the next page with the cursor and the same filters, without duplicates", async () => {
    productsMock.mockResolvedValue(page(["b", "c"], null));
    render(<ProductGrid initial={page(["a", "b"], "cursor-1")} filters={{ q: "item", category: "c1" }} clearHref="/products" />);

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
    const sent = (productsMock.mock.calls[0][0] as URLSearchParams).toString();
    expect(sent).toContain("cursor=cursor-1");
    expect(sent).toContain("search=item");
    expect(sent).toContain("categoryId=c1");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("shows the error and lets you retry", async () => {
    productsMock.mockRejectedValueOnce(new ApiError(0, "We can't reach the store right now.")).mockResolvedValueOnce(page(["c"], null));
    render(<ProductGrid initial={page(["a"], "cursor-1")} filters={{}} clearHref="/products" />);

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect((await screen.findByRole("alert")).textContent).toContain("can't reach the store");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
  });
});
