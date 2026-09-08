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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-border">
        <div>
          <div className="flex items-center space-x-2 text-primary font-mono text-xs mb-1 font-semibold uppercase tracking-wider">
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            <span>GLOBAL THREAT INTELLIGENCE & INFRASTRUCTURE MATRIX</span>
          </div>
          <h1 className="text-xl font-bold text-foreground font-sans tracking-tight">
            Threat Intelligence & Domain Profiling
          </h1>
          <p className="text-xs text-foreground-muted font-mono mt-1">
            Correlate domain registration WHOIS, IP subnet reputation, BGP routing anomalies, and threat actor campaign clusters.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-mono text-foreground">
          <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
          <span>Feeds: <strong className="text-primary font-medium">4 Active Syncs (AbuseIPDB, VirusTotal)</strong></span>
        </div>
      </div>

      {/* Domain / IP WHOIS & Reputation Search */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Enter Domain Name (e.g. bank-corp-update.com) or IP Address (e.g. 185.220.101.42)..."
              className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-mono font-semibold text-xs tracking-wider transition-colors btn-press cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isSearching ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>QUERY INTELLIGENCE</span>
          </button>
        </form>

        {/* Search Result Card */}
        <div className="p-3.5 rounded-lg bg-surface-secondary border border-border grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-foreground-muted block text-[10px]">Queried Artifact:</span>
            <span className="text-primary font-semibold">{lookupQuery}</span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[10px]">Domain Registration:</span>
            <span className="text-danger font-semibold">2026-09-04 (1 Day Ago - NEW)</span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[10px]">Registrar & Country:</span>
            <span className="text-foreground">RegRu LLC (RU)</span>
          </div>

          <div>
            <span className="text-foreground-muted block text-[10px]">Global Abuse Score:</span>
            <span className="text-danger font-bold px-2 py-0.5 rounded bg-danger-surface border border-danger-border inline-block mt-0.5">
              98% High Threat
            </span>
          </div>
        </div>
      </div>

      {/* Threat Actor Campaign Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cluster Selection List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-mono font-semibold text-foreground-muted uppercase tracking-wider">
            TRACKED THREAT CAMPAIGN CLUSTERS ({MOCK_THREAT_CLUSTERS.length})
          </h3>

          {MOCK_THREAT_CLUSTERS.map((cluster) => {
            const isSelected = activeCluster.id === cluster.id;
            return (
              <div
                key={cluster.id}
                onClick={() => setActiveCluster(cluster)}
                className={`p-3.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary-subtle border-primary/40 shadow-xs'
                    : 'bg-surface border-border hover:bg-surface-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {cluster.campaignName}
                  </span>
                  <RiskBadge severity={cluster.riskLevel} size="sm" />
                </div>
                <div className="text-foreground font-sans font-medium mt-1">
                  {cluster.threatActor}
                </div>
                <div className="text-[11px] text-foreground-muted mt-2 flex justify-between">
                  <span>First Seen: {cluster.firstSeen}</span>
                  <span className="text-warning font-semibold">{cluster.activeIndicatorCount} IOCs</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Cluster Detail Inspector */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-xs font-mono text-primary font-semibold">
                CLUSTER ID: {activeCluster.id}
              </span>
              <h2 className="text-lg font-bold text-foreground font-sans mt-0.5">
                {activeCluster.campaignName}
              </h2>
            </div>
            <RiskBadge severity={activeCluster.riskLevel} size="md" />
          </div>

          <div className="text-xs text-foreground font-mono leading-relaxed bg-surface-secondary p-3.5 rounded-lg border border-border">
            <strong className="text-primary block mb-1">Campaign Overview:</strong>
            {activeCluster.description}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1">
              <span className="text-foreground-muted text-[10px] block">Attributed Threat Actor:</span>
              <span className="text-foreground font-bold text-sm">{activeCluster.threatActor}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1">
              <span className="text-foreground-muted text-[10px] block">Targeted Sectors:</span>
              <span className="text-primary font-semibold">{activeCluster.targetedSectors.join(', ')}</span>
            </div>
          </div>

          {/* Infrastructure Lists */}
          <div className="space-y-3 pt-1">
            <div>
              <h4 className="text-xs font-mono font-semibold text-foreground-muted uppercase mb-1.5">
                ASSOCIATED SPOOFED DOMAINS
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeCluster.associatedDomains.map((dom) => (
                  <span
                    key={dom}
                    className="px-2 py-0.5 rounded bg-danger-surface border border-danger-border text-danger text-xs font-mono font-semibold"
                  >
                    {dom}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-semibold text-foreground-muted uppercase mb-1.5">
                ORIGINATING IP ADDRESSES & BULLETPROOF HOSTS
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeCluster.associatedIps.map((ip) => (
                  <span
                    key={ip}
                    className="px-2 py-0.5 rounded bg-warning-surface border border-warning-border text-warning text-xs font-mono font-semibold"
                  >
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
