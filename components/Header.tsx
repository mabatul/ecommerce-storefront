"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/config";
import type { Category } from "@/lib/types";
import { CartIcon, HeartIcon, SearchIcon } from "@/components/Icons";
import { useStore } from "@/components/StoreProvider";

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-semibold text-white"
      aria-label={label}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount, wishlistCount } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // The mobile menu closes itself when you navigate somewhere.
  useEffect(() => setMenuOpen(false), [pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  const iconLink = "relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const navLink = (href: string) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
      pathname === href || pathname.startsWith(`${href}/`) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Menu"
          className="rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>

        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          {BRAND}
        </Link>

        <form onSubmit={onSearch} role="search" className="order-last flex w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-md">
          <label className="relative block w-full">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              maxLength={100}
              className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-slate-500 focus:bg-white focus:outline-none"
            />
          </label>
        </form>

        <nav className="ml-auto flex items-center gap-1" aria-label="Account">
          <Link href="/wishlist" className={iconLink} aria-label={`Wishlist, ${wishlistCount} items`}>
            <HeartIcon className="h-6 w-6" />
            <CountBadge count={wishlistCount} label={`${wishlistCount} items in wishlist`} />
          </Link>
          <Link href="/cart" className={iconLink} aria-label={`Cart, ${cartCount} items`}>
            <CartIcon className="h-6 w-6" />
            <CountBadge count={cartCount} label={`${cartCount} items in cart`} />
          </Link>
        </nav>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="border-t border-slate-100 md:hidden" aria-label="Menu">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            <li>
              <Link href="/products" className={`${navLink("/products")} block`}>
                All products
              </Link>
            </li>
            <li>
              <Link href="/categories" className={`${navLink("/categories")} block`}>
                Categories
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.categoryId}>
                <Link href={`/categories/${encodeURIComponent(c.categoryId)}`} className={`${navLink(`/categories/${encodeURIComponent(c.categoryId)}`)} block pl-6`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <nav className="hidden border-t border-slate-100 md:block" aria-label="Categories">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          <li>
            <Link href="/products" className={navLink("/products")}>
              All products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.categoryId}>
              <Link href={`/categories/${encodeURIComponent(c.categoryId)}`} className={navLink(`/categories/${encodeURIComponent(c.categoryId)}`)}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
