import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, catalog } from "@/lib/api";
import { parseFilters, toApiQuery, toPageQuery } from "@/lib/query";
import { ButtonLink } from "@/components/Button";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { ErrorState } from "@/components/states";

const getCategories = cache(() => catalog.categories());

type Params = Promise<{ categoryId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categoryId } = await params;
  const category = (await getCategories()).find((c) => c.categoryId === categoryId);
  return { title: category?.name ?? "Category not found" };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { categoryId } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.categoryId === categoryId);
  if (!category) notFound();

  // The category comes from the path, whatever the query string says.
  const filters = { ...parseFilters(await searchParams), category: categoryId };
  const basePath = `/categories/${encodeURIComponent(categoryId)}`;

  let page;
  try {
    page = await catalog.products(toApiQuery(filters));
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      return <ErrorState message={err.message} action={<ButtonLink href={basePath}>Clear filters</ButtonLink>} />;
    }
    throw err;
  }
  const key = toPageQuery({ ...filters, category: undefined }).toString();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
      {category.description && <p className="mt-1 text-slate-500">{category.description}</p>}

      <div className="mt-4">
        <FilterBar key={key} filters={{ ...filters, category: undefined }} categories={categories} basePath={basePath} lockCategory />
      </div>
      <div className="mt-6">
        <ProductGrid key={key} initial={page} filters={filters} clearHref={basePath} />
      </div>
    </div>
  );
}
