import { mkdir, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(here, '../public/data/cloud-ranges.json');
const azureLandingPage =
  'https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519';
const sources = {
  AWS: 'https://ip-ranges.amazonaws.com/ip-ranges.json',
  'Google Cloud': 'https://www.gstatic.com/ipranges/cloud.json',
};

const regionLocations = {
  'us-east-1': ['N. Virginia', 'North America', 38.95, -77.45],
  'us-east-2': ['Ohio', 'North America', 39.96, -83],
  'us-west-1': ['N. California', 'North America', 37.77, -122.42],
  'us-west-2': ['Oregon', 'North America', 45.52, -122.68],
  'us-gov-east-1': ['N. Virginia', 'North America', 38.95, -77.45],
  'us-gov-west-1': ['N. California', 'North America', 37.77, -122.42],
  'ca-central-1': ['Montréal', 'North America', 45.5, -73.57],
  'ca-west-1': ['Calgary', 'North America', 51.05, -114.07],
  'mx-central-1': ['Querétaro', 'North America', 20.59, -100.39],
  'sa-east-1': ['São Paulo', 'South America', -23.55, -46.63],
  'af-south-1': ['Cape Town', 'Africa', -33.92, 18.42],
  'eu-west-1': ['Dublin', 'Europe', 53.35, -6.26],
  'eu-west-2': ['London', 'Europe', 51.51, -0.13],
  'eu-west-3': ['Paris', 'Europe', 48.86, 2.35],
  'eu-central-1': ['Frankfurt', 'Europe', 50.11, 8.68],
  'eu-central-2': ['Zürich', 'Europe', 47.38, 8.54],
  'eu-north-1': ['Stockholm', 'Europe', 59.33, 18.07],
  'eu-south-1': ['Milan', 'Europe', 45.46, 9.19],
  'eu-south-2': ['Aragón', 'Europe', 41.65, -0.88],
  'me-south-1': ['Bahrain', 'Middle East', 26.22, 50.59],
  'me-central-1': ['United Arab Emirates', 'Middle East', 24.45, 54.65],
  'il-central-1': ['Tel Aviv area', 'Middle East', 32.09, 34.78],
  'ap-east-1': ['Hong Kong', 'Asia Pacific', 22.32, 114.17],
  'ap-east-2': ['Taipei', 'Asia Pacific', 25.03, 121.57],
  'ap-northeast-1': ['Tokyo', 'Asia Pacific', 35.68, 139.69],
  'ap-northeast-2': ['Seoul', 'Asia Pacific', 37.57, 126.98],
  'ap-northeast-3': ['Osaka', 'Asia Pacific', 34.69, 135.5],
  'ap-south-1': ['Mumbai', 'Asia Pacific', 19.08, 72.88],
  'ap-south-2': ['Hyderabad', 'Asia Pacific', 17.39, 78.49],
  'ap-southeast-1': ['Singapore', 'Asia Pacific', 1.35, 103.82],
  'ap-southeast-2': ['Sydney', 'Asia Pacific', -33.87, 151.21],
  'ap-southeast-3': ['Jakarta', 'Asia Pacific', -6.21, 106.85],
  'ap-southeast-4': ['Melbourne', 'Asia Pacific', -37.81, 144.96],
  'ap-southeast-5': ['Malaysia', 'Asia Pacific', 3.14, 101.69],
  'ap-southeast-7': ['Bangkok', 'Asia Pacific', 13.76, 100.5],
  'cn-north-1': ['Beijing', 'Asia Pacific', 39.9, 116.41],
  'cn-northwest-1': ['Ningxia', 'Asia Pacific', 38.49, 106.23],

  'us-central1': ['Iowa', 'North America', 41.26, -95.86],
  'us-east1': ['South Carolina', 'North America', 33.02, -80.05],
  'us-east4': ['N. Virginia', 'North America', 39.04, -77.49],
  'us-east5': ['Ohio', 'North America', 39.96, -83],
  'us-south1': ['Dallas', 'North America', 32.78, -96.8],
  'us-west1': ['Oregon', 'North America', 45.83, -119.7],
  'us-west2': ['Los Angeles', 'North America', 34.05, -118.24],
  'us-west3': ['Salt Lake City', 'North America', 40.76, -111.89],
  'us-west4': ['Las Vegas', 'North America', 36.17, -115.14],
  'northamerica-northeast1': ['Montréal', 'North America', 45.5, -73.57],
  'northamerica-northeast2': ['Toronto', 'North America', 43.65, -79.38],
  'southamerica-east1': ['São Paulo', 'South America', -23.55, -46.63],
  'southamerica-west1': ['Santiago', 'South America', -33.45, -70.67],
  'europe-west1': ['Belgium', 'Europe', 50.45, 3.82],
  'europe-west2': ['London', 'Europe', 51.51, -0.13],
  'europe-west3': ['Frankfurt', 'Europe', 50.11, 8.68],
  'europe-west4': ['Netherlands', 'Europe', 53.39, 6.87],
  'europe-west6': ['Zürich', 'Europe', 47.38, 8.54],
  'europe-west8': ['Milan', 'Europe', 45.46, 9.19],
  'europe-west9': ['Paris', 'Europe', 48.86, 2.35],
  'europe-west10': ['Berlin', 'Europe', 52.52, 13.4],
  'europe-west12': ['Turin', 'Europe', 45.07, 7.69],
  'europe-north1': ['Finland', 'Europe', 60.57, 27.2],
  'europe-north2': ['Stockholm', 'Europe', 60.67, 17.14],
  'europe-southwest1': ['Madrid', 'Europe', 40.42, -3.7],
  'africa-south1': ['Johannesburg', 'Africa', -26.2, 28.05],
  'asia-east1': ['Taiwan', 'Asia Pacific', 24.07, 120.56],
  'asia-east2': ['Hong Kong', 'Asia Pacific', 22.32, 114.17],
  'asia-northeast1': ['Tokyo', 'Asia Pacific', 35.68, 139.69],
  'asia-northeast2': ['Osaka', 'Asia Pacific', 34.69, 135.5],
  'asia-northeast3': ['Seoul', 'Asia Pacific', 37.57, 126.98],
  'asia-south1': ['Mumbai', 'Asia Pacific', 19.08, 72.88],
  'asia-south2': ['Delhi', 'Asia Pacific', 28.61, 77.21],
  'asia-southeast1': ['Singapore', 'Asia Pacific', 1.35, 103.82],
  'asia-southeast2': ['Jakarta', 'Asia Pacific', -6.21, 106.85],
  'asia-southeast3': ['Bangkok', 'Asia Pacific', 13.76, 100.5],
  'australia-southeast1': ['Sydney', 'Asia Pacific', -33.87, 151.21],
  'australia-southeast2': ['Melbourne', 'Asia Pacific', -37.81, 144.96],
  'me-central1': ['Doha', 'Middle East', 25.29, 51.53],
  'me-central2': ['Dammam', 'Middle East', 26.42, 50.1],
  'me-west1': ['Tel Aviv area', 'Middle East', 32.09, 34.78],

  eastus: ['Virginia', 'North America', 37.37, -79.82],
  eastus2: ['Virginia', 'North America', 38.95, -77.45],
  centralus: ['Iowa', 'North America', 41.26, -95.86],
  northcentralus: ['Illinois', 'North America', 41.88, -87.63],
  southcentralus: ['Texas', 'North America', 29.42, -98.49],
  westcentralus: ['Wyoming', 'North America', 42.87, -106.31],
  westus: ['California', 'North America', 37.77, -122.42],
  westus2: ['Washington', 'North America', 47.61, -122.33],
  westus3: ['Arizona', 'North America', 33.45, -112.07],
  canadacentral: ['Toronto', 'North America', 43.65, -79.38],
  canadaeast: ['Québec', 'North America', 46.81, -71.21],
  brazilsouth: ['São Paulo', 'South America', -23.55, -46.63],
  brazilsoutheast: ['Rio de Janeiro', 'South America', -22.91, -43.17],
  northeurope: ['Dublin', 'Europe', 53.35, -6.26],
  westeurope: ['Amsterdam', 'Europe', 52.37, 4.9],
  uksouth: ['London', 'Europe', 51.51, -0.13],
  ukwest: ['Cardiff', 'Europe', 51.48, -3.18],
  francecentral: ['Paris', 'Europe', 48.86, 2.35],
  francesouth: ['Marseille', 'Europe', 43.3, 5.37],
  germanywestcentral: ['Frankfurt', 'Europe', 50.11, 8.68],
  switzerlandnorth: ['Zürich', 'Europe', 47.38, 8.54],
  switzerlandwest: ['Geneva', 'Europe', 46.2, 6.14],
  norwayeast: ['Oslo', 'Europe', 59.91, 10.75],
  norwaywest: ['Stavanger', 'Europe', 58.97, 5.73],
  swedencentral: ['Gävle', 'Europe', 60.67, 17.14],
  polandcentral: ['Warsaw', 'Europe', 52.23, 21.01],
  italynorth: ['Milan', 'Europe', 45.46, 9.19],
  spaincentral: ['Madrid', 'Europe', 40.42, -3.7],
  uaenorth: ['Dubai', 'Middle East', 25.2, 55.27],
  uaecentral: ['Abu Dhabi', 'Middle East', 24.45, 54.65],
  qatarcentral: ['Doha', 'Middle East', 25.29, 51.53],
  israelcentral: ['Tel Aviv area', 'Middle East', 32.09, 34.78],
  southafricanorth: ['Johannesburg', 'Africa', -26.2, 28.05],
  southafricawest: ['Cape Town', 'Africa', -33.92, 18.42],
  australiaeast: ['Sydney', 'Asia Pacific', -33.87, 151.21],
  australiasoutheast: ['Melbourne', 'Asia Pacific', -37.81, 144.96],
  australiacentral: ['Canberra', 'Asia Pacific', -35.28, 149.13],
  australiacentral2: ['Canberra', 'Asia Pacific', -35.28, 149.13],
  southeastasia: ['Singapore', 'Asia Pacific', 1.35, 103.82],
  eastasia: ['Hong Kong', 'Asia Pacific', 22.32, 114.17],
  japaneast: ['Tokyo', 'Asia Pacific', 35.68, 139.69],
  japanwest: ['Osaka', 'Asia Pacific', 34.69, 135.5],
  koreacentral: ['Seoul', 'Asia Pacific', 37.57, 126.98],
  koreasouth: ['Busan', 'Asia Pacific', 35.18, 129.08],
  centralindia: ['Pune', 'Asia Pacific', 18.52, 73.86],
  southindia: ['Chennai', 'Asia Pacific', 13.08, 80.27],
  westindia: ['Mumbai', 'Asia Pacific', 19.08, 72.88],
  jioindiacentral: ['Nagpur', 'Asia Pacific', 21.15, 79.09],
  jioindiawest: ['Mumbai', 'Asia Pacific', 19.08, 72.88],
};

function requireObject(value, sourceName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${sourceName} did not return a JSON object.`);
  }
  return value;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return requireObject(await response.json(), url);
}

function parseCidr(value) {
  if (typeof value !== 'string') return null;
  const [address, prefix, extra] = value.split('/');
  const version = isIP(address);
  if (extra !== undefined || version === 0) return null;
  const prefixLength = Number(prefix);
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > (version === 4 ? 32 : 128)) {
    return null;
  }
  return { cidr: `${address}/${prefixLength}`, family: version === 4 ? 'IPv4' : 'IPv6' };
}

const rangeMap = new Map();

function addRange(provider, regionCode, service, value) {
  const parsed = parseCidr(value);
  if (!parsed) return;
  const normalizedRegion = (regionCode || 'global').trim().toLowerCase() || 'global';
  const key = `${provider}|${normalizedRegion}|${parsed.cidr}`;
  let record = rangeMap.get(key);
  if (!record) {
    record = {
      provider,
      regionCode: normalizedRegion,
      cidr: parsed.cidr,
      family: parsed.family,
      services: new Set(),
    };
    rangeMap.set(key, record);
  }
  if (service) record.services.add(service);
}

function dateFromAzureUrl(url) {
  const match = url.match(/ServiceTags_Public_(\d{4})(\d{2})(\d{2})\.json/i);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

async function fetchAzureFeed() {
  const response = await fetch(azureLandingPage, {
    headers: { accept: 'text/html' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Microsoft download page returned HTTP ${response.status}.`);
  const html = await response.text();
  const match = html.match(
    /https:\/\/download\.microsoft\.com\/download\/[^"'<>\\s]+?ServiceTags_Public_\d{8}\.json/i,
  );
  if (!match) throw new Error('Could not find the current Azure public IP feed download link.');
  const download = new URL(match[0]);
  if (download.hostname !== 'download.microsoft.com') {
    throw new Error('Microsoft download page returned an unexpected feed host.');
  }
  return {
    url: download.href,
    updatedAt: dateFromAzureUrl(download.href),
    data: await fetchJson(download.href),
  };
}

function addAwsRecords(data) {
  if (!Array.isArray(data.prefixes) || !Array.isArray(data.ipv6_prefixes)) {
    throw new Error('AWS IP ranges feed is missing its expected prefix arrays.');
  }
  for (const item of data.prefixes) {
    addRange('AWS', item.region || item.network_border_group, item.service, item.ip_prefix);
  }
  for (const item of data.ipv6_prefixes) {
    addRange('AWS', item.region || item.network_border_group, item.service, item.ipv6_prefix);
  }
}

function addGoogleRecords(data) {
  if (!Array.isArray(data.prefixes)) throw new Error('Google Cloud feed is missing its prefixes array.');
  for (const item of data.prefixes) {
    addRange('Google Cloud', item.scope, item.service, item.ipv4Prefix || item.ipv6Prefix);
  }
}

function addAzureRecords(data) {
  if (!Array.isArray(data.values)) throw new Error('Azure feed is missing its service-tag values array.');
  for (const tag of data.values) {
    const properties = tag.properties || {};
    if (!Array.isArray(properties.addressPrefixes)) continue;
    for (const cidr of properties.addressPrefixes) {
      addRange('Azure', properties.region || 'global', tag.name, cidr);
    }
  }
}

function regionName(code) {
  if (code === 'global') return 'Global / cloud-wide';
  const location = regionLocations[code];
  if (location) return location[0];
  return code.toUpperCase();
}

function regionSummary(provider, code, ranges) {
  const location = code === 'global' ? null : regionLocations[code];
  return {
    id: `${provider.toLowerCase().replaceAll(' ', '-')}:${code}`,
    provider,
    code,
    name: regionName(code),
    area: location?.[1] || (code === 'global' ? 'Global' : 'Other'),
    latitude: location?.[2] ?? null,
    longitude: location?.[3] ?? null,
    rangeCount: ranges.length,
    ipv4Count: ranges.filter((range) => range.family === 'IPv4').length,
    ipv6Count: ranges.filter((range) => range.family === 'IPv6').length,
    serviceCount: new Set(ranges.flatMap((range) => [...range.services])).size,
  };
}

const [aws, google, azure] = await Promise.all([
  fetchJson(sources.AWS),
  fetchJson(sources['Google Cloud']),
  fetchAzureFeed(),
]);

addAwsRecords(aws);
addGoogleRecords(google);
addAzureRecords(azure.data);

if (rangeMap.size === 0) throw new Error('No valid IP ranges were found in the official feeds.');

const ranges = [...rangeMap.values()]
  .map((range) => ({ ...range, services: [...range.services].sort() }))
  .sort((a, b) =>
    a.provider.localeCompare(b.provider) ||
    a.regionCode.localeCompare(b.regionCode) ||
    a.cidr.localeCompare(b.cidr),
  );
const grouped = new Map();
for (const range of ranges) {
  const key = `${range.provider}|${range.regionCode}`;
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(range);
}

const feed = {
  schemaVersion: 1,
  fetchedAt: new Date().toISOString(),
  sources: [
    {
      provider: 'AWS',
      url: sources.AWS,
      updatedAt: aws.createDate || null,
    },
    {
      provider: 'Google Cloud',
      url: sources['Google Cloud'],
      updatedAt: google.creationTime || null,
    },
    {
      provider: 'Azure',
      url: azure.url,
      updatedAt: azure.updatedAt,
    },
  ],
  regions: [...grouped.entries()]
    .map(([key, values]) => {
      const [provider, code] = key.split('|');
      return regionSummary(provider, code, values);
    })
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name)),
  ranges,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(feed)}\n`, 'utf8');

console.info(
  `Wrote ${ranges.length.toLocaleString()} unique ranges across ${feed.regions.length} provider regions to ${outputPath}`,
);
