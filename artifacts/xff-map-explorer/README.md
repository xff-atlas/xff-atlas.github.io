# Forward Atlas — Cloud IP Range Explorer

A compact, static map for searching official AWS, Azure, and Google Cloud public IP ranges. Search a CIDR, service, region, single IP, or comma-separated X-Forwarded-For IPs to find published prefixes that contain those addresses.

This app does not collect XFF headers or request logs. Provider feeds describe published network allocations, not observed traffic; region markers show approximate areas, not data-center coordinates.

## Search locations, networks, and service tags

Choose a search scope beside the search field:

- **All** searches region names and codes, broad areas, provider names, service tags, CIDR prefixes, and IP addresses. IP input may contain comma-, space-, or semicolon-separated addresses, such as an X-Forwarded-For chain.
- **Location** searches the mapped country name or ISO 3166-1 alpha-2 code, provider region name/code, and broad area. For example, try `Germany`, `DE`, `Israel`, `IL`, `London`, `North America`, `eastus`, or `eu-west-2`. Recognized two-letter country codes match exactly, so `DE` will not match a place like Delhi.
- **Service** searches provider-published service-tag names, such as `AzureFrontDoor` or `CLOUDFRONT`.
- **Network** searches CIDR prefixes or IP addresses contained by a published prefix.

Provider and IP-version filters work alongside every search scope. Country names/codes are best-effort mappings from known provider region locations, not fields in the feeds; unmapped and global regions have no country badge. The source feeds do not provide county data, and map locations must not be interpreted as precise addresses.

Service tags are identifiers published by each cloud provider, not a shared taxonomy or descriptive product catalog. A tag tooltip shows the raw provider value; this explorer does not infer what a tag means beyond its source label. See the linked official feeds below for provider-specific definitions and current allocations.

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
