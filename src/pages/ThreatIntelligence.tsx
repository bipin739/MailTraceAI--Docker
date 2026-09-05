import React, { useState } from 'react';
import {
  Globe2,
  Search,
  Database,
  Radio
} from 'lucide-react';
import { MOCK_THREAT_CLUSTERS } from '../data/mockData';
import type { ThreatIntelligenceCluster } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';

export const ThreatIntelligence: React.FC = () => {
  const [lookupQuery, setLookupQuery] = useState('bank-corp-update.com');
  const [activeCluster, setActiveCluster] = useState<ThreatIntelligenceCluster>(MOCK_THREAT_CLUSTERS[0]);
  const [isSearching, setIsSearching] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span>GLOBAL THREAT INTELLIGENCE & INFRASTRUCTURE MATRIX</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Threat Intelligence & Domain Profiling
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Correlate domain registration WHOIS, IP subnet reputation, BGP routing anomalies, and threat actor campaign clusters.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Feeds: <strong>4 Live Syncs (AbuseIPDB, VirusTotal)</strong></span>
        </div>
      </div>

      {/* Domain / IP WHOIS & Reputation Search */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Enter Domain Name (e.g. bank-corp-update.com) or IP Address (e.g. 185.220.101.42)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>QUERY INTELLIGENCE</span>
          </button>
        </form>

        {/* Search Result Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Queried Artifact:</span>
            <span className="text-cyan-300 font-bold">{lookupQuery}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Domain Registration Date:</span>
            <span className="text-red-400 font-bold">2026-09-04 (1 Day Ago - NEW)</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Registrar & Country:</span>
            <span className="text-slate-200">RegRu LLC (RU)</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Global Abuse Score:</span>
            <span className="text-red-400 font-bold px-2 py-0.5 rounded bg-red-950 border border-red-800">
              98% High Threat
            </span>
          </div>
        </div>
      </div>

      {/* Threat Actor Campaign Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cluster Selection List */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            TRACKED THREAT CAMPAIGN CLUSTERS ({MOCK_THREAT_CLUSTERS.length})
          </h3>

          {MOCK_THREAT_CLUSTERS.map((cluster) => {
            const isSelected = activeCluster.id === cluster.id;
            return (
              <div
                key={cluster.id}
                onClick={() => setActiveCluster(cluster)}
                className={`p-4 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400 font-bold">{cluster.campaignName}</span>
                  <RiskBadge severity={cluster.riskLevel} size="sm" />
                </div>
                <div className="text-slate-300 font-sans font-semibold mt-1">
                  {cluster.threatActor}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
                  <span>First Seen: {cluster.firstSeen}</span>
                  <span className="text-amber-400 font-bold">{cluster.activeIndicatorCount} IOCs</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Cluster Detail Inspector */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                CLUSTER ID: {activeCluster.id}
              </span>
              <h2 className="text-xl font-bold text-slate-100 font-sans mt-0.5">
                {activeCluster.campaignName}
              </h2>
            </div>
            <RiskBadge severity={activeCluster.riskLevel} size="lg" />
          </div>

          <div className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 block mb-1">Campaign Overview:</strong>
            {activeCluster.description}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">Attributed Threat Actor:</span>
              <span className="text-slate-100 font-bold text-sm">{activeCluster.threatActor}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">Targeted Sectors:</span>
              <span className="text-cyan-300 font-semibold">{activeCluster.targetedSectors.join(', ')}</span>
            </div>
          </div>

          {/* Infrastructure Lists */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                ASSOCIATED SPOOFED DOMAINS
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCluster.associatedDomains.map((dom) => (
                  <span key={dom} className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-mono font-bold">
                    {dom}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                ORIGINATING IP ADDRESSES & BULLETPROOF HOSTS
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCluster.associatedIps.map((ip) => (
                  <span key={ip} className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-mono font-bold">
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
