# X-Forwarded-For Map Explorer

A static, single-page map explorer for an illustrative data-center footprint and sample X-Forwarded-For chains. It has no app server, database, credentials, or live telemetry.

## Run locally

From the workspace root:

```sh
pnpm --filter @workspace/xff-map-explorer run dev
```

## Replace the sample inventory

Edit the data module in `src/data/` to replace the illustrative locations and IPs. The current IPs use documentation-only address ranges and do not identify real data centers or represent actual IP-to-location mappings. Keep that distinction visible if you replace the sample data.

## Publish with GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds the static site and deploys it when changes are pushed to `main`. It sets the Vite base path for either a repository site (`/<repository>/`) or a user/organization site (`/`).

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab.

The build output is `dist/public/` inside this artifact. Map tiles are loaded from OpenStreetMap, so visitors need an internet connection to see the basemap.
