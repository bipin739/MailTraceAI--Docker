import React, { useState } from 'react';
import type { RelayPathAnalysis, RelayHop } from '../../types/forensic';
import {
  GitCommit,
  ShieldCheck,
  Server,
  Network,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowDown,
  Clock,
  Globe,
  Radio,
  FileText
} from 'lucide-react';

interface TransmissionPathSectionProps {
  relayAnalysis?: RelayPathAnalysis;
}

export const TransmissionPathSection: React.FC<TransmissionPathSectionProps> = ({ relayAnalysis }) => {
  const [viewMode, setViewMode] = useState<'transmission' | 'header'>('transmission');
  const [expandedHop, setExpandedHop] = useState<number | null>(null);

  const headerHops = relayAnalysis?.header_order_hops || [];
  const transmissionHops = relayAnalysis?.transmission_order_hops || [];
  const activeHops = viewMode === 'transmission' ? transmissionHops : headerHops;
  const earliestNode = relayAnalysis?.earliest_observable_node;

  const toggleHopExpand = (hopNumber: number) => {
    setExpandedHop(prev => (prev === hopNumber ? null : hopNumber));
  };

  const getNodeRoleLabel = (index: number, total: number, mode: 'transmission' | 'header') => {
    if (mode === 'transmission') {
      if (index === 0) return 'Sender-Side Infrastructure (Origin)';
      if (index === total - 1) return 'Recipient Infrastructure (Gateway)';
      return `Relay Node #${index + 1}`;
    } else {
      if (index === 0) return 'Recipient Infrastructure (Gateway)';
      if (index === total - 1) return 'Sender-Side Infrastructure (Origin)';
      return `Upstream Relay #${index + 1}`;
    }
  };

  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-5 backdrop-blur-xl shadow-lg font-mono">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Email Relay Transmission Path
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Reconstructed Received header chain and routing infrastructure analysis
            </p>
          </div>
        </div>

        {/* View Mode Selector Buttons */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('transmission')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'transmission'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Derived Transmission Order</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('header')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'header'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original Header Order</span>
          </button>
        </div>
      </div>

      {/* Earliest Observable Sending Infrastructure Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-cyan-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Earliest Observable Sending Infrastructure
            </span>
          </div>
          {earliestNode?.confidence && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                earliestNode.confidence === 'high'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : earliestNode.confidence === 'medium'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              Confidence: {earliestNode.confidence}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
            <span className="text-slate-400 text-[11px]">Earliest Observable IP</span>
            <span className="font-bold text-cyan-300 font-mono text-sm">
              {earliestNode?.earliest_observable_ip || 'None detected'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
            <span className="text-slate-400 text-[11px]">Associated Sender Host</span>
            <span className="font-bold text-slate-200 truncate max-w-[200px]" title={earliestNode?.from_host}>
              {earliestNode?.from_host || 'Unknown'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
          <span className="font-semibold text-slate-300">Analysis Note: </span>
          {earliestNode?.reason || 'Initial public sending IP observed in email headers.'}
        </p>
      </div>

      {/* Forensic Trust Hierarchy Notice */}
      <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300 block font-mono text-[11px]">
            Relay Header Trust Evaluation
          </span>
          <span className="text-slate-400 text-[11px]">
            {relayAnalysis?.trust_notice ||
              'Headers nearest the recipient\'s mail infrastructure provide stronger evidence than upstream headers, which may be forged by prior nodes.'}
          </span>
        </div>
      </div>

      {/* Vertical Timeline Hop Visualization */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold uppercase tracking-wider text-slate-300">
            {viewMode === 'transmission'
              ? 'Chronological Transmission Sequence (Sender → Recipient)'
              : 'Header Chain Sequence (Top / Recipient Gateway → Bottom / Sender Origin)'}
          </span>
          <span className="text-[11px]">{activeHops.length} Hop(s) Reconstructed</span>
        </div>

        {activeHops.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No Received header hops present in this email.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {activeHops.map((hop: RelayHop, idx: number) => {
              const isExpanded = expandedHop === hop.hop_number;
              const roleLabel = getNodeRoleLabel(idx, activeHops.length, viewMode);
              const isOrigin = (viewMode === 'transmission' && idx === 0) || (viewMode === 'header' && idx === activeHops.length - 1);
              const isRecipient = (viewMode === 'transmission' && idx === activeHops.length - 1) || (viewMode === 'header' && idx === 0);

              return (
                <div key={`${viewMode}-hop-${hop.hop_number}`} className="relative group">
                  {/* Timeline Icon Node */}
                  <div
                    className={`absolute -left-[31px] top-4 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold z-10 transition-colors ${
                      isOrigin
                        ? 'bg-amber-950 border-amber-600 text-amber-300'
                        : isRecipient
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {hop.hop_number}
                  </div>

                  {/* Hop Content Card */}
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-md">
                    {/* Top Row: Role Label & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                      <div className="flex items-center space-x-2">
                        {isOrigin ? (
                          <Radio className="w-4 h-4 text-amber-400" />
                        ) : isRecipient ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Server className="w-4 h-4 text-cyan-400" />
                        )}
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                          Hop #{hop.hop_number}: {roleLabel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {hop.protocol && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            Protocol: {hop.protocol}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            hop.parser_confidence === 'high'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                              : hop.parser_confidence === 'medium'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                              : 'bg-slate-950 text-slate-400 border-slate-700'
                          }`}
                        >
                          Confidence: {hop.parser_confidence}
                        </span>
                      </div>
                    </div>

                    {/* Node Server Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* From Host / IP */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Sending Host / Infrastructure (From)
                        </span>
                        <div className="text-slate-200 font-bold break-all">
                          {hop.from_host || 'Unspecified Host'}
                        </div>
                        <div className="flex items-center space-x-1.5 text-cyan-300 font-mono text-[11px]">
                          <Network className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>IP: {hop.from_ip || 'No IP in header'}</span>
                        </div>
                      </div>

                      {/* By Host / IP */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Receiving Mail Server (By)
                        </span>
                        <div className="text-slate-200 font-bold break-all">
                          {hop.by_host || 'Unspecified Host'}
                        </div>
                        <div className="flex items-center space-x-1.5 text-cyan-300 font-mono text-[11px]">
                          <Network className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>IP: {hop.by_ip || 'No IP in header'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Row: ID, Recipient, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {hop.timestamp && (
                          <div className="flex items-center space-x-1 text-slate-300">
                            <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{hop.timestamp}</span>
                          </div>
                        )}
                        {hop.id && (
                          <div className="text-slate-400">
                            ID: <span className="text-slate-200">{hop.id}</span>
                          </div>
                        )}
                        {hop.recipient && (
                          <div className="text-slate-400">
                            For: <span className="text-slate-200">&lt;{hop.recipient}&gt;</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleHopExpand(hop.hop_number)}
                        className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-bold focus:outline-none"
                      >
                        <span>{isExpanded ? 'Hide Raw Header' : 'View Raw Received Header'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Raw Header Box */}
                    {isExpanded && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 mt-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Original Received Header Text:
                        </span>
                        <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap break-all bg-slate-900/80 p-2.5 rounded border border-slate-800">
                          {hop.raw}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Inter-hop Direction Arrow */}
                  {idx < activeHops.length - 1 && (
                    <div className="flex items-center justify-center my-1.5">
                      <ArrowDown className="w-4 h-4 text-cyan-500/70 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
