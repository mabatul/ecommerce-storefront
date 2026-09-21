// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStore, product } from "./store-mock";

const push = vi.fn();
let store = makeStore();
let pathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));
vi.mock("@/components/StoreProvider", () => ({ useStore: () => store }));

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FilterBar } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { QuantityStepper } from "@/components/QuantityStepper";
import { StockBadge } from "@/components/StockBadge";

beforeEach(() => {
  push.mockReset();
  store = makeStore();
  pathname = "/";
});

describe("QuantityStepper", () => {
  it("cannot go below the minimum or above the maximum", () => {
    const { rerender } = render(<QuantityStepper value={1} max={3} onChange={() => {}} />);
    expect((screen.getByLabelText("Decrease quantity") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Increase quantity") as HTMLButtonElement).disabled).toBe(false);

    rerender(<QuantityStepper value={3} max={3} onChange={() => {}} />);
    expect((screen.getByLabelText("Increase quantity") as HTMLButtonElement).disabled).toBe(true);
  });

  it("reports the new value", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} max={5} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Increase quantity"));
    await userEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });

  it("is fully disabled while busy", () => {
    render(<QuantityStepper value={2} max={5} disabled onChange={() => {}} />);
    expect((screen.getByLabelText("Increase quantity") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Decrease quantity") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("StockBadge", () => {
  it.each([
    [0, "Out of stock"],
    [3, "Only 3 left"],
    [5, "Only 5 left"],
    [6, "In stock"],
  ])("stock %i reads %s", (stock, label) => {
    render(<StockBadge stock={stock} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe("ProductCard", () => {
  it("shows the name, category, description, price and stock", () => {
    render(<ProductCard product={product()} />);

    expect(screen.getByText("Desk Lamp")).toBeTruthy();
    expect(screen.getByText("Gadgets")).toBeTruthy();
    expect(screen.getByText("Warm light, adjustable arm")).toBeTruthy();
    expect(screen.getByText("$24.50")).toBeTruthy();
    expect(screen.getByText("In stock")).toBeTruthy();
  });

  it("links to the product page, encoding the id", () => {
    render(<ProductCard product={product({ productId: "a b/c" })} />);
    expect(screen.getAllByRole("link", { name: "Desk Lamp" })[0].getAttribute("href")).toBe("/products/a%20b%2Fc");
  });

  it("adds one unit to the cart", async () => {
    render(<ProductCard product={product()} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(store.addToCart).toHaveBeenCalledWith("p1", 1, "Desk Lamp");
  });

  it("cannot be added when sold out", () => {
    render(<ProductCard product={product({ stock: 0 })} />);
    const button = screen.getByRole("button", { name: "Out of stock" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("stops offering more once all the stock is already in the cart", () => {
    store = makeStore({ quantityInCart: () => 3 });
    render(<ProductCard product={product({ stock: 3 })} />);
    expect((screen.getByRole("button", { name: "All available in cart" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("caps at 99 per product even when there is more stock", () => {
    store = makeStore({ quantityInCart: () => 99 });
    render(<ProductCard product={product({ stock: 500 })} />);
    expect((screen.getByRole("button", { name: "All available in cart" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables the button while that product's request is in flight", () => {
    store = makeStore({ isPending: (key: string) => key === "cart:p1" });
    render(<ProductCard product={product()} />);
    expect((screen.getByRole("button", { name: "Add to cart" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("marks featured products and works without a description", () => {
    render(<ProductCard product={product({ featured: true, description: undefined })} />);
    expect(screen.getByText("Featured")).toBeTruthy();
    expect(screen.queryByText("Warm light, adjustable arm")).toBeNull();
  });

  it("reflects and toggles the wishlist", async () => {
    store = makeStore({ inWishlist: (id: string) => id === "p1" });
    render(<ProductCard product={product()} />);

    const heart = screen.getByRole("button", { name: /Remove Desk Lamp from wishlist/ });
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(heart);
    expect(store.toggleWishlist).toHaveBeenCalledWith("p1", "Desk Lamp");
  });
});

describe("FilterBar", () => {
  const categories = [{ categoryId: "c1", name: "Gadgets" }, { categoryId: "c2", name: "Books" }];
  const base = { filters: {}, categories, basePath: "/products" };

  it("applies the typed filters to the URL", async () => {
    render(<FilterBar {...base} />);

    await userEvent.type(screen.getByPlaceholderText("Name or description"), "lamp");
    await userEvent.type(screen.getByPlaceholderText("0"), "5");
    await userEvent.type(screen.getByPlaceholderText("Any"), "20");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).toHaveBeenCalledWith("/products?q=lamp&min=5&max=20");
  });

  it("refuses a minimum above the maximum and says why", async () => {
    render(<FilterBar {...base} />);

    await userEvent.type(screen.getByPlaceholderText("0"), "50");
    await userEvent.type(screen.getByPlaceholderText("Any"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/minimum price can't be above/);
  });

  it("applies a category or the in-stock toggle immediately", async () => {
    render(<FilterBar {...base} />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "c2");
    expect(push).toHaveBeenLastCalledWith("/products?category=c2");

    await userEvent.click(screen.getByRole("checkbox", { name: "In stock only" }));
    expect(push).toHaveBeenLastCalledWith("/products?category=c2&inStock=1");
  });

  it("starts from the filters already in the URL and can clear them", async () => {
    render(<FilterBar {...base} filters={{ q: "lamp", inStock: true }} />);

    expect((screen.getByPlaceholderText("Name or description") as HTMLInputElement).value).toBe("lamp");
    expect((screen.getByRole("checkbox", { name: "In stock only" }) as HTMLInputElement).checked).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(push).toHaveBeenCalledWith("/products");
  });

  it("hides the category selector on a category page", () => {
    render(<FilterBar {...base} lockCategory />);
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("only offers Clear when something is filtered", () => {
    const { rerender } = render(<FilterBar {...base} />);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    rerender(<FilterBar {...base} filters={{ min: 0 }} />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });
});

describe("ConfirmDialog", () => {
  it("renders nothing while closed", () => {
    render(<ConfirmDialog open={false} title="Remove it?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("confirms or cancels", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Remove it?" description="Really?" confirmLabel="Remove" onConfirm={onConfirm} onCancel={onCancel} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Really?")).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("locks both buttons while working", () => {
    render(<ConfirmDialog open title="Remove it?" busy onConfirm={() => {}} onCancel={() => {}} />);
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Working..." }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Header", () => {
  const categories = [{ categoryId: "c1", name: "Gadgets" }, { categoryId: "c2", name: "Books" }];

  it("searches by pushing the query to the listing", async () => {
    render(<Header categories={categories} />);
    await userEvent.type(screen.getByPlaceholderText("Search products"), " desk lamp {enter}");
    expect(push).toHaveBeenCalledWith("/products?q=desk%20lamp");
  });

  it("an empty search just opens the catalog", async () => {
    render(<Header categories={categories} />);
    await userEvent.type(screen.getByPlaceholderText("Search products"), "   {enter}");
    expect(push).toHaveBeenCalledWith("/products");
  });

  it("shows the cart and wishlist counts, and hides zeros", () => {
    store = makeStore({ cartCount: 3, wishlistCount: 120 });
    render(<Header categories={categories} />);

    expect(screen.getByLabelText("Cart, 3 items")).toBeTruthy();
    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("has a mobile menu that lists the categories and toggles", async () => {
    render(<Header categories={categories} />);
    const toggle = screen.getByRole("button", { name: "Menu" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();

    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const menu = screen.getByRole("navigation", { name: "Menu" });
    expect(within(menu).getByRole("link", { name: "Books" }).getAttribute("href")).toBe("/categories/c2");

    await userEvent.click(toggle);
    expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
  });

  it("highlights the current section", () => {
    pathname = "/categories/c2";
    render(<Header categories={categories} />);
    const current = screen.getAllByRole("link", { name: "Books" })[0];
    expect(current.className).toContain("bg-slate-900");
  });
});
