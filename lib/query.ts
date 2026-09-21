// Product listing filters: the shopper-facing URL (?q=&category=...) <-> the backend's query.
import { PAGE_SIZE } from "./config";

export interface ListingFilters {
  q?: string;
  category?: string;
  inStock?: boolean;
  min?: number;
  max?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

function price(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Never trust the URL: anything unusable is dropped rather than forwarded.
export function parseFilters(params: RawParams): ListingFilters {
  const filters: ListingFilters = {
    q: first(params.q)?.slice(0, 100),
    category: first(params.category),
    inStock: first(params.inStock) === "1" ? true : undefined,
    min: price(first(params.min)),
    max: price(first(params.max)),
  };
  if (filters.min !== undefined && filters.max !== undefined && filters.min > filters.max) {
    [filters.min, filters.max] = [filters.max, filters.min];
  }
  return filters;
}

export function toApiQuery(
  filters: ListingFilters,
  extra: { limit?: number; cursor?: string; featured?: boolean } = {}
): URLSearchParams {
  const query = new URLSearchParams();
  if (filters.q) query.set("search", filters.q);
  if (filters.category) query.set("categoryId", filters.category);
  if (filters.inStock) query.set("inStock", "true");
  if (filters.min !== undefined) query.set("minPrice", String(filters.min));
  if (filters.max !== undefined) query.set("maxPrice", String(filters.max));
  if (extra.featured) query.set("featured", "true");
  if (extra.cursor) query.set("cursor", extra.cursor);
  query.set("limit", String(extra.limit ?? PAGE_SIZE));
  return query;
}

// The shopper-facing URL for a set of filters.
export function toPageQuery(filters: ListingFilters): URLSearchParams {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.inStock) query.set("inStock", "1");
  if (filters.min !== undefined) query.set("min", String(filters.min));
  if (filters.max !== undefined) query.set("max", String(filters.max));
  return query;
}

export const hasActiveFilters = (filters: ListingFilters) =>
  Boolean(filters.q || filters.category || filters.inStock || filters.min !== undefined || filters.max !== undefined);
