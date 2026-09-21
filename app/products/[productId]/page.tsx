import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, catalog } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { StockBadge } from "@/components/StockBadge";

// Shared by generateMetadata and the page so the API is called once per request.
const getDetail = cache(async (productId: string) => {
  try {
    return await catalog.product(productId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

type Params = Promise<{ productId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const detail = await getDetail((await params).productId);
  if (!detail) return { title: "Product not found" };
  return { title: detail.product.name, description: detail.product.description };
}

export default async function ProductPage({ params }: { params: Params }) {
  const detail = await getDetail((await params).productId);
  if (!detail) notFound();

  const { product, category, related } = detail;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/categories/${encodeURIComponent(category.categoryId)}`} className="hover:text-slate-900">
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-2xl border border-slate-200" />

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</span>
            <StockBadge stock={product.stock} />
          </div>

          {category && (
            <p className="mt-2 text-sm text-slate-500">
              Category:{" "}
              <Link href={`/categories/${encodeURIComponent(category.categoryId)}`} className="font-medium text-slate-700 underline">
                {category.name}
              </Link>
            </p>
          )}

          {product.description ? (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-slate-700">{product.description}</p>
          ) : (
            <p className="mt-5 text-sm text-slate-400">No description available.</p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <ProductActions product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.productId} product={p} categoryName={category?.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
