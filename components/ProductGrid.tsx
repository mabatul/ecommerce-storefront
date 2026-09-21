"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, catalog } from "@/lib/api";
import { hasActiveFilters, toApiQuery, type ListingFilters } from "@/lib/query";
import type { Page, Product } from "@/lib/types";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/states";

interface ProductGridProps {
  initial: Page<Product>;
  filters: ListingFilters;
  clearHref: string;
}

// First page arrives server-rendered; "Load more" fetches the next cursor page from the browser.
// Remount it (key) when the filters change.
export function ProductGrid({ initial, filters, clearHref }: ProductGridProps) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    try {
      const page = await catalog.products(toApiQuery(filters, { cursor }));
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.productId));
        return [...prev, ...page.items.filter((p) => !seen.has(p.productId))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load more products.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    const filtered = hasActiveFilters(filters);
    return (
      <EmptyState
        title="No products found"
        message={filtered ? "Nothing matches those filters. Try widening your search." : "There are no products to show yet."}
        action={
          filtered ? (
            <Link href={clearHref} className="text-sm font-medium text-slate-900 underline">
              Clear filters
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-red-600">
          {error}
        </p>
      )}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : error ? "Try again" : "Load more"}
          </Button>
        </div>
      )}
      {!hasMore && items.length > 8 && <p className="mt-6 text-center text-sm text-slate-400">You have reached the end.</p>}
    </div>
  );
}
