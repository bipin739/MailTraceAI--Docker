import React from 'react';
import { Network, ShieldAlert, Server, Globe, User, Hash } from 'lucide-react';

interface AttributionGraphProps {
  senderDomain: string;
  originIp: string;
  targetEmail: string;
  campaignName?: string;
  hashes?: string[];
}

export const AttributionGraph: React.FC<AttributionGraphProps> = ({
  senderDomain,
  originIp,
  targetEmail,
  campaignName = 'Operation GhostInvoice',
  hashes = []
}) => {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
            Infrastructure & Campaign Correlation Graph
          </h4>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
          Campaign Linked: {campaignName}
        </span>
      </div>

      {/* Cyber Graph Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center my-6 text-center">
        {/* Node 1: Spoofed / Deceptive Domain */}
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/80 shadow-[0_0_15px_rgba(239,68,68,0.15)] flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-red-900/50 text-red-400 mb-2">
            <Globe className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">
            SPOOFED DOMAIN
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 truncate w-full mt-1">
            {senderDomain}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            Lookalike Typosquat
          </span>
        </div>

        {/* Node 2: Origin Infrastructure IP */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-amber-900/50 text-amber-400 mb-2">
            <Server className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
            ORIGIN IP NODE
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 truncate w-full mt-1">
            {originIp}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            Anonymized Proxy / TOR
          </span>
        </div>

        {/* Node 3: Campaign Threat Cluster */}
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/80 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-purple-900/50 text-purple-400 mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">
            THREAT CAMPAIGN
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 truncate w-full mt-1">
            {campaignName}
          </span>
          <span className="text-[10px] text-purple-300 mt-1 font-mono">
            Cluster Confidence: 96%
          </span>
        </div>

        {/* Node 4: Targeted Victim Enterprise */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-slate-800 text-cyan-400 mb-2">
            <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
            TARGET RECIPIENT
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 truncate w-full mt-1">
            {targetEmail}
          </span>
          <span className="text-[10px] text-emerald-400 mt-1 font-mono">
            Protected Gateway
          </span>
        </div>
      </div>

      {/* Hashes Summary Footer */}
      {hashes.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-slate-400">
          <Hash className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-mono truncate">
            Payload Evidence Hashes Linked: {hashes.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};
