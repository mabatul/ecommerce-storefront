import { GridSkeleton } from "@/components/states";

export default function Loading() {
  return (
    <div>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" aria-hidden="true" />
      <div className="mt-4 h-28 animate-pulse rounded-xl bg-slate-200" aria-hidden="true" />
      <div className="mt-6">
        <GridSkeleton count={8} />
      </div>
    </div>
  );
}
