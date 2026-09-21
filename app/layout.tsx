import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { catalog } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/StoreProvider";
import { ToastProvider } from "@/components/Toast";

// Catalog and stock change constantly, and the build must not need the backend to be reachable
// (CI and the Docker build have none), so nothing here is generated at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: BRAND, template: `%s · ${BRAND}` },
  description: "Browse products, build a cart and save favourites.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The category nav is a nicety: if the API is down the pages still render their own error state.
  const categories = await catalog.categories().catch(() => []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <ToastProvider>
          <StoreProvider categories={categories}>
            <Header categories={categories} />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <Footer />
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
