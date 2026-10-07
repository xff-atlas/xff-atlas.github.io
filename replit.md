# X-Forwarded-For Map Explorer

A static, searchable map explorer for illustrative data-center locations and sample X-Forwarded-For/IP chains.

## Run & Operate

- `pnpm --filter @workspace/xff-map-explorer run dev` — run the map explorer
- `pnpm --filter @workspace/xff-map-explorer run build` — build its static site (requires `PORT` and `BASE_PATH`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/xff-map-explorer/` — the static React/Vite app
- `artifacts/xff-map-explorer/src/data/` — illustrative data-center and XFF sample records
- `.github/workflows/deploy-pages.yml` — GitHub Pages build and deployment workflow

## Architecture decisions

- The map explorer is a frontend-only static app; it does not require the API server or a database.
- Sample IPs use documentation-only ranges and are not real data-center addresses or live IP geolocation.
- GitHub Pages deploys the Vite build with a repository-aware base path.

## Product

- Search and filter illustrative locations by data-center name, city, provider, IP, XFF value, region, and status.
- Inspect location details and copy IP/XFF values from the map explorer.

## User preferences

- Keep the site deployable as static files on GitHub Pages.
- Prefer a minimal-code implementation with ready-to-use libraries and usable search/map interactions.

## Gotchas

- The GitHub Pages workflow deploys on pushes to `main`; choose GitHub Actions as the Pages source in repository settings.
- Map tiles come from OpenStreetMap and require internet access; the rest of the app data is local.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
