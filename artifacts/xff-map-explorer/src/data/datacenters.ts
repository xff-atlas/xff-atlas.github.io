export type FacilityStatus = 'operational' | 'degraded' | 'maintenance';

export type DataCenter = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  provider: string;
  status: FacilityStatus;
  latitude: number;
  longitude: number;
  ipv4: string;
  xffChain: string[];
  latencyMs: number;
  trafficGbps: number;
};

// Illustrative-only inventory. All addresses are from RFC 5737 documentation ranges.
export const dataCenters: DataCenter[] = [
  { id: 'iad-01', name: 'Ashburn Edge 01', city: 'Ashburn', country: 'United States', region: 'North America', provider: 'Northstar Networks', status: 'operational', latitude: 39.0438, longitude: -77.4874, ipv4: '192.0.2.41', xffChain: ['192.0.2.41', '198.51.100.14', '203.0.113.8'], latencyMs: 18.4, trafficGbps: 14.7 },
  { id: 'sfo-02', name: 'Bay Area Transit 02', city: 'San Francisco', country: 'United States', region: 'North America', provider: 'Pacific Relay', status: 'operational', latitude: 37.7749, longitude: -122.4194, ipv4: '192.0.2.72', xffChain: ['192.0.2.72', '198.51.100.39', '203.0.113.22'], latencyMs: 24.6, trafficGbps: 8.3 },
  { id: 'yyz-01', name: 'Toronto Core 01', city: 'Toronto', country: 'Canada', region: 'North America', provider: 'Maple IX', status: 'degraded', latitude: 43.6532, longitude: -79.3832, ipv4: '192.0.2.103', xffChain: ['192.0.2.103', '198.51.100.61'], latencyMs: 67.2, trafficGbps: 4.1 },
  { id: 'lhr-01', name: 'London Exchange 01', city: 'London', country: 'United Kingdom', region: 'Europe', provider: 'Meridian Cloud', status: 'operational', latitude: 51.5072, longitude: -0.1276, ipv4: '192.0.2.118', xffChain: ['192.0.2.118', '198.51.100.83', '203.0.113.44'], latencyMs: 31.8, trafficGbps: 11.2 },
  { id: 'fra-03', name: 'Frankfurt Mesh 03', city: 'Frankfurt', country: 'Germany', region: 'Europe', provider: 'EuroLink Systems', status: 'maintenance', latitude: 50.1109, longitude: 8.6821, ipv4: '198.51.100.104', xffChain: ['198.51.100.104', '203.0.113.57'], latencyMs: 42.1, trafficGbps: 0.8 },
  { id: 'ams-02', name: 'Amsterdam Harbor 02', city: 'Amsterdam', country: 'Netherlands', region: 'Europe', provider: 'Meridian Cloud', status: 'operational', latitude: 52.3676, longitude: 4.9041, ipv4: '198.51.100.127', xffChain: ['198.51.100.127', '192.0.2.22', '203.0.113.73'], latencyMs: 28.3, trafficGbps: 9.6 },
  { id: 'sin-01', name: 'Singapore Gateway 01', city: 'Singapore', country: 'Singapore', region: 'Asia Pacific', provider: 'Pacific Relay', status: 'degraded', latitude: 1.3521, longitude: 103.8198, ipv4: '203.0.113.91', xffChain: ['203.0.113.91', '198.51.100.144', '192.0.2.54'], latencyMs: 89.7, trafficGbps: 6.5 },
  { id: 'hnd-02', name: 'Tokyo East 02', city: 'Tokyo', country: 'Japan', region: 'Asia Pacific', provider: 'Kumo Infrastructure', status: 'operational', latitude: 35.6762, longitude: 139.6503, ipv4: '203.0.113.106', xffChain: ['203.0.113.106', '192.0.2.86'], latencyMs: 35.2, trafficGbps: 12.4 },
  { id: 'syd-01', name: 'Sydney Harbor 01', city: 'Sydney', country: 'Australia', region: 'Asia Pacific', provider: 'Southern Cross Data', status: 'operational', latitude: -33.8688, longitude: 151.2093, ipv4: '203.0.113.119', xffChain: ['203.0.113.119', '198.51.100.162'], latencyMs: 56.9, trafficGbps: 5.2 },
  { id: 'gru-01', name: 'São Paulo South 01', city: 'São Paulo', country: 'Brazil', region: 'South America', provider: 'Andes Transit', status: 'operational', latitude: -23.5505, longitude: -46.6333, ipv4: '192.0.2.145', xffChain: ['192.0.2.145', '203.0.113.138', '198.51.100.188'], latencyMs: 73.4, trafficGbps: 3.7 },
  { id: 'jnb-01', name: 'Johannesburg Central 01', city: 'Johannesburg', country: 'South Africa', region: 'Africa', provider: 'Ubuntu Networks', status: 'maintenance', latitude: -26.2041, longitude: 28.0473, ipv4: '198.51.100.203', xffChain: ['198.51.100.203', '192.0.2.164'], latencyMs: 104.8, trafficGbps: 0.3 },
  { id: 'bom-01', name: 'Mumbai West 01', city: 'Mumbai', country: 'India', region: 'Asia Pacific', provider: 'Kumo Infrastructure', status: 'operational', latitude: 19.076, longitude: 72.8777, ipv4: '203.0.113.224', xffChain: ['203.0.113.224', '198.51.100.219', '192.0.2.187'], latencyMs: 61.5, trafficGbps: 7.9 },
];
