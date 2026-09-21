# CLAUDE.md

Context for Claude Code (or any AI assistant) working in this repo.

## What this repo is

`ecommerce-storefront` is the customer-facing shop of the ecommerce-admin
project, one of **four independent repos**:

- **ecommerce-admin-infra** — infrastructure only (CloudFormation,
  LocalStack, scripts, data model docs). Sibling folder.
- **ecommerce-admin-backend** — the Next.js API. Owns all business rules and
  the public `/api/store/*` routes this app consumes.
- **ecommerce-admin-frontend** — the admin dashboard. This repo never
  contains admin features.
- **ecommerce-storefront** (this repo) — browse, search, cart, wishlist.

It starts independently (own `docker-compose.yml`, port 3001) and only ever
makes HTTP calls to the backend via `lib/api.ts`. Never touch AWS from here.

## Key design decisions (don't undo these without a reason)

- **Business rules stay in the backend.** Stock ceilings, merging duplicate
  cart lines, prices, totals, "unavailable" flags are computed there. The UI
  presents them (and pre-disables obvious dead ends, e.g. the quantity picker
  stops at stock) but must never be the only enforcement or send prices.
- **Catalog pages are server components; cart/wishlist are client-side.**
  Filters live in the URL and are parsed/sanitised in `lib/query.ts`
  (never forward raw query strings). `StoreProvider` mirrors whatever the
  API last returned rather than computing anything locally.
- **Nothing renders at build time** (`export const dynamic = "force-dynamic"`
  in the root layout). CI and the Docker build have no backend, and stock
  changes constantly. Don't remove it without giving builds a backend.
- **`lib/api.ts` must only convert real network failures** (`TypeError`) into
  `ApiError`. Catching everything swallows Next's internal control-flow
  errors and breaks rendering.
- **The customer id is an anonymous `guest-<uuid>`**, scoping not
  authentication. Don't describe it (in UI or docs) as login or security.
- **No checkout, orders or payments** — out of scope by decision. The footer
  and cart say so.
- **Two Dockerfiles, different jobs**: `Dockerfile` for local dev (bind mount),
  `Dockerfile.ci` for CI/Railway (production build baked in). Railway's
  health check is `/health`, which deliberately doesn't call the backend.
- **This repo deploys independently** via its own `.github/workflows/ci.yml`.

## Conventions across all repos

- Documentation (README, code comments): **English**, even though
  conversations about this project may happen in Spanish. Keep inline
  comments short; put long rationale in commit messages or the README.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `test:`, `docs:`, `chore:`), in English, saying what changed and why.
- Don't fabricate commit timestamps/history to make automated work look
  like it happened incrementally over time it didn't.

## Where to look for more detail

- `README.md` — pages, how it works, env vars, deployment.
- `ecommerce-admin-backend/README.md` — the API this app calls.
- `ecommerce-admin-infra/docs/DATA_MODEL.md` — DynamoDB tables and access patterns.
