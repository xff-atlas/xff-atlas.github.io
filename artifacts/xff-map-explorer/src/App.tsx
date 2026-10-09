import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import ipaddr from 'ipaddr.js';
import 'leaflet/dist/leaflet.css';
import {
  ArrowDownToLine,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Server,
  X,
} from 'lucide-react';
import { getRegionCountry, supportedCountryCodes } from './data/cloud-feed';
import type { AddressFamily, CloudFeed, CloudProvider, CloudRange, CloudRegion } from './data/cloud-feed';

const BASE_CENTER: [number, number] = [22, 8];
const BASE_ZOOM = 1.5;
const providers: Array<'All providers' | CloudProvider> = ['All providers', 'AWS', 'Azure', 'Google Cloud'];
const families: Array<'All IP versions' | AddressFamily> = ['All IP versions', 'IPv4', 'IPv6'];
const areas = ['All areas', 'Africa', 'Asia Pacific', 'Europe', 'Middle East', 'North America', 'South America', 'Other', 'Global'];
const searchScopes = ['All', 'Location', 'Service', 'Network'] as const;
type SearchScope = (typeof searchScopes)[number];
const regionSortModes = ['Provider', 'Count', 'Name'] as const;
type RegionSortMode = (typeof regionSortModes)[number];
const providerColor: Record<CloudProvider, string> = {
  AWS: '#d98427',
  Azure: '#2875b7',
  'Google Cloud': '#438a69',
};
const providerShort: Record<CloudProvider, string> = {
  AWS: 'AWS',
  Azure: 'AZ',
  'Google Cloud': 'GCP',
};

