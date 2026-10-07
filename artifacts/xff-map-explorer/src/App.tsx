import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { divIcon, type Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  ArrowDownUp,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  Globe2,
  LocateFixed,
  MapPinned,
  Minus,
  Plus,
  Search,
  Server,
  X,
} from 'lucide-react';
import { dataCenters, type DataCenter, type FacilityStatus } from './data/datacenters';

const WORLD_CENTER: [number, number] = [10, 15];
const WORLD_ZOOM = 1.5;
const regions = ['All regions', 'Africa', 'Asia Pacific', 'Europe', 'North America', 'South America'];
const statuses = ['All statuses', 'operational', 'degraded', 'maintenance'];

function StatusDot({ status }: { status: FacilityStatus }) {
  return <span className={`row-status status-${status}`} aria-hidden="true" />;
}

function MapViewport({ selected, resetKey }: { selected: DataCenter | null; resetKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 4), { duration: 0.7 });
  }, [map, selected]);
  useEffect(() => {
    map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.65 });
  }, [map, resetKey]);
  return null;
}

function MapControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  return (
    <div className="map-zoom" aria-label="Map controls">
      <button type="button" aria-label="Zoom in" data-testid="button-map-zoom-in" onClick={() => map.zoomIn()}><Plus size={15} /></button>
      <button type="button" aria-label="Zoom out" data-testid="button-map-zoom-out" onClick={() => map.zoomOut()}><Minus size={15} /></button>
      <button type="button" aria-label="Reset map view" data-testid="button-map-reset" onClick={onReset}><LocateFixed size={14} /></button>
    </div>
  );
}

function markerIcon(status: FacilityStatus, selected: boolean) {
  return divIcon({
    className: '',
    html: `<span class="custom-pin ${status}${selected ? ' selected' : ''}"></span>`,
    iconSize: selected ? [29, 29] : [23, 23],
    iconAnchor: selected ? [14, 14] : [11, 11],
  });
}

function LocationMarker({ node, selected, onSelect }: { node: DataCenter; selected: boolean; onSelect: () => void }) {
  const markerRef = useRef<LeafletMarker | null>(null);
  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (element) {
      element.setAttribute('data-testid', `marker-location-${node.id}`);
      element.setAttribute('aria-label', `${node.name}, ${node.city}, ${statusLabel(node.status)}`);
      element.setAttribute('role', 'button');
    }
  }, [node.id, node.name, node.city, node.status]);
  return (
    <Marker
      ref={markerRef}
      position={[node.latitude, node.longitude]}
      icon={markerIcon(node.status, selected)}
      title={`${node.name}, ${node.city} — ${statusLabel(node.status)}`}
      alt={`${node.name}, ${node.city}`}
      keyboard
      eventHandlers={{ click: onSelect }}
    />
  );
}

