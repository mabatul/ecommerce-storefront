"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { hasActiveFilters, toPageQuery, type ListingFilters } from "@/lib/query";
import type { Category } from "@/lib/types";
import { Button } from "@/components/Button";

interface FilterBarProps {
  filters: ListingFilters;
  categories: Category[];
  basePath: string;
  lockCategory?: boolean; // on a category page the category comes from the URL path
}

type Values = { q: string; category: string; inStock: boolean; min: string; max: string };

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function FilterBar({ filters, categories, basePath, lockCategory = false }: FilterBarProps) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    q: filters.q ?? "",
    category: filters.category ?? "",
    inStock: Boolean(filters.inStock),
    min: filters.min?.toString() ?? "",
    max: filters.max?.toString() ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  function apply(next: Values) {
    const min = next.min === "" ? undefined : Number(next.min);
    const max = next.max === "" ? undefined : Number(next.max);

    if ((min !== undefined && !(min >= 0)) || (max !== undefined && !(max >= 0))) {
      setError("Prices must be numbers of 0 or more.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setError("The minimum price can't be above the maximum.");
      return;
    }
    setError(null);

    const query = toPageQuery({
      q: next.q.trim() || undefined,
      category: lockCategory ? undefined : next.category || undefined,
      inStock: next.inStock || undefined,
      min,
      max,
    }).toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(values);
  }

  function clear() {
    setValues({ q: "", category: "", inStock: false, min: "", max: "" });
    setError(null);
    router.push(basePath);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Filter products">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Search</span>
          <input
            type="search"
            value={values.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Name or description"
            maxLength={100}
            className={field}
          />
        </label>

        {!lockCategory && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
            <select
              value={values.category}
              onChange={(e) => {
                const next = { ...values, category: e.target.value };
                setValues(next);
                apply(next);
              }}
              className={field}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Min price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.min}
            onChange={(e) => set("min", e.target.value)}
            placeholder="0"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Max price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.max}
            onChange={(e) => set("max", e.target.value)}
            placeholder="Any"
            className={field}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.inStock}
            onChange={(e) => {
              const next = { ...values, inStock: e.target.checked };
              setValues(next);
              apply(next);
            }}
          />
          In stock only
        </label>
        <div className="flex gap-2">
          {hasActiveFilters(filters) && (
            <Button variant="secondary" onClick={clear}>
              Clear
            </Button>
          )}
          <Button type="submit">Apply</Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
