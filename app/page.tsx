import Link from "next/link";
import { catalog } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { toApiQuery } from "@/lib/query";
import type { Category, Product } from "@/lib/types";
import { ButtonLink } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/states";

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ products, categories }: { products: Product[]; categories: Category[] }) {
  const names = new Map(categories.map((c) => [c.categoryId, c.name]));
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.productId} product={p} categoryName={names.get(p.categoryId)} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    catalog.products(toApiQuery({}, { featured: true, limit: 8 })),
    catalog.products(toApiQuery({}, { limit: 8 })),
    catalog.categories(),
  ]);

  if (latest.items.length === 0) {
    return <EmptyState title="The shop is being stocked" message="There are no products yet. Please check back soon." />;
  }

  return (
    <div>
      <section className="rounded-2xl bg-slate-900 px-6 py-12 text-white sm:px-12 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-400">Welcome to {BRAND}</p>
        <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">Everything you need, in one place.</h1>
        <p className="mt-3 max-w-lg text-slate-300">
          Browse the catalog, save what you like, and build a cart — no account needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/products" className="bg-amber-400 text-slate-900 hover:bg-amber-300">
            Shop all products
          </ButtonLink>
          <ButtonLink href="/categories" variant="secondary" className="border-slate-600 text-white hover:bg-slate-800">
            Browse categories
          </ButtonLink>
        </div>
      </section>

      {categories.length > 0 && (
        <Section title="Shop by category" href="/categories">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <li key={c.categoryId}>
                <Link
                  href={`/categories/${encodeURIComponent(c.categoryId)}`}
                  className="block h-full rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <span className="font-medium text-slate-900">{c.name}</span>
                  {c.description && <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{c.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {featured.items.length > 0 && (
        <Section title="Featured products" href="/products">
          <Grid products={featured.items} categories={categories} />
        </Section>
      )}

      <Section title="Browse the catalog" href="/products">
        <Grid products={latest.items} categories={categories} />
      </Section>
    </div>
  );
}
