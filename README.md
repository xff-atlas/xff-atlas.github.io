# Forward Atlas

Explore published public IP ranges from AWS, Azure, and Google Cloud. Search by country code, region, provider service tag, CIDR, or IP address, then inspect matching prefixes on the map.

**Live site:** [xff-atlas.github.io](https://xff-atlas.github.io/)

## What it does

- Searches official provider range feeds by location, service tag, CIDR, or IP.
- Matches one IP or a comma-, space-, or semicolon-separated X-Forwarded-For chain to published CIDRs.
- Filters results by cloud provider and IP version, and explores approximate region locations on a map.
- Copies individual or visible CIDR prefixes for use in network tooling.

## Run locally

From the repository root:

```sh
pnpm --filter @workspace/xff-map-explorer run refresh:data
pnpm --filter @workspace/xff-map-explorer run dev
```

See the [map explorer guide](artifacts/xff-map-explorer/README.md) for search behavior, official feed sources, deployment, and data limitations.

## Data and accuracy

The app publishes a static snapshot of official AWS, Azure, and Google Cloud IP range feeds. It does not collect request logs or X-Forwarded-For headers. Matching an IP to a published CIDR does not prove that a request traversed that cloud provider. Country labels are best-effort mappings of known cloud regions; map markers are approximate, and the source feeds do not include county-level locations.