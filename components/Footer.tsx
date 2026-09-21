import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-slate-700">{BRAND}</span> — a demo storefront. There is no checkout or payment;
          your cart and wishlist live in this browser only.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/products" className="hover:text-slate-900">
            Products
          </Link>
          <Link href="/categories" className="hover:text-slate-900">
            Categories
          </Link>
          <Link href="/wishlist" className="hover:text-slate-900">
            Wishlist
          </Link>
        </nav>
      </div>
    </footer>
  );
}
