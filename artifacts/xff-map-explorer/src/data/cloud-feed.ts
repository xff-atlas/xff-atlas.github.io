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
