# ecommerce-storefront

The customer-facing shop (Next.js + Tailwind CSS): browse and search the
catalog, filter by category/price/stock, view product details, and keep a
cart and a wishlist. It reads everything from the
[backend](../ecommerce-admin-backend)'s public `/api/store/*` API and never
talks to AWS directly. Store staff manage the catalog in the separate
[admin dashboard](../ecommerce-admin-frontend).

Part of a multi-repo project — see
[`ecommerce-admin-infra`](../ecommerce-admin-infra) for the overall
architecture, the DynamoDB data model, and how to bring everything up
together.

> **Demo scope.** There is no checkout, payment or customer account. A
> cart and wishlist belong to an anonymous id stored in the browser (see
> "How customers are identified"). The footer says so too.

## Pages

| Path | What it does |
|---|---|
| `/` | Homepage: hero, categories, featured products, catalog preview |
| `/products` | Full catalog with search, category, price and in-stock filters, and "Load more" cursor pagination |
| `/products/:id` | Product page: image, price, stock, description, quantity picker, add to cart, wishlist, related products |
| `/categories` | All categories |
| `/categories/:id` | One category's products (same filters, category fixed) |
| `/cart` | Cart: change quantities, remove items (with confirmation), see the subtotal, spot unavailable or over-stock items |
| `/wishlist` | Wishlist: add to cart, remove (with confirmation), unavailable items flagged |
| `/health` | Liveness probe for the host; doesn't call the backend |

Every data page has loading (skeletons), empty, and error states, and
unknown products/categories show a not-found page.

## How it works

- **Catalog pages are server-rendered** from the backend, so they're fast
  and indexable. Filters live in the URL (`/products?q=lamp&category=…`),
  so a filtered view can be shared and the back button works. The first page
  of results is rendered on the server; "Load more" fetches the next cursor
  page from the browser.
- **Cart and wishlist are client-side**, kept in a small context
  ([`StoreProvider`](components/StoreProvider.tsx)). Every change is sent to
  the API, which answers with the full updated cart/wishlist, so what you see
  is always what the server has. Prices, stock and totals are computed by
  the backend, never trusted from the browser.
- **Business rules live in the backend** (one line per product, quantity
  capped at stock, deleted/out-of-stock products flagged instead of
  breaking the page). This app only presents them — e.g. the quantity picker
  stops at the stock left, and the server rejects anything beyond it anyway.
- Nothing is generated at build time (`dynamic = "force-dynamic"` in the
  root layout): stock changes constantly, and CI/Docker builds have no
  backend to call.

### How customers are identified

There are no accounts. On first visit the browser generates a random
`guest-<uuid>`, stores it in `localStorage`, and sends it as `X-Customer-Id`
with cart/wishlist requests. That is enough to give each browser its own
cart, but it is **not authentication**: there's no login, carts don't follow
you across devices, and anyone who somehow learned your id could read your
cart. If storage is blocked the id lasts for the tab. The admin dashboard
shows these carts as "Guest xxxxxx".

## Running with Docker (recommended)

This repo has its own `docker-compose.yml` and starts **independently**.
Bring up infra, then the backend first (see their READMEs), then, from here:

```bash
docker compose up
```

Storefront at http://localhost:3001. Seed the sample catalog from
`ecommerce-admin-infra` (`./scripts/seed-local.sh`) if it's empty.

## Running standalone (outside Docker)

```bash
npm install

export NEXT_PUBLIC_API_URL=http://localhost:4000  # backend running separately
export STOREFRONT_PORT=3001

npm run dev
```

## Environment variables

| Variable | Local default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend URL used by the **browser** (cart/wishlist, "Load more"). Must be reachable from the visitor's machine. Baked into the client bundle at build time |
| `API_URL` | *(empty)* | Optional backend URL for **server-side rendering only** (e.g. a private network address). Falls back to `NEXT_PUBLIC_API_URL` |
| `PORT` | *(set by the host)* | Takes precedence when present (Railway injects it) |
| `STOREFRONT_PORT` | `3001` | Server port when `PORT` isn't set |

The storefront needs no secrets: it only uses the backend's public routes.
The store name is a single constant, `BRAND` in [`lib/config.ts`](lib/config.ts).

Note: `npm run start` reads these with shell syntax, so on Windows run it via Docker (or `npx next start -p 3001`).

## npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (hot-reload) |
| `npm run build` | Production build (needs no backend) |
| `npm run start` | Runs the production build |
| `npm run lint` | Lint |
| `npm test` | Unit tests (Vitest) |

## Structure

```
app/                    Pages (App Router): home, products, categories, cart, wishlist, health
components/             ProductCard, ProductGrid, FilterBar, Header, StoreProvider, ...
components/StoreProvider.tsx   Cart + wishlist state, talks to the API
lib/api.ts              Typed client for the backend (catalog + cart/wishlist)
lib/query.ts            Filters <-> URL <-> backend query, with sanitising
lib/customer.ts         Anonymous customer id
lib/format.ts           Prices and stock labels
lib/__tests__/          Unit tests
docker-compose.yml      Runs this service on its own (see "Running with Docker")
```

## Testing

`npm test` covers the logic that isn't visual: filter parsing (untrusted URL
input), the API client (headers, error mapping, network failures), the
customer id (corrupt/blocked storage, plain-http browsers) and formatting.
The cart and stock rules are tested in the backend, where they live.

## Deployment

**CI/CD**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) has two
jobs:

- **`build`** — every push (any branch) and every pull request into `main`:
  `npm ci`, `npm run lint`, `npm test`, then `npm run build` with
  `NEXT_PUBLIC_API_URL` from the repository variable below.
- **`deploy`** — only after `build` succeeds, and only on a push to `main`:
  `railway up --service ecommerce-storefront --detach`, which builds the
  image on Railway from [`Dockerfile.ci`](Dockerfile.ci) (per
  [`railway.json`](railway.json); health check on `/health`). `--detach`
  means the workflow doesn't wait for that remote build — check the Railway
  dashboard.

For the deploy job to work, you need:

1. A Railway service named `ecommerce-storefront` in the same project as the
   backend, with `NEXT_PUBLIC_API_URL` set to the backend's public URL (it is
   also passed at build time, so set the repository variable below too).
2. A Railway **Project Token** (project → Settings → Tokens).
3. In this repo's GitHub Settings → Secrets and variables → Actions:
   - a **repository secret** `RAILWAY_TOKEN` with that token;
   - a **repository variable** `NEXT_PUBLIC_API_URL` with the backend's public
     URL (not a secret). Falls back to `http://localhost:4000` if unset.
