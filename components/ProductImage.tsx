"use client";

import { useState } from "react";

// Falls back to a neutral tile when there's no image or it fails to load.
export function ProductImage({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-xs font-medium text-slate-400 ${className}`}
        role="img"
        aria-label={`${alt} (no image)`}
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}
