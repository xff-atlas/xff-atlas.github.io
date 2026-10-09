export type CloudProvider = 'AWS' | 'Azure' | 'Google Cloud';
export type AddressFamily = 'IPv4' | 'IPv6';

export interface CloudRange {
  provider: CloudProvider;
  regionCode: string;
  cidr: string;
  family: AddressFamily;
  services: string[];
}

export interface CloudRegion {
  id: string;
  provider: CloudProvider;
  code: string;
  name: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  rangeCount: number;
  ipv4Count: number;
  ipv6Count: number;
  serviceCount: number;
}

const countryCodeByPlace: Record<string, string> = {
  'n. virginia': 'US', Ohio: 'US', 'n. california': 'US', Oregon: 'US', Iowa: 'US',
  'south carolina': 'US', Dallas: 'US', 'los angeles': 'US', 'salt lake city': 'US',
  'las vegas': 'US', Virginia: 'US', Illinois: 'US', Texas: 'US', Wyoming: 'US',
  California: 'US', Washington: 'US', Arizona: 'US',
  Montréal: 'CA', Calgary: 'CA', Toronto: 'CA', Québec: 'CA',
  Querétaro: 'MX', 'São Paulo': 'BR', 'Rio de Janeiro': 'BR', Santiago: 'CL',
  'Cape Town': 'ZA', Johannesburg: 'ZA', Dublin: 'IE', London: 'GB', Cardiff: 'GB',
  Paris: 'FR', Marseille: 'FR', Frankfurt: 'DE', Berlin: 'DE', Zürich: 'CH', Geneva: 'CH',
  Stockholm: 'SE', Gävle: 'SE', Milan: 'IT', Turin: 'IT', Aragón: 'ES', Madrid: 'ES',
  Bahrain: 'BH', 'United Arab Emirates': 'AE', Dubai: 'AE', 'Abu Dhabi': 'AE',
  'Tel Aviv area': 'IL', 'Hong Kong': 'HK', Taipei: 'TW', Taiwan: 'TW', Tokyo: 'JP',
  Osaka: 'JP', Seoul: 'KR', Busan: 'KR', Mumbai: 'IN', Hyderabad: 'IN', Delhi: 'IN',
  Pune: 'IN', Chennai: 'IN', Nagpur: 'IN', Singapore: 'SG', Sydney: 'AU', Melbourne: 'AU',
  Canberra: 'AU', Jakarta: 'ID', Malaysia: 'MY', Bangkok: 'TH', Beijing: 'CN', Ningxia: 'CN',
  Belgium: 'BE', Netherlands: 'NL', Amsterdam: 'NL', Finland: 'FI', Doha: 'QA', Dammam: 'SA',
  Oslo: 'NO', Stavanger: 'NO', Warsaw: 'PL',
};

const countryCodeByRegion: Record<string, string> = {
  'AWS:eusc-de-east-1': 'DE',
  'AWS:eu-central-1': 'DE',
  'Google Cloud:europe-west3': 'DE',
  'Google Cloud:europe-west10': 'DE',
  'Azure:germanywestcentral': 'DE',
  'AWS:il-central-1': 'IL',
  'Google Cloud:me-west1': 'IL',
  'Azure:israelcentral': 'IL',
};

const normalizedCountryCodeByPlace = Object.fromEntries(
  Object.entries(countryCodeByPlace).map(([place, code]) => [place.toLowerCase(), code]),
);
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const supportedCountryCodes = new Set([
  ...Object.values(countryCodeByPlace),
  ...Object.values(countryCodeByRegion),
]);

export function getRegionCountry(region: Pick<CloudRegion, 'provider' | 'code' | 'name'>) {
  const code = countryCodeByRegion[`${region.provider}:${region.code}`] ?? normalizedCountryCodeByPlace[region.name.toLowerCase()];
  if (!code) return null;
  return { code, name: countryNames.of(code) ?? code };
}

export interface FeedSource {
  provider: CloudProvider;
  url: string;
  updatedAt: string | null;
}

export interface CloudFeed {
  schemaVersion: 1;
  fetchedAt: string;
  sources: FeedSource[];
  regions: CloudRegion[];
  ranges: CloudRange[];
}
