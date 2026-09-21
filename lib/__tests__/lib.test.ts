import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, catalog, shop } from "../api";
import { getCustomerId, isValidCustomerId, resetCustomerIdFallback } from "../customer";
import { formatPrice, maxOrderable, stockInfo } from "../format";
import { hasActiveFilters, parseFilters, toApiQuery, toPageQuery } from "../query";

afterEach(() => {
  vi.unstubAllGlobals();
  resetCustomerIdFallback();
});

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("customer id", () => {
  it("creates a guest id in the format the backend accepts and remembers it", () => {
    const store = memoryStore();
    const id = getCustomerId(store);

    expect(isValidCustomerId(id)).toBe(true);
    expect(getCustomerId(store)).toBe(id);
    expect(store.data.get("storefront-customer-id")).toBe(id);
  });

  it("replaces a corrupted stored value instead of sending it to the API", () => {
    const store = memoryStore({ "storefront-customer-id": "user-001; DROP TABLE" });
    const id = getCustomerId(store);
    expect(isValidCustomerId(id)).toBe(true);
    expect(id).not.toContain("DROP");
  });

  it("stays stable for the session when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(getCustomerId(blocked)).toBe(getCustomerId(blocked));
  });

  it("works without storage at all", () => {
    expect(isValidCustomerId(getCustomerId(null))).toBe(true);
  });

  it("still produces a valid id where crypto.randomUUID is unavailable (plain http)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
    expect(isValidCustomerId(getCustomerId(memoryStore()))).toBe(true);
  });

  it("rejects malformed ids", () => {
    for (const bad of ["", "guest-123", "GUEST-11111111-1111-4111-8111-111111111111", null, 5]) {
      expect(isValidCustomerId(bad)).toBe(false);
    }
  });
});

describe("filters", () => {
  it("parses the shopper URL", () => {
    expect(parseFilters({ q: " lamp ", category: "cat-home", inStock: "1", min: "10", max: "50" })).toEqual({
      q: "lamp",
      category: "cat-home",
      inStock: true,
      min: 10,
      max: 50,
    });
  });

  it("drops unusable values instead of forwarding them", () => {
    expect(parseFilters({ q: "  ", min: "abc", max: "-3", inStock: "yes", category: "" })).toEqual({
      q: undefined,
      category: undefined,
      inStock: undefined,
      min: undefined,
      max: undefined,
    });
  });

  it("takes the first value of a repeated parameter and caps the search length", () => {
    expect(parseFilters({ q: ["one", "two"] }).q).toBe("one");
    expect(parseFilters({ q: "x".repeat(500) }).q).toHaveLength(100);
  });

  it("swaps a reversed price range", () => {
    expect(parseFilters({ min: "90", max: "10" })).toMatchObject({ min: 10, max: 90 });
  });

  it("maps to the backend's parameter names", () => {
    const query = toApiQuery({ q: "lamp", category: "c1", inStock: true, min: 5, max: 20 }, { cursor: "abc", limit: 6 });
    expect(Object.fromEntries(query)).toEqual({
      search: "lamp",
      categoryId: "c1",
      inStock: "true",
      minPrice: "5",
      maxPrice: "20",
      cursor: "abc",
      limit: "6",
    });
  });

  it("asks for featured products and the default page size", () => {
    expect(Object.fromEntries(toApiQuery({}, { featured: true }))).toEqual({ featured: "true", limit: "12" });
  });

  it("round-trips through the page URL", () => {
    const filters = { q: "a b", category: "c1", inStock: true, min: 1, max: 9 };
    const params = Object.fromEntries(toPageQuery(filters));
    expect(parseFilters(params)).toEqual(filters);
  });

  it("knows when nothing is filtered", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ min: 0 })).toBe(true);
  });
});

describe("formatting", () => {
  it("formats prices", () => {
    expect(formatPrice(59.99)).toBe("$59.99");
    expect(formatPrice(1234.5)).toBe("$1,234.50");
  });

  it("describes stock", () => {
    expect(stockInfo(0)).toEqual({ label: "Out of stock", tone: "out" });
    expect(stockInfo(3)).toEqual({ label: "Only 3 left", tone: "low" });
    expect(stockInfo(5).tone).toBe("low");
    expect(stockInfo(6)).toEqual({ label: "In stock", tone: "ok" });
  });

  it("caps how many can be ordered", () => {
    expect(maxOrderable(0)).toBe(0);
    expect(maxOrderable(7)).toBe(7);
    expect(maxOrderable(1000)).toBe(99);
  });
});

describe("api client", () => {
  const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

  it("sends the customer id and JSON body for cart writes", async () => {
    const fetchMock = vi.fn().mockReturnValue(ok({ lines: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await shop.addToCart("guest-x", "p1", 2);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/store/cart/items");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ productId: "p1", quantity: 2 });
    expect(init.headers.get("X-Customer-Id")).toBe("guest-x");
    expect(init.headers.get("Content-Type")).toBe("application/json");
  });

  it("does not send a customer id for the public catalog", async () => {
    const fetchMock = vi.fn().mockReturnValue(ok({ items: [], nextCursor: null, hasMore: false }));
    vi.stubGlobal("fetch", fetchMock);

    await catalog.products(new URLSearchParams({ limit: "3" }));

    expect(fetchMock.mock.calls[0][1].headers.has("X-Customer-Id")).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toContain("limit=3");
  });

  it("encodes ids in paths", async () => {
    const fetchMock = vi.fn().mockReturnValue(ok({}));
    vi.stubGlobal("fetch", fetchMock);

    await catalog.product("a/b c");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/store/products/a%2Fb%20c");
  });

  it("turns API errors into ApiError with the server's message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(ok({ error: 'Only 3 of "Lamp" available', details: { availableStock: 3 } }, 409)));

    const error = await shop.addToCart("guest-x", "p1", 9).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: 'Only 3 of "Lamp" available', details: { availableStock: 3 } });
  });

  it("reports an unreachable backend as status 0 with a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await catalog.categories().catch((e) => e);
    expect(error).toMatchObject({ status: 0 });
    expect(error.message).toMatch(/can't reach the store/i);
  });

  it("does not swallow non-network errors such as Next's dynamic-render signal", async () => {
    const signal = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(signal));

    await expect(catalog.categories()).rejects.toBe(signal);
  });

  it("copes with an error response that is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 })));

    const error = await catalog.categories().catch((e) => e);
    expect(error).toMatchObject({ status: 502 });
    expect(error.message).toContain("502");
  });
});