function regionId(provider: CloudProvider, code: string) {
  return `${provider.toLowerCase().replaceAll(' ', '-')}:${code}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatCoordinates(latitude: number, longitude: number) {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(2)}°${latDirection}, ${Math.abs(longitude).toFixed(2)}°${lonDirection}`;
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return 'Not reported';
  const awsDate = value.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})$/);
  const normalized = awsDate
    ? `${awsDate[1]}T${awsDate[2]}:${awsDate[3]}:${awsDate[4]}Z`
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00Z`
      : value.includes('T') && !/(Z|[+-]\d{2}:\d{2})$/.test(value)
        ? `${value}Z`
        : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const dateOptions: Intl.DateTimeFormatOptions = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
    : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(undefined, dateOptions).format(date);
}

function getIpTerms(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((term) => term.replace(/^[\["']|[\]"']$/g, ''))
    .filter((term) => ipaddr.isValid(term));
}

function addressMatchesRange(addressValue: string, cidr: string) {
  try {
    const address = ipaddr.parse(addressValue);
    const network = ipaddr.parseCIDR(cidr);
    if (address.kind() === network[0].kind()) return address.match(network);
    if ('toIPv4Address' in address && network[0].kind() === 'ipv4' && address.isIPv4MappedAddress()) {
      return address.toIPv4Address().match(network);
    }
    return false;
  } catch {
    return false;
  }
}

function regionMatchesLocation(region: CloudRegion, text: string) {
  const country = getRegionCountry(region);
  if (isCountryCodeQuery(text)) {
    return country?.code === text.toUpperCase();
  }
  return `${region.name} ${region.code} ${region.area} ${country?.name ?? ''} ${country?.code ?? ''}`
    .toLowerCase()
    .includes(text);
}

function regionMatchesAllFields(region: CloudRegion, text: string) {
  const country = getRegionCountry(region);
  if (isCountryCodeQuery(text)) {
    return country?.code === text.toUpperCase();
  }
  return `${region.name} ${region.code} ${region.provider} ${region.area} ${country?.name ?? ''} ${country?.code ?? ''}`
    .toLowerCase()
    .includes(text);
}

function isCountryCodeQuery(text: string) {
  return text.length === 2 && supportedCountryCodes.has(text.toUpperCase());
}

function rangeMatchesSearch(range: CloudRange, text: string, scope: SearchScope, queryIps: string[]) {
  if (scope === 'Network' || (scope === 'All' && queryIps.length > 0)) {
    return queryIps.length
      ? queryIps.some((ip) => addressMatchesRange(ip, range.cidr))
      : range.cidr.toLowerCase().includes(text);
  }
  if (scope === 'Service') return range.services.some((service) => service.toLowerCase().includes(text));
  return range.cidr.toLowerCase().includes(text) ||
    range.services.some((service) => service.toLowerCase().includes(text));
}

function providerForBadge(provider: CloudProvider) {
  return `provider-${providerShort[provider].toLowerCase()}`;
}

function MapViewport({ selected, resetKey }: { selected: CloudRegion | null; resetKey: number }) {
  const map = useMap();
  const lastResetKey = useRef(resetKey);
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);
    map.invalidateSize({ pan: false });
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (resetKey !== lastResetKey.current) {
      lastResetKey.current = resetKey;
      map.flyTo(BASE_CENTER, BASE_ZOOM, { duration: 0.5 });
      return;
    }
    if (selected?.latitude === null || selected?.latitude === undefined || selected.longitude === null) return;
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 4), { duration: 0.55 });
  }, [map, selected?.id, resetKey]);
  return null;
}

function MapControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  return (
    <div className="map-controls" aria-label="Map controls">
      <button type="button" aria-label="Zoom in" data-testid="button-map-zoom-in" onClick={() => map.zoomIn()}>
        <Plus size={14} />
      </button>
      <button type="button" aria-label="Zoom out" data-testid="button-map-zoom-out" onClick={() => map.zoomOut()}>
        <Minus size={14} />
      </button>
      <button type="button" aria-label="Reset map view" data-testid="button-map-reset" onClick={onReset}>
        <LocateFixed size={13} />
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="load-screen" data-testid="status-loading">
      <div className="load-card">
        <div className="load-mark"><Cloud size={20} /></div>
        <div className="load-title">Loading published cloud ranges</div>
        <div className="load-copy">Reading the latest static feed snapshot.</div>
        <div className="load-bar"><span /></div>
      </div>
    </main>
  );
}

function App() {
  const [feed, setFeed] = useState<CloudFeed | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('All');
  const [providerFilter, setProviderFilter] = useState<(typeof providers)[number]>('All providers');
  const [familyFilter, setFamilyFilter] = useState<(typeof families)[number]>('All IP versions');
  const [areaFilter, setAreaFilter] = useState('All areas');
  const [regionSort, setRegionSort] = useState<RegionSortMode>('Provider');
  const [selectedId, setSelectedId] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [rangeLimit, setRangeLimit] = useState(36);
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    fetch(`${import.meta.env.BASE_URL}data/cloud-ranges.json`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`The cloud feed snapshot returned HTTP ${response.status}.`);
        const parsed = (await response.json()) as CloudFeed;
        if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.ranges) || !Array.isArray(parsed.regions)) {
          throw new Error('The cloud feed snapshot has an unsupported format.');
        }
        setFeed(parsed);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Could not load the cloud feed snapshot.');
      });
    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 180);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const rangesByRegion = useMemo(() => {
    const grouped = new Map<string, CloudRange[]>();
    for (const range of feed?.ranges ?? []) {
      const key = regionId(range.provider, range.regionCode);
      const values = grouped.get(key) ?? [];
      values.push(range);
      grouped.set(key, values);
    }
    return grouped;
  }, [feed]);

  const queryIps = useMemo(() => getIpTerms(search), [search]);
  const filteredRegions = useMemo(() => {
    const text = search;
    return (feed?.regions ?? [])
      .filter((region) => {
      if (providerFilter !== 'All providers' && region.provider !== providerFilter) return false;
      if (areaFilter !== 'All areas' && region.area !== areaFilter) return false;
      if (familyFilter === 'IPv4' && region.ipv4Count === 0) return false;
      if (familyFilter === 'IPv6' && region.ipv6Count === 0) return false;
      if (!text) return true;

      const ranges = rangesByRegion.get(region.id) ?? [];
      const matchingRanges = ranges.filter(
        (range) => familyFilter === 'All IP versions' || range.family === familyFilter,
      );
      if (searchScope === 'All' && isCountryCodeQuery(text)) return regionMatchesAllFields(region, text);
      if (searchScope === 'Location') return regionMatchesLocation(region, text);
      if (searchScope === 'Service' || searchScope === 'Network') {
        return matchingRanges.some((range) => rangeMatchesSearch(range, text, searchScope, queryIps));
      }
      if (queryIps.length) {
        return matchingRanges.some((range) => rangeMatchesSearch(range, text, 'Network', queryIps));
      }
      return regionMatchesAllFields(region, text) ||
        matchingRanges.some((range) => rangeMatchesSearch(range, text, 'All', queryIps));
      })
      .sort((a, b) => {
        if (regionSort === 'Count') return b.rangeCount - a.rangeCount || a.provider.localeCompare(b.provider);
        if (regionSort === 'Name') return a.name.localeCompare(b.name) || a.provider.localeCompare(b.provider);
        return Number(a.latitude === null) - Number(b.latitude === null) ||
          a.provider.localeCompare(b.provider) ||
          a.name.localeCompare(b.name);
      });
  }, [feed, search, searchScope, providerFilter, familyFilter, areaFilter, queryIps, rangesByRegion, regionSort]);

  const selectedRegion =
    filteredRegions.find((region) => region.id === selectedId) ?? filteredRegions[0] ?? null;
  const selectedRanges = useMemo(() => {
    if (!selectedRegion) return [];
    let values = rangesByRegion.get(selectedRegion.id) ?? [];
    if (familyFilter !== 'All IP versions') {
      values = values.filter((range) => range.family === familyFilter);
    }
    if (!search) return values;
    if (searchScope === 'Location') return values;
    if (searchScope === 'All' && !queryIps.length && regionMatchesAllFields(selectedRegion, search)) return values;
    return values.filter((range) => rangeMatchesSearch(range, search, searchScope, queryIps));
  }, [selectedRegion, rangesByRegion, familyFilter, search, searchScope, queryIps]);

  const selectedServiceTags = useMemo(() => {
    if (!selectedRegion) return [];
    const ranges = rangesByRegion.get(selectedRegion.id) ?? [];
    return [...new Set(ranges
      .filter((range) => familyFilter === 'All IP versions' || range.family === familyFilter)
      .flatMap((range) => range.services))]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 12);
  }, [selectedRegion?.id, rangesByRegion, familyFilter]);

  const providerRangeCounts = useMemo(() => {
    const counts = new Map<CloudProvider, number>([['AWS', 0], ['Azure', 0], ['Google Cloud', 0]]);
    for (const range of feed?.ranges ?? []) counts.set(range.provider, (counts.get(range.provider) ?? 0) + 1);
    return counts;
  }, [feed]);

  useEffect(() => {
    if (selectedRegion && selectedRegion.id !== selectedId) setSelectedId(selectedRegion.id);
  }, [selectedRegion?.id, selectedId]);

  useEffect(() => {
    setRangeLimit(36);
  }, [selectedRegion?.id, search, searchScope, familyFilter]);

  const visibleRanges = selectedRanges.slice(0, rangeLimit);
  const displayedRangeCount = filteredRegions.reduce((sum, region) => {
    if (familyFilter === 'IPv4') return sum + region.ipv4Count;
    if (familyFilter === 'IPv6') return sum + region.ipv6Count;
    return sum + region.rangeCount;
  }, 0);

  const copyValue = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(key);
      window.setTimeout(() => setCopyState(''), 1500);
    } catch {
      setCopyState('unavailable');
      window.setTimeout(() => setCopyState(''), 1800);
    }
  };

  const exportSelectedRanges = () => {
    if (!selectedRegion || !feed) return;
    const payload = JSON.stringify({ schemaVersion: feed.schemaVersion, fetchedAt: feed.fetchedAt, region: selectedRegion, ranges: selectedRanges }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedRegion.code.replaceAll(/[^a-z0-9-]/gi, '-')}-ranges.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const resetMap = () => setResetKey((value) => value + 1);

  if (!feed && loadError) {
    return (
      <main className="load-screen" data-testid="status-load-error">
        <div className="load-card error-card">
          <div className="load-mark"><Cloud size={20} /></div>
          <div className="load-title">Cloud range snapshot unavailable</div>
          <div className="load-copy">{loadError}</div>
          <button type="button" className="button-primary" data-testid="button-retry-feed" onClick={() => setReloadToken((value) => value + 1)}>
            Retry snapshot
          </button>
        </div>
      </main>
    );
  }
  if (!feed) return <LoadingScreen />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><ArrowDownToLine size={16} /></div>
          <div className="brand-copy">
            <div className="brand-title">Forward Atlas</div>
            <div className="brand-subtitle">Cloud IP range explorer</div>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="refresh-pill"><span className="refresh-dot" /> ACTIONS SYNC · 6H</span>
          <span className="snapshot-time" data-testid="text-snapshot-time">
            Snapshot {formatTimestamp(feed.fetchedAt)}
          </span>
        </div>
        <div className="topbar-end">
          <div className="topbar-counts" aria-label="Feed totals">
            <span><strong>{formatNumber(feed.regions.length)}</strong> regions</span>
            <i />
            <span><strong>{formatNumber(feed.ranges.length)}</strong> prefixes</span>
            <i />
            <span><strong>{feed.sources.length}</strong> feeds</span>
          </div>
          <nav className="topbar-nav" aria-label="Explorer sections">
            <a href="#explorer" aria-current="page"><Radar size={12} /> Explorer</a>
            <a href="#data-sources" aria-label="Feed sources" title="Feed sources"><Cloud size={12} /><span>Feeds</span></a>
          </nav>
          <div className="topbar-actions">
            <button type="button" aria-label="Export selected region ranges as JSON" title="Export selected region ranges as JSON" disabled={!selectedRegion} onClick={exportSelectedRanges}>
              <Download size={13} />
            </button>
            <button type="button" aria-label="Reload feed snapshot" title="Reload feed snapshot" onClick={() => setReloadToken((value) => value + 1)}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </header>

      <main className="workspace" id="explorer">
        <section className="workspace-heading">
          <div className="heading-copy">
            <div className="eyebrow"><Globe2 size={12} /> PROVIDER NETWORKS <ChevronRight size={11} /> PUBLISHED RANGES</div>
            <h1>Cloud range atlas</h1>
          </div>
        </section>

        <section className="search-toolbar" aria-label="Search and filter cloud ranges">
          <label className="searchbox">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search cloud locations and ISO country codes, service tags, IP addresses, or CIDR prefixes"
              data-testid="input-search"
              placeholder="Search DE, IL, place, region, service tag, IP, or CIDR…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput && <button type="button" className="clear-search" aria-label="Clear search" data-testid="button-clear-search" onClick={() => setSearchInput('')}><X size={14} /></button>}
          </label>
          <div className="search-scopes" role="group" aria-label="Search within">
            {searchScopes.map((scope) => (
              <button
                type="button"
                key={scope}
                aria-pressed={searchScope === scope}
                title={`Search ${scope === 'All' ? 'all fields' : `${scope.toLowerCase()}s only`}`}
                onClick={() => setSearchScope(scope)}
              >
                {scope}
              </button>
            ))}
          </div>
          <select aria-label="Filter by provider" data-testid="select-provider" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value as (typeof providers)[number])}>
            {providers.map((provider) => <option value={provider} key={provider}>{provider}</option>)}
          </select>
          <div className="family-scopes" role="group" aria-label="Filter by IP version" data-testid="select-family">
            {families.map((family) => (
              <button type="button" key={family} aria-pressed={familyFilter === family} onClick={() => setFamilyFilter(family)}>
                {family === 'All IP versions' ? 'ALL' : family}
              </button>
            ))}
          </div>
          <select aria-label="Filter by broad area" data-testid="select-area" value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
            {areas.map((area) => <option value={area} key={area}>{area}</option>)}
          </select>
          <button type="button" className="reset-button" data-testid="button-reset-filters" onClick={() => { setSearchInput(''); setSearchScope('All'); setProviderFilter('All providers'); setFamilyFilter('All IP versions'); setAreaFilter('All areas'); resetMap(); }}>
            Reset
          </button>
        </section>

        <div className="status-strip" role="status">
          <span className="status-live"><i /> STATIC FEED SNAPSHOT</span>
          <span>{feed.sources.length} official providers · updated {formatTimestamp(feed.fetchedAt)}</span>
          {selectedRegion?.latitude !== null && selectedRegion?.latitude !== undefined && selectedRegion.longitude !== null && (
            <span className="status-coordinates"><MapPin size={11} /> {formatCoordinates(selectedRegion.latitude, selectedRegion.longitude)}</span>
          )}
          <span className="status-results">{formatNumber(filteredRegions.length)} locations · {formatNumber(displayedRangeCount)} prefixes</span>
        </div>

        <section className="map-layout">
          <aside className="region-dock" aria-label="Cloud region results">
            <div className="dock-heading">
              <div><div className="dock-title">Region registry</div><div className="dock-subtitle">{formatNumber(filteredRegions.length)} matches · {formatNumber(displayedRangeCount)} prefixes</div></div>
              <span className="dock-count" data-testid="text-filtered-regions">{filteredRegions.length}</span>
            </div>
            <div className="region-sort" role="group" aria-label="Sort regions">
              <span>SORT</span>
              {regionSortModes.map((mode) => (
                <button type="button" key={mode} aria-pressed={regionSort === mode} onClick={() => setRegionSort(mode)}>
                  {mode === 'Count' ? 'COUNT' : mode === 'Name' ? 'NAME' : 'CLOUD'}
                </button>
              ))}
            </div>
            <div className="region-list" aria-label="Filtered cloud regions" data-testid="list-cloud-regions">
              {filteredRegions.length ? filteredRegions.map((region) => (
                <button
                  className={`region-row ${region.id === selectedRegion?.id ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={region.id === selectedRegion?.id}
                  key={region.id}
                  data-testid={`button-region-${region.id}`}
                  onClick={() => setSelectedId(region.id)}
                >
                  <span className="provider-mark" style={{ backgroundColor: providerColor[region.provider] }}>{providerShort[region.provider]}</span>
                  <span className="region-row-copy">
                    <span className="region-row-title">{region.name}</span>
                    <span className="region-row-code">
                      {getRegionCountry(region) && <span className="country-code-tag">{getRegionCountry(region)?.code}</span>}
                      {region.area} · {region.code} · {region.provider}
                    </span>
                  </span>
                  <span className="region-row-count">{formatNumber(region.rangeCount)}</span>
                </button>
              )) : (
                <div className="empty-state" data-testid="empty-search-results">
                  <Search size={18} />
                  <strong>No published range matches</strong>
                  <p>Try another location, service tag, IP, prefix, or filter.</p>
                </div>
              )}
            </div>
            <div className="dock-foot"><span className="tiny-dot" /> Official published allocations</div>
          </aside>

          <div className="map-stage" aria-label="Cloud region map">
            <MapContainer className="map-canvas" center={BASE_CENTER} zoom={BASE_ZOOM} minZoom={1} maxZoom={12} zoomSnap={0.25} scrollWheelZoom keyboard zoomControl={false} worldCopyJump>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredRegions.map((region) => {
                if (region.latitude === null || region.longitude === null) return null;
                const country = getRegionCountry(region);
                const selected = region.id === selectedRegion?.id;
                return (
                  <CircleMarker
                    key={region.id}
                    center={[region.latitude, region.longitude]}
                    radius={selected ? 8 : Math.min(7, 3.5 + Math.log10(region.rangeCount + 1))}
                    pathOptions={{
                      color: selected ? '#00dfb0' : '#ffffff',
                      weight: selected ? 3 : 1.5,
                      fillColor: providerColor[region.provider],
                      fillOpacity: selected ? 1 : 0.84,
                    }}
                    eventHandlers={{ click: () => setSelectedId(region.id) }}
                  >
                    <Tooltip direction="top" offset={[0, -5]}>
                      <strong>{region.name}</strong><br />{country ? `${country.name} (${country.code})` : 'Country not mapped'}<br />{providerShort[region.provider]} · {region.code}<br />{formatNumber(region.rangeCount)} ranges
                    </Tooltip>
                  </CircleMarker>
                );
              })}
              <MapViewport selected={selectedRegion} resetKey={resetKey} />
              <MapControls onReset={resetMap} />
            </MapContainer>
            <div className="map-top-label"><span>RADAR-01</span><i />{selectedRegion?.name ?? 'GLOBAL VIEW'}<i />{formatNumber(filteredRegions.filter((region) => region.latitude !== null).length)} MAPPED</div>
            <div className="map-legend" aria-label="Provider legend">
              {(['AWS', 'Azure', 'Google Cloud'] as CloudProvider[]).map((provider) => (
                <span className="legend-item" key={provider}><i style={{ backgroundColor: providerColor[provider] }} />{providerShort[provider]} ({formatNumber(providerRangeCounts.get(provider) ?? 0)})</span>
              ))}
            </div>
          </div>

          <aside className="detail-panel" aria-label="Selected cloud region details">
            {selectedRegion ? (
              <>
                <div className="detail-overview">
                  <div className="detail-kicker">
                    <span className={`provider-tag ${providerForBadge(selectedRegion.provider)}`}>{selectedRegion.provider}</span>
                    <span className="region-code">{getRegionCountry(selectedRegion)?.code ? `${getRegionCountry(selectedRegion)?.code} · ` : ''}{selectedRegion.code}</span>
                  </div>
                  <h2 data-testid="text-selected-region">{selectedRegion.name}</h2>
                  <div className="detail-location">
                    {selectedRegion.latitude === null
                      ? 'No mapped coordinates'
                      : `${getRegionCountry(selectedRegion)?.name ?? 'Country not mapped'} · ${selectedRegion.area} · approximate region area`}
                  </div>
                  <span className="detail-area"><MapPin size={11} /> {selectedRegion.area}</span>
                </div>

                <div className="detail-metrics">
                  <div><strong data-testid="text-selected-ranges">{formatNumber(selectedRegion.rangeCount)}</strong><span>published ranges</span></div>
                  <div><strong>{formatNumber(selectedRegion.serviceCount)}</strong><span>service tags</span></div>
                  <div><strong>{formatNumber(selectedRegion.ipv4Count)}</strong><span>IPv4</span></div>
                  <div><strong>{formatNumber(selectedRegion.ipv6Count)}</strong><span>IPv6</span></div>
                </div>

                {selectedServiceTags.length > 0 && (
                  <div className="service-rail" aria-label="Filter by this region's service tags">
                    <span className="service-rail-label">TAGS</span>
                    <button type="button" aria-pressed={searchScope !== 'Service' || !selectedServiceTags.includes(searchInput)} onClick={() => { setSearchInput(''); setSearchScope('All'); }}>ALL</button>
                    {selectedServiceTags.map((service) => (
                      <button
                        type="button"
                        key={service}
                        aria-pressed={searchScope === 'Service' && search === service.toLowerCase()}
                        title={`Filter to ${service}`}
                        onClick={() => { setSearchInput(service); setSearchScope('Service'); }}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                )}

                <div className="range-heading">
                  <div>
                    <div className="section-label">IP allocations</div>
                    <div className="range-count-label" data-testid="text-prefix-results">{formatNumber(selectedRanges.length)} {search ? 'matching' : 'available'}</div>
                  </div>
                  {selectedRanges.length > 0 && (
                    <button type="button" className="copy-button" aria-label="Copy visible prefixes" title="Copy visible prefixes" data-testid="button-copy-visible-prefixes" onClick={() => copyValue(visibleRanges.map((range) => range.cidr).join('\n'), 'prefixes')}>
                      {copyState === 'prefixes' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                {copyState === 'unavailable' && <div className="copy-error" role="status">Clipboard access is unavailable in this browser.</div>}
                <div className="prefix-list" data-testid="list-prefixes">
                  {visibleRanges.map((range) => (
                    <div className="prefix-row" key={`${range.provider}-${range.regionCode}-${range.cidr}`}>
                      <div className="prefix-main">
                        <span className="prefix-cidr">{range.cidr}</span>
                        <span className="prefix-meta">
                          <span className={`family-tag ${range.family.toLowerCase()}`}>{range.family}</span>
                          <span title={`Provider service tags: ${range.services.join(', ')}. These are source identifiers, not service descriptions.`}>
                            {range.services.slice(0, 2).join(', ')}{range.services.length > 2 ? ` +${range.services.length - 2}` : ''}
                          </span>
                        </span>
                      </div>
                      <button type="button" className="copy-button" aria-label={`Copy ${range.cidr}`} data-testid={`button-copy-prefix-${range.cidr.replaceAll(/[/:]/g, '-')}`} onClick={() => copyValue(range.cidr, range.cidr)}>
                        {copyState === range.cidr ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  ))}
                  {!selectedRanges.length && <div className="prefix-empty" data-testid="empty-prefix-results">No ranges in this region match the current search.</div>}
                  {rangeLimit < selectedRanges.length && (
                    <button type="button" className="load-more" data-testid="button-load-more-prefixes" onClick={() => setRangeLimit((value) => value + 36)}>
                      Show {formatNumber(Math.min(36, selectedRanges.length - rangeLimit))} more
                    </button>
                  )}
                </div>
                <div className="detail-source">
                  <Server size={12} />
                  <span>Official feed snapshot · {formatTimestamp(feed.sources.find((source) => source.provider === selectedRegion.provider)?.updatedAt)}</span>
                  <a href={feed.sources.find((source) => source.provider === selectedRegion.provider)?.url} target="_blank" rel="noreferrer" aria-label={`Open ${selectedRegion.provider} source feed`} data-testid="link-source-feed"><ExternalLink size={12} /></a>
                </div>
              </>
            ) : (
              <div className="empty-state detail-empty" data-testid="empty-selected-region">
                <Cloud size={21} />
                <strong>Select a cloud region</strong>
                <p>Choose a mapped region or search a published IP range.</p>
              </div>
            )}
          </aside>
        </section>

        <div className="data-note" id="data-sources" role="note" data-testid="notice-source-scope">
          <span className="note-icon"><Cloud size={13} /></span>
          <span><strong>Published network ranges, not request logs.</strong> Search can match an IP from an X-Forwarded-For value to a provider CIDR; it cannot prove the request passed through that provider. Map points indicate approximate cloud-region areas, not data-center addresses.</span>
          <span className="source-links">
            {feed.sources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.provider} data-testid={`link-feed-${providerShort[source.provider].toLowerCase()}`}>
                {providerShort[source.provider]} <ExternalLink size={10} />
              </a>
            ))}
          </span>
        </div>
        <div className="footer-line">
          <span>Feed build {formatTimestamp(feed.fetchedAt)} UTC</span>
          <span>OpenStreetMap tiles · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></span>
        </div>
      </main>
    </div>
  );
}

export default App;
