import type { Metadata } from "next";
import { ApiError, catalog } from "@/lib/api";
import { parseFilters, toApiQuery, toPageQuery } from "@/lib/query";
import { ButtonLink } from "@/components/Button";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { ErrorState } from "@/components/states";

export const metadata: Metadata = { title: "All products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);

  let page;
  try {
    page = await catalog.products(toApiQuery(filters));
  } catch (err) {
    // The API rejected the filters (e.g. hand-edited URL): say so instead of a generic failure.
    if (err instanceof ApiError && err.status === 400) {
      return <ErrorState message={err.message} action={<ButtonLink href="/products">Clear filters</ButtonLink>} />;
    }
    throw err;
  }
  const categories = await catalog.categories();
  const key = toPageQuery(filters).toString();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All products</h1>
      <div className="mt-4">
        <FilterBar key={key} filters={filters} categories={categories} basePath="/products" />
      </div>
      <div className="mt-6">
        <ProductGrid key={key} initial={page} filters={filters} clearHref="/products" />
      </div>
    </div>
  );
}
