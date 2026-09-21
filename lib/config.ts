// Single place to rebrand the storefront.
export const BRAND = "Tynoc Store";

// Server rendering may use a private URL (API_URL); the browser always uses the public one.
export const API_URL =
  (typeof window === "undefined" ? process.env.API_URL : undefined) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export const PAGE_SIZE = 12;
