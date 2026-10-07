# X-Forwarded-For Map Explorer

A static, map-first IP range explorer that searches official cloud-provider feeds and matches X-Forwarded-For IPs to published CIDRs.

## Run & Operate

- `pnpm --filter @workspace/xff-map-explorer run dev` — run the map explorer
- `pnpm --filter @workspace/xff-map-explorer run refresh:data` — fetch current official cloud IP feeds into its static snapshot
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
- `artifacts/xff-map-explorer/scripts/refresh-cloud-ranges.mjs` — fetch and normalize official AWS, Azure, and Google Cloud IP feeds
- `artifacts/xff-map-explorer/public/data/cloud-ranges.json` — generated public range snapshot used by the static app
- `.github/workflows/deploy-pages.yml` — GitHub Pages build and deployment workflow

## Architecture decisions

- The map explorer is a frontend-only static app; it does not require the API server or a database.
- Never add illustrative or fabricated IPs, traffic, service health, or facility coordinates. Use official provider IP feeds; clearly identify mapped points as approximate cloud-region areas.
- The map explorer supports XFF IP lookup against published provider CIDRs, but it does not ingest XFF traffic or prove a request passed through a provider.
- GitHub Pages deploys the Vite build with a repository-aware base path.
- GitHub Actions refreshes the public cloud range feeds every six hours and republishes the static snapshot.

## Product

- Search and filter official provider ranges by XFF IP, CIDR, service, region, provider, IP family, and broad area.
- Keep the desktop experience map-first and space-efficient; make region results and prefix details compact and scrollable.

## User preferences

- Keep the site deployable as static files on GitHub Pages.
- Prefer a minimal-code implementation with ready-to-use libraries and usable search/map interactions.

## Gotchas

- The GitHub Pages workflow runs on pushes to `main`, on its six-hour schedule, and manually; choose GitHub Actions as the Pages source in repository settings.
- Map tiles come from OpenStreetMap and require internet access; the cloud IP snapshot is bundled as a static JSON file.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
