# Forward Atlas — Cloud IP Range Explorer

A compact, static map for searching official AWS, Azure, and Google Cloud public IP ranges. Search a CIDR, service, region, single IP, or comma-separated X-Forwarded-For IPs to find published prefixes that contain those addresses.

This app does not collect XFF headers or request logs. Provider feeds describe published network allocations, not observed traffic; region markers show approximate areas, not data-center coordinates.

## Run locally

From the workspace root:

```sh
pnpm --filter @workspace/xff-map-explorer run refresh:data
pnpm --filter @workspace/xff-map-explorer run dev
```

`refresh:data` fetches the current public feeds and writes `public/data/cloud-ranges.json`. It fails if a source cannot be reached or its format is not recognized; it does not silently fall back to example records.

## Official sources

- AWS: [`ip-ranges.json`](https://ip-ranges.amazonaws.com/ip-ranges.json)
- Google Cloud: [`cloud.json`](https://www.gstatic.com/ipranges/cloud.json)
- Azure: the current Service Tags JSON linked from [Microsoft's download page](https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519)

The GitHub Actions workflow refreshes all three sources every six hours, then builds and publishes the updated static snapshot. It also runs on pushes to `main` and can be started manually from the Actions tab. No API key or server is required.

## Publish with GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab.

The workflow sets the Vite base path for a repository site (`/<repository>/`) or a user/organization site (`/`). Its build output is `dist/public/` inside this artifact. Map tiles are loaded from OpenStreetMap, so visitors need an internet connection to see the basemap.
