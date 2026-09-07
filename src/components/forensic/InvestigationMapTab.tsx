import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe,
  MapPin,
  Server,
  Search,
  Copy,
  Check,
  Info,
  Cloud,
  Lock,
  Maximize2
} from 'lucide-react';
import type { EmailAnalysis } from '../../types/forensic';
import type { InfrastructureMapNode } from '../../types/map';
import { extractInfrastructureMapData } from '../../utils/mapHelper';

interface InvestigationMapTabProps {
  email: EmailAnalysis;
}

export const InvestigationMapTab: React.FC<InvestigationMapTabProps> = ({ email }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'earliest' | 'relay' | 'indicator'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Extract infrastructure nodes and route path from email
  const mapData = useMemo(() => extractInfrastructureMapData(email), [email]);

  // Filter nodes based on role and text search
  const filteredNodes = useMemo(() => {
    return mapData.nodes.filter(node => {
      // Role filter
      if (activeFilter === 'earliest' && !node.is_earliest) return false;
      if (activeFilter === 'relay' && node.role !== 'relay_node') return false;
      if (activeFilter === 'indicator' && node.role !== 'indicator_ip') return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIp = node.ip.toLowerCase().includes(q);
        const matchCountry = (node.country || '').toLowerCase().includes(q);
        const matchCity = (node.city || '').toLowerCase().includes(q);
        const matchOrg = (node.organization || '').toLowerCase().includes(q);
        const matchAsn = (node.asn || '').toLowerCase().includes(q);
        return matchIp || matchCountry || matchCity || matchOrg || matchAsn;
      }
      return true;
    });
  }, [mapData, activeFilter, searchQuery]);

  // Copy IP handler
  const handleCopy = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Fly map to node when clicked from the panel
  const handleSelectNode = (node: InfrastructureMapNode) => {
    setSelectedNodeId(node.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([node.latitude, node.longitude], Math.max(map.getZoom(), 6), { duration: 1 });
      const marker = markersMapRef.current.get(node.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Reset map view to fit all filtered nodes
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (filteredNodes.length === 0) {
      map.setView([20, 0], 2);
    } else if (filteredNodes.length === 1) {
      map.setView([filteredNodes[0].latitude, filteredNodes[0].longitude], 6);
    } else {
      const bounds = L.latLngBounds(filteredNodes.map(n => [n.latitude, n.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route on data or filter change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersMapRef.current.forEach(m => map.removeLayer(m));
    markersMapRef.current.clear();

    // Remove existing route layer
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // 1. Draw Polyline for Observed Infrastructure Route
    if (showRoute && mapData.route_path.length >= 2) {
      const polyline = L.polyline(mapData.route_path, {
        color: '#06b6d4', // Cyan
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      polyline.bindTooltip(
        '<div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #06b6d4; background: #020617; padding: 3px 8px; border-radius: 6px; border: 1px solid #0891b2;">Observed infrastructure route</div>',
        { sticky: true, className: 'route-tooltip' }
      );

      routeLayerRef.current = polyline;
    }

    // 2. Add Markers for Filtered Nodes
    if (filteredNodes.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    const bounds = L.latLngBounds([]);

    filteredNodes.forEach(node => {
      bounds.extend([node.latitude, node.longitude]);

      // Marker badge styling based on role
      let bgStyle = 'background: rgba(6, 182, 212, 0.95); border: 2px solid #67e8f9; color: #020617;';
      let iconInner = '•';

      if (node.is_earliest) {
        bgStyle = 'background: rgba(225, 29, 72, 0.95); border: 2px solid #fecdd3; color: #ffffff; box-shadow: 0 0 14px rgba(225,29,72,0.8);';
        iconInner = '★';
      } else if (node.role === 'relay_node') {
        bgStyle = 'background: rgba(37, 99, 235, 0.95); border: 2px solid #93c5fd; color: #ffffff; box-shadow: 0 0 10px rgba(37,99,235,0.7);';
        iconInner = node.hop_number !== undefined ? `${node.hop_number}` : 'R';
      }

      const markerHtml = `
        <div style="
          width: 28px;
          height: 28px;
          ${bgStyle}
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: ui-monospace, monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.15s ease-in-out;
        ">
          ${iconInner}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'investigation-map-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      // HTML Popup content
      const popupHtml = `
        <div style="color: #f1f5f9; background: #090d16; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; min-width: 220px; padding: 8px; border-radius: 10px; border: 1px solid #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-family: ui-monospace, monospace; font-weight: 700; font-size: 13px; color: #38bdf8;">${node.ip}</span>
            <span style="font-family: ui-monospace, monospace; font-size: 9px; text-transform: uppercase; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
              node.is_earliest ? 'background: #4c0519; color: #f43f5e;' :
              node.role === 'relay_node' ? 'background: #172554; color: #60a5fa;' :
              'background: #164e63; color: #22d3ee;'
            }">
              ${node.role_label}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #cbd5e1;">
            <div><strong style="color: #94a3b8;">Location:</strong> ${[node.city, node.region, node.country].filter(Boolean).join(', ') || 'Unknown'}</div>
            <div><strong style="color: #94a3b8;">ASN:</strong> <span style="font-family: ui-monospace, monospace; color: #38bdf8;">${node.asn || 'N/A'}</span></div>
            <div style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong style="color: #94a3b8;">Org:</strong> ${node.organization || 'N/A'}</div>
          </div>

          <div style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #1e293b; font-family: ui-monospace, monospace; font-size: 9px; color: #64748b; display: flex; justify-content: space-between;">
            <span>Estimated coords:</span>
            <span>${node.latitude.toFixed(4)}, ${node.longitude.toFixed(4)}</span>
          </div>
        </div>
      `;

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupHtml, { className: 'dark-leaflet-popup' });

      marker.on('click', () => {
        setSelectedNodeId(node.id);
      });

      markersMapRef.current.set(node.id, marker);
    });

    if (filteredNodes.length === 1) {
      map.setView([filteredNodes[0].latitude, filteredNodes[0].longitude], 6);
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [filteredNodes, showRoute, mapData]);

  return (
    <div className="space-y-4">
      {/* Header Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Investigation Infrastructure Map</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                {mapData.total_geolocated} of {mapData.total_public_ips} Public IPs Geolocated
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Geographic topology of observed email transmission relays and indicators
            </p>
          </div>
        </div>

        {/* Route Path Toggle and Reset Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {mapData.route_path.length >= 2 && (
            <label className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer hover:border-cyan-500/40 transition-colors select-none">
              <input
                type="checkbox"
                checked={showRoute}
                onChange={e => setShowRoute(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                <span>Observed infrastructure route</span>
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={handleResetBounds}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fit Bounds</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Map + Right Infrastructure Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAP CONTAINER (Left 8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col relative">
          {mapData.nodes.length === 0 ? (
            <div className="h-[540px] flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Globe className="w-12 h-12 text-slate-600 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-300">No Geolocated Public Infrastructure</h3>
                <p className="text-xs text-slate-500 max-w-md font-mono">
                  All IP addresses identified in this email are private (RFC 1918), loopback, or lack public geolocation provider records.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[540px]">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map Overlay Badge */}
              <div className="absolute top-3 left-12 z-10 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center space-x-2 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] text-slate-300">Earliest Node</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-slate-300">Relay Node</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-slate-300">Indicator IP</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT INFRASTRUCTURE INSPECTOR PANEL (Right 4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col h-[540px] space-y-3.5">
          {/* Panel Header & Filter Buttons */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Observed Nodes</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredNodes.length} shown
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] font-mono">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'earliest' as const, label: 'Earliest' },
                { id: 'relay' as const, label: 'Relays' },
                { id: 'indicator' as const, label: 'Indicators' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    activeFilter === tab.id
                      ? 'bg-cyan-600/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by IP, country, or org..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Node Cards Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredNodes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No nodes match the selected criteria.
              </div>
            ) : (
              filteredNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Node Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-200 truncate">
                          {node.ip}
                        </span>
                        <button
                          type="button"
                          onClick={e => handleCopy(node.ip, e)}
                          className="p-1 text-slate-500 hover:text-slate-300 rounded"
                          title="Copy IP"
                        >
                          {copiedIp === node.ip ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                        node.is_earliest
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : node.role === 'relay_node'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {node.role_label}
                      </span>
                    </div>

                    {/* Geolocation Details */}
                    <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                      <div className="flex items-center space-x-1 truncate">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          {[node.city, node.country].filter(Boolean).join(', ') || 'Unknown Location'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{node.asn || 'ASN: N/A'}</span>
                        <span className="truncate max-w-[140px] text-right">{node.organization || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Infrastructure Badges */}
                    {(node.is_hosting || node.is_proxy_vpn_tor) && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {node.is_hosting && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center space-x-1">
                            <Cloud className="w-2.5 h-2.5" />
                            <span>Hosting</span>
                          </span>
                        )}
                        {node.is_proxy_vpn_tor && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>VPN/Tor</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Geolocation Confidence & Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 backdrop-blur-sm text-xs text-slate-400 font-mono">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-300">
            Geolocation Confidence & Infrastructure Route Notice:
          </span>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Coordinates represent coarse city/regional estimates based on public IP registry allocations. They reflect network infrastructure routing nodes and do not establish street-level physical locations or the personal identity of the sender. The observed route sequence reflects email relay hops and is labeled exclusively as an <strong className="text-cyan-300 font-bold">observed infrastructure route</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
