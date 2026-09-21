import { TextSkeleton } from "@/components/states";

export default function Loading() {
  return (
    <div className="grid gap-8 md:grid-cols-2" role="status" aria-label="Loading product">
      <div className="aspect-square w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-1/3 animate-pulse rounded bg-slate-200" />
        <TextSkeleton lines={4} />
        <div className="h-10 w-40 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
