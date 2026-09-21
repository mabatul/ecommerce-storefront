import type { ReactNode } from "react";

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-red-800">Something went wrong</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-red-700">{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

const pulse = "animate-pulse rounded bg-slate-200";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-hidden="true">
      <div className={`aspect-square w-full ${pulse} rounded-none`} />
      <div className="space-y-2 p-3">
        <div className={`h-4 w-3/4 ${pulse}`} />
        <div className={`h-4 w-1/3 ${pulse}`} />
        <div className={`h-9 w-full ${pulse}`} />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`h-4 ${pulse}`} style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}