function statusLabel(status: FacilityStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(dataCenters[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All regions');
  const [status, setStatus] = useState('All statuses');
  const [resetKey, setResetKey] = useState(0);
  const [copied, setCopied] = useState('');

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return dataCenters.filter((node) => {
      const matchesRegion = region === 'All regions' || node.region === region;
      const matchesStatus = status === 'All statuses' || node.status === status;
      const searchable = [node.name, node.city, node.country, node.provider, node.ipv4, ...node.xffChain].join(' ').toLowerCase();
      return matchesRegion && matchesStatus && (!search || searchable.includes(search));
    });
  }, [query, region, status]);

  const selected = filtered.find((node) => node.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const resetMap = () => setResetKey((value) => value + 1);
  const copyValue = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('unavailable');
      window.setTimeout(() => setCopied(''), 1800);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><ArrowDownUp size={19} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-title">Forward Atlas</div>
            <div className="brand-subtitle">Network operations / map explorer</div>
          </div>
        </div>
        <div className="top-right">
          <span className="clock-tag">DEMO ENVIRONMENT</span>
          <span className="sample-label"><span className="eyebrow-dot" /> Illustrative data</span>
        </div>
      </header>

      <div className="workspace">
        <section className="page-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> XFF route observatory <ChevronRight size={11} /> global footprint</div>
            <h1>Proxy hop explorer</h1>
            <p className="lede">Trace example forwarding paths across a distributed data-center footprint.</p>
          </div>
          <div className="heading-actions">
            <button type="button" className="plain-button" data-testid="button-reset-view" onClick={resetMap}><LocateFixed size={14} /> Reset view</button>
          </div>
        </section>

        <div className="map-layout">
          <aside className="panel results-panel" aria-label="Data center results">
            <div className="panel-heading">
              <div className="panel-title-row">
                <span className="panel-title">Data centers</span>
                <span className="count-pill" data-testid="text-result-count">{filtered.length.toString().padStart(2, '0')} / {dataCenters.length.toString().padStart(2, '0')}</span>
              </div>
              <label className="searchbox">
                <Search size={14} aria-hidden="true" />
                <input aria-label="Search data centers" data-testid="input-search" placeholder="Name, city, IP, operator…" value={query} onChange={(event) => setQuery(event.target.value)} />
                {query && <button className="copy-button" aria-label="Clear search" data-testid="button-clear-search" type="button" onClick={() => setQuery('')}><X size={13} /></button>}
              </label>
            </div>
            <div className="filters">
              <select aria-label="Filter by region" data-testid="select-region" value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <select aria-label="Filter by status" data-testid="select-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((value) => <option key={value} value={value}>{value === 'All statuses' ? value : statusLabel(value as FacilityStatus)}</option>)}
              </select>
            </div>
            <div className="list-caption">Locations · {filtered.length} shown</div>
            <div className="location-list" role="list" data-testid="list-data-centers">
              {filtered.length ? filtered.map((node) => (
                <button key={node.id} type="button" role="listitem" className={`location-row ${node.id === selected?.id ? 'selected' : ''}`} aria-pressed={node.id === selected?.id} data-testid={`button-location-${node.id}`} onClick={() => setSelectedId(node.id)}>
                  <StatusDot status={node.status} />
                  <span className="row-main">
                    <span className="row-name">{node.name}</span>
                    <span className="row-city">{node.city}, {node.country}</span>
                  </span>
                  <span className="row-region">{node.region === 'North America' ? 'N. AMER' : node.region === 'South America' ? 'S. AMER' : node.region === 'Asia Pacific' ? 'APAC' : node.region.toUpperCase()}</span>
                </button>
              )) : (
                <div className="empty-state" data-testid="empty-search-results">
                  <Search size={20} />
                  <strong>No matching locations</strong>
                  <p>Try another name, city, operator, IP address, or clear a filter.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="map-column" aria-label="Global data center map">
            <div className="map-card">
              <MapContainer className="map-canvas" center={WORLD_CENTER} zoom={WORLD_ZOOM} minZoom={1} maxZoom={12} zoomSnap={0.25} scrollWheelZoom keyboard zoomControl={false} worldCopyJump>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filtered.map((node) => (
                  <LocationMarker key={node.id} node={node} selected={selected?.id === node.id} onSelect={() => setSelectedId(node.id)} />
                ))}
                <MapViewport selected={selected} resetKey={resetKey} />
                <MapControls onReset={resetMap} />
              </MapContainer>
              <div className="map-overlay-top">
                <span className="map-chip"><Globe2 size={11} style={{ verticalAlign: '-2px', marginRight: 6 }} /> WORLD VIEW / {filtered.length} NODES</span>
              </div>
              <div className="map-legend" aria-label="Map status legend">
                {(['operational', 'degraded', 'maintenance'] as FacilityStatus[]).map((value) => (
                  <span key={value} className="legend-item"><i className={`legend-dot status-${value}`} />{statusLabel(value)}</span>
                ))}
              </div>
            </div>
            <div className="map-caption">
              <span><MapPinned size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Drag to pan · scroll or use controls to zoom</span>
              <span>EPSG:4326</span>
            </div>
          </section>

          <aside className="panel details-panel" aria-label="Selected data center details">
            {selected ? (
              <>
                <div className="detail-kicker"><span>Selected node</span><span>{selected.id.toUpperCase()}</span></div>
                <h2 className="detail-title" data-testid="text-selected-name">{selected.name}</h2>
                <div className="detail-location">{selected.city}, {selected.country}</div>
                <div className={`status-badge badge-${selected.status}`} data-testid="status-selected">
                  <StatusDot status={selected.status} /> {statusLabel(selected.status)}
                </div>

                <section className="detail-section">
                  <div className="section-label">Node profile</div>
                  <div className="detail-grid">
                    <div><div className="metric-label">Operator</div><div className="metric-value provider-value">{selected.provider}</div></div>
                    <div><div className="metric-label">Region</div><div className="metric-value provider-value">{selected.region}</div></div>
                    <div><div className="metric-label">Latency*</div><div className="metric-value">{selected.latencyMs} ms</div></div>
                    <div><div className="metric-label">Traffic*</div><div className="metric-value">{selected.trafficGbps} Gbps</div></div>
                  </div>
                </section>
                <span role="status" aria-live="polite" data-testid="status-copy-feedback" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
                  {copied === 'unavailable' ? 'Clipboard access is unavailable.' : copied ? 'Copied to clipboard.' : ''}
                </span>

                <section className="detail-section">
                  <div className="section-label">Node address</div>
                  <div className="address-list">
                    <div className="address-item">
                      <div><div className="address-label">IPv4</div><div className="address-ip">{selected.ipv4}</div></div>
                      <button type="button" className="copy-button" aria-label={`Copy IP ${selected.ipv4}`} title="Copy IP" data-testid="button-copy-ip" onClick={() => copyValue(selected.ipv4, 'ip')}>{copied === 'ip' ? <Check size={13} /> : <Copy size={13} />}</button>
                    </div>
                  </div>
                </section>

                <section className="detail-section">
                  <div className="section-label">X-Forwarded-For chain <span style={{ fontFamily: 'var(--app-font-mono)', fontWeight: 400 }}>· {selected.xffChain.length} hops</span></div>
                  <div className="chain" data-testid="list-xff-chain">
                    {selected.xffChain.map((ip, index) => (
                      <div className="chain-node" key={`${selected.id}-${ip}-${index}`}>
                        <span className="chain-rail"><span className="chain-point" />{index < selected.xffChain.length - 1 && <span className="chain-line" />}</span>
                        <span className="chain-value">
                          <span>{ip}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className="chain-kind">{index === 0 ? 'CLIENT' : index === selected.xffChain.length - 1 ? 'EDGE' : `HOP ${index}`}</span>
                            <button type="button" className="copy-button" aria-label={`Copy chain IP ${ip}`} title={`Copy ${ip}`} data-testid={`button-copy-chain-ip-${index}`} onClick={() => copyValue(ip, `hop-${index}`)}>{copied === `hop-${index}` ? <Check size={11} /> : <Copy size={11} />}</button>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="copy-chain" data-testid="button-copy-chain" onClick={() => copyValue(selected.xffChain.join(', '), 'chain')}>
                    {copied === 'chain' ? <Check size={13} /> : <Clipboard size={13} />}
                    {copied === 'chain' ? 'Chain copied' : 'Copy full chain'}
                  </button>
                </section>
                <div className="detail-foot">* Latency and traffic values are illustrative samples, not current measurements.</div>
              </>
            ) : (
              <div className="empty-state" data-testid="empty-selected-location">
                <Server size={21} />
                <strong>No location selected</strong>
                <p>Select a marker or result to inspect its illustrative route data.</p>
              </div>
            )}
          </aside>
        </div>

        <div className="notice" role="note" data-testid="notice-sample-data">
          <AlertTriangle className="notice-icon" size={15} />
          <span><strong>Sample data — not live telemetry.</strong> Every IP uses documentation-only ranges (RFC 5737); locations, forwarding chains, status, traffic, and latency are illustrative and do not represent real IP-to-location mappings or a live inventory.</span>
        </div>
      </div>
    </main>
  );
}

export default App;
