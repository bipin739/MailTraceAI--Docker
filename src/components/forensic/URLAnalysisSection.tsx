import React, { useState } from 'react';
import {
  Link2,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Search,
  Info
} from 'lucide-react';
import type { EmailAnalysis, URLAnalysisResult } from '../../types/forensic';
import { CopyButton } from './CopyButton';

interface URLAnalysisSectionProps {
  email: EmailAnalysis;
}

export const URLAnalysisSection: React.FC<URLAnalysisSectionProps> = ({ email }) => {
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'mismatch' | 'shortener'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const urlList: URLAnalysisResult[] = email.url_analysis || [];

  // Filtered list
  const filteredUrls = urlList.filter(item => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesUrl = item.url.toLowerCase().includes(q);
      const matchesDomain = item.domain.toLowerCase().includes(q);
      const matchesKw = item.features.suspicious_keywords.some(k => k.toLowerCase().includes(q));
      if (!matchesUrl && !matchesDomain && !matchesKw) return false;
    }

    // Category filter
    if (filter === 'suspicious') {
      return item.suspicion_score >= 25;
    }
    if (filter === 'mismatch') {
      return item.features.display_link_mismatch;
    }
    if (filter === 'shortener') {
      return item.features.is_shortener;
    }
    return true;
  });

  const mismatchCount = urlList.filter(u => u.features.display_link_mismatch).length;
  const suspiciousCount = urlList.filter(u => u.suspicion_score >= 25).length;
  const shortenerCount = urlList.filter(u => u.features.is_shortener).length;

  const getScoreBadge = (score: number, level: string) => {
    if (score >= 60 || level === 'high') {
      return {
        bg: 'bg-rose-950/50 border-rose-800 text-rose-300',
        dot: 'bg-rose-400',
        label: 'High Suspicion'
      };
    }
    if (score >= 25 || level === 'suspicious') {
      return {
        bg: 'bg-amber-950/50 border-amber-800 text-amber-300',
        dot: 'bg-amber-400',
        label: 'Suspicious'
      };
    }
    return {
      bg: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300',
      dot: 'bg-emerald-400',
      label: 'Low Suspicion'
    };
  };

  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Static URL Forensic Analysis ({urlList.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Non-invasive syntactic feature inspection. URLs remain non-clickable for security.
            </p>
          </div>
        </div>

        {/* Safety Note Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>No external requests made</span>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Analyzed</span>
          <span className="text-lg font-mono font-bold text-slate-100">{urlList.length}</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
          mismatchCount > 0
            ? 'border-rose-800/80 bg-rose-950/20 text-rose-300'
            : 'border-slate-800/80 bg-slate-900/50 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase">Link Mismatches</span>
            {mismatchCount > 0 && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <span className="text-lg font-mono font-bold">{mismatchCount}</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
          suspiciousCount > 0
            ? 'border-amber-800/80 bg-amber-950/20 text-amber-300'
            : 'border-slate-800/80 bg-slate-900/50 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase">Suspicious (Score &ge;25)</span>
            {suspiciousCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <span className="text-lg font-mono font-bold">{suspiciousCount}</span>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">URL Shorteners</span>
          <span className="text-lg font-mono font-bold text-slate-100">{shortenerCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              filter === 'all'
                ? 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({urlList.length})
          </button>
          <button
            onClick={() => setFilter('suspicious')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              filter === 'suspicious'
                ? 'bg-amber-950 border border-amber-800 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Suspicious ({suspiciousCount})
          </button>
          <button
            onClick={() => setFilter('mismatch')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              filter === 'mismatch'
                ? 'bg-rose-950 border border-rose-800 text-rose-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Link Mismatches ({mismatchCount})
          </button>
          <button
            onClick={() => setFilter('shortener')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              filter === 'shortener'
                ? 'bg-purple-950 border border-purple-800 text-purple-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Shorteners ({shortenerCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter URLs or domains..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* URL Cards List */}
      {filteredUrls.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/30">
          <p className="text-xs font-mono text-slate-400">
            {urlList.length === 0
              ? 'No URLs extracted from this email.'
              : 'No URLs match the selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUrls.map((item, idx) => {
            const badge = getScoreBadge(item.suspicion_score, item.suspicion_level);
            const { features } = item;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  features.display_link_mismatch
                    ? 'border-rose-800/80 bg-rose-950/10'
                    : item.suspicion_score >= 25
                    ? 'border-amber-800/70 bg-amber-950/10'
                    : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                {/* Header Row: Domain, Score Gauge, Level */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {item.domain}
                    </span>
                    {features.registered_domain && features.registered_domain !== item.domain && (
                      <span className="text-[10px] font-mono text-slate-400">
                        (Apex: {features.registered_domain})
                      </span>
                    )}
                    {features.is_ip_host && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-800 text-amber-300">
                        IPv{features.ip_version} Direct IP
                      </span>
                    )}
                    {features.is_shortener && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-800 text-purple-300">
                        Shortener
                      </span>
                    )}
                    {features.is_punycode && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-950 border border-pink-800 text-pink-300">
                        Punycode
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Static URL Score Badge */}
                    <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>Score: {item.suspicion_score}/100</span>
                      <span className="text-[10px] opacity-80 font-normal">({badge.label})</span>
                    </div>
                  </div>
                </div>

                {/* HTML Display Link Mismatch Banner */}
                {features.display_link_mismatch && (
                  <div className="mt-3 p-3 rounded-lg border border-rose-800/80 bg-rose-950/30 flex items-start space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-rose-300">
                        HTML Display Link Mismatch Detected
                      </div>
                      <p className="text-xs font-mono text-rose-200/90">
                        Visible text claimed <span className="font-bold underline text-white">{features.visible_text_domain || features.visible_text}</span>, but the actual destination points to <span className="font-bold underline text-rose-300">{item.domain}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Non-Clickable URL Presentation */}
                <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                      Observed URL (Safe Non-Clickable View)
                    </div>
                    {/* Plain non-clickable select-all text */}
                    <span className="text-xs font-mono text-slate-200 select-all break-all select-text font-medium">
                      {item.url}
                    </span>
                  </div>
                  {/* Copy button only */}
                  <CopyButton text={item.url} label="Copy URL" />
                </div>

                {/* Features Grid */}
                <div className="mt-3 pt-3 border-t border-slate-800/60">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 font-semibold">
                    Extracted Non-Invasive Features
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Scheme</span>
                      <span className="text-slate-200 font-semibold">{features.scheme.toUpperCase()}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Port</span>
                      <span className={features.has_non_standard_port ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                        {features.port !== null && features.port !== undefined ? features.port : 'Default'}
                        {features.has_non_standard_port ? ' (Non-std)' : ''}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Subdomain Count</span>
                      <span className={features.excessive_subdomains ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                        {features.subdomain_count} {features.excessive_subdomains ? '(High)' : ''}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Total Length</span>
                      <span className={features.total_length > 150 ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                        {features.total_length} chars
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Path / Query Len</span>
                      <span className="text-slate-200">
                        {features.path_length} / {features.query_length}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Percent Encoded</span>
                      <span className={features.percent_encoding_count >= 3 ? 'text-amber-300 font-semibold' : 'text-slate-200'}>
                        {features.percent_encoding_count > 0 ? `${features.percent_encoding_count} sequences` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suspicious Keywords Pills */}
                {features.suspicious_keywords.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 mr-1">Suspicious Keywords:</span>
                    {features.suspicious_keywords.map((kw, kwIdx) => (
                      <span
                        key={kwIdx}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 border border-amber-800 text-amber-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Lookalike Detection Finding if Present */}
                {features.lookalike && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs font-mono text-amber-200 font-semibold">
                        Potential {features.lookalike.brand_name} impersonation ({Math.round(features.lookalike.similarity * 100)}% match)
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {features.lookalike.techniques.map((tech, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-900/40 text-amber-300 border border-amber-700/60">
                          {tech.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Reasons & Observations */}
                {(item.score_reasons.length > 0 || item.observations.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Score Reasons */}
                    {item.score_reasons.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center space-x-1">
                          <Info className="w-3 h-3 text-cyan-400" />
                          <span>Score Contributions</span>
                        </span>
                        <ul className="space-y-1">
                          {item.score_reasons.map((reason, rIdx) => (
                            <li key={rIdx} className="text-xs font-mono text-slate-300 flex items-center space-x-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Observations */}
                    {item.observations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center space-x-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          <span>Forensic Observations</span>
                        </span>
                        <ul className="space-y-1">
                          {item.observations.map((obs, oIdx) => (
                            <li key={oIdx} className="text-xs font-mono text-slate-400 flex items-start space-x-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0 mt-1.5" />
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
