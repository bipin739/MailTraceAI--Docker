import React, { useState } from 'react';
import { Globe, Server, Shield, MapPin, Info, Cloud, Lock, Cpu } from 'lucide-react';
import type { EmailAnalysis, IPIntelligence } from '../../types/forensic';
import { resolveIPIntelligence } from '../../utils/indicatorHelper';
import { LeafletMap, type MapLocation } from '../common/LeafletMap';

interface IPIntelligenceSectionProps {
  email: EmailAnalysis;
}

export const IPIntelligenceSection: React.FC<IPIntelligenceSectionProps> = ({ email }) => {
  const [selectedIpFilter, setSelectedIpFilter] = useState<'all' | 'public' | 'private'>('all');

  const ipIntelMap: Record<string, IPIntelligence> = email.ip_intelligence || {};
  
  // Extract all unique IPs from indicators and relay path
  const ipSet = new Set<string>();
  (email.indicators?.ips || []).forEach(i => ipSet.add(i.value));
  (email.relay_analysis?.header_order_hops || []).forEach(h => {
    if (h.from_ip) ipSet.add(h.from_ip);
    if (h.by_ip) ipSet.add(h.by_ip);
  });
  if (email.ips) email.ips.forEach(ip => ipSet.add(ip));

  const earliestIp = email.relay_analysis?.earliest_observable_node?.earliest_observable_ip;

  const allIpList: IPIntelligence[] = Array.from(ipSet).map(ip => {
    return resolveIPIntelligence(ip, ipIntelMap);
  });

  const filteredIpList = allIpList.filter(item => {
    if (selectedIpFilter === 'public') return item.scope === 'public';
    if (selectedIpFilter === 'private') return item.scope === 'private';
    return true;
  });

  const mapLocations: MapLocation[] = allIpList
    .filter(item => item.scope === 'public' && item.latitude !== undefined && item.longitude !== undefined)
    .map(item => ({
      ip: item.ip,
      latitude: item.latitude!,
      longitude: item.longitude!,
      country: item.country,
      city: item.city,
      asn: item.asn,
      organization: item.organization || item.isp || item.asn_org,
      isEarliest: item.ip === earliestIp
    }));

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-3 backdrop-blur-sm shadow-sm">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-slate-200">Observed Infrastructure Notice:</span>{' '}
          IP geolocation estimates infrastructure location and does not establish the physical location or identity of the sender.
        </div>
      </div>

      {/* Interactive Infrastructure Map */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Observed Infrastructure Map
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-normal">
                  {mapLocations.length} Geolocated Node{mapLocations.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Visual mapping of public IP routing nodes and email server infrastructure</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs">
            <button
              onClick={() => setSelectedIpFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedIpFilter === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({allIpList.length})
            </button>
            <button
              onClick={() => setSelectedIpFilter('public')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedIpFilter === 'public' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Public ({allIpList.filter(i => i.scope === 'public').length})
            </button>
            <button
              onClick={() => setSelectedIpFilter('private')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedIpFilter === 'private' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Private ({allIpList.filter(i => i.scope === 'private').length})
            </button>
          </div>
        </div>

        {/* Leaflet Map component */}
        {mapLocations.length > 0 ? (
          <LeafletMap locations={mapLocations} height="340px" />
        ) : (
          <div className="h-48 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Globe className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-400">No Public IP Geolocation Available</p>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              All observed IP addresses in this transmission path are internal, private, or loopback network addresses.
            </p>
          </div>
        )}
      </div>

      {/* IP Intelligence Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Enriched IP Infrastructure Cards ({filteredIpList.length})
          </h3>
        </div>

        {filteredIpList.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-400">
            No IP addresses match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIpList.map(item => {
              const isEarliest = item.ip === earliestIp;
              const isPrivate = item.scope === 'private';

              return (
                <div
                  key={item.ip}
                  className={`p-5 rounded-2xl border transition-all duration-200 ${
                    isEarliest
                      ? 'bg-slate-900/95 border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : isPrivate
                      ? 'bg-slate-900/60 border-slate-800/80'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-slate-100 tracking-wide">
                          {item.ip}
                        </span>
                        {isEarliest && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-400 tracking-wider">
                            Earliest Hop Node
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            isPrivate
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
                          }`}
                        >
                          {item.scope === 'private' ? 'Private / Reserved' : 'Public IP'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        {item.infrastructure_type || (isPrivate ? 'Internal infrastructure' : 'Observed infrastructure node')}
                      </p>
                    </div>

                    {/* Infrastructure Badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      {item.is_hosting && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950 border border-blue-800 text-blue-300">
                          <Cloud className="w-3 h-3" /> Hosting / Cloud
                        </span>
                      )}
                      {item.is_proxy_vpn_tor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 border border-rose-800 text-rose-300">
                          <Lock className="w-3 h-3" /> Proxy / VPN / Tor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  {isPrivate ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        Private / Non-Routable Address
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        This IP address belongs to RFC 1918, loopback, CGNAT, or local link space. It is not queried against public IP geolocation databases.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Country</span>
                        <div className="font-medium text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {item.country || 'Unknown'} {item.country_code ? `(${item.country_code})` : ''}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Region / City</span>
                        <div className="font-medium text-slate-200">
                          {[item.city, item.region].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">ASN</span>
                        <div className="font-mono font-semibold text-cyan-300">
                          {item.asn || 'N/A'}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Timezone</span>
                        <div className="font-medium text-slate-300">
                          {item.timezone || 'N/A'}
                        </div>
                      </div>

                      <div className="col-span-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Provider / Organization</span>
                        <div className="font-medium text-slate-200 truncate">
                          {item.organization || item.isp || item.asn_org || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Geolocation Notice Footer */}
                  <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Observed infrastructure location</span>
                    {item.latitude && item.longitude && (
                      <span className="font-mono text-slate-400 text-[10px]">
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
