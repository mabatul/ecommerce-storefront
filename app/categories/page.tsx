import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/lib/api";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await catalog.categories();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Categories</h1>

      <div className="mt-6">
        {categories.length === 0 ? (
          <EmptyState title="No categories available" message="Categories will appear here once the shop is set up." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.categoryId}>
                <Link
                  href={`/categories/${encodeURIComponent(c.categoryId)}`}
                  className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-slate-900">{c.name}</span>
                  <span className="mt-1 block text-sm text-slate-500">{c.description ?? "Browse this category"}</span>
                  <span className="mt-4 inline-block text-sm font-medium text-slate-900">Shop now →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
