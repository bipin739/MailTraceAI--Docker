import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  ShieldAlert,
  AlertTriangle,
  FolderLock,
  ArrowUpRight,
  RefreshCw,
  Globe,
  Radio,
  Zap,
  ChevronRight,
  ShieldX,
  Server,
  Activity,
  CheckCircle2,
  FileSearch,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import type { DashboardSummary } from '../types/dashboard';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/30' },
  investigating: { label: 'Investigating', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
  escalated: { label: 'Escalated', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
};

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  critical: { label: 'Critical', badge: 'bg-red-950/60 text-red-400 border border-red-800/60 font-bold', color: '#ef4444' },
  high: { label: 'High', badge: 'bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold', color: '#f59e0b' },
  medium: { label: 'Medium', badge: 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/60', color: '#eab308' },
  low: { label: 'Low', badge: 'bg-slate-800/80 text-slate-300 border border-slate-700/80', color: '#64748b' },
  suspicious: { label: 'Suspicious', badge: 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/60', color: '#eab308' },
};

const formatTimestamp = (isoString?: string): string => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
};

const formatRelativeTime = (isoString?: string): string => {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/dashboard/summary?days=30&recent_limit=5');
      if (!res.ok) {
        throw new Error(`Failed to load dashboard telemetry: HTTP ${res.status}`);
      }
      const data: DashboardSummary = await res.json();
      setSummary(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown telemetry retrieval error';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = summary?.metrics;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner & Quick Launcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 border border-slate-800/80 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2.5 text-cyan-400 font-mono text-xs mb-1.5 font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>SECURITY OPERATIONS CENTER (SOC) PLATFORM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-semibold">LIVE TELEMETRY</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
            Security Operations & Email Forensics
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl font-mono">
            Automated RFC-822 header ingestion, SMTP relay reconstruction, intent heuristics, and forensic telemetry attribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
            title="Refresh dashboard telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'SYNCING...' : 'SYNC'}</span>
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>ANALYZE SUSPICIOUS EML</span>
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            <FolderLock className="w-4 h-4 text-cyan-400" />
            <span>INVESTIGATIONS</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>Failed to connect to forensic telemetry service: {error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Standard Summary Metric Cards - Real Backend Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emails Analyzed */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Emails Analyzed
            </span>
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="h-8 w-20 bg-slate-800/70 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold font-mono text-slate-100">
                {(metrics?.emails_analyzed ?? 0).toLocaleString()}
              </span>
            )}
            <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Total Ingested
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Verified RFC-822 evidence records
          </p>
        </div>

        {/* Card 2: Threats Detected */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Threats Detected
            </span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/50">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="h-8 w-20 bg-slate-800/70 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold font-mono text-slate-100">
                {(metrics?.threats_detected ?? 0).toLocaleString()}
              </span>
            )}
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50">
              {metrics && metrics.emails_analyzed > 0
                ? `${((metrics.threats_detected / metrics.emails_analyzed) * 100).toFixed(1)}% Rate`
                : '0.0% Rate'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Phishing, BEC & lookalike domains
          </p>
        </div>

        {/* Card 3: Critical Emails */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Critical Emails
            </span>
            <div className="p-2 rounded-xl bg-red-950/60 text-red-400 border border-red-800/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="h-8 w-20 bg-slate-800/70 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold font-mono text-slate-100">
                {(metrics?.critical_emails ?? 0).toLocaleString()}
              </span>
            )}
            <span className="text-xs font-mono font-bold text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/50">
              Score ≥ 80
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            High-confidence malicious attacks
          </p>
        </div>

        {/* Card 4: Open Cases */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Open Cases
            </span>
            <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/50">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="h-8 w-20 bg-slate-800/70 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold font-mono text-slate-100">
                {(metrics?.open_cases ?? 0).toLocaleString()}
              </span>
            )}
            <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Investigations currently in progress
          </p>
        </div>
      </div>

      {/* Main Forensic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analysis Trend Chart */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 font-sans flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Recent Analysis Trend</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ingested email volume and detected threat activity over time
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50">
              LAST 30 DAYS
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-900/40 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-xs font-mono text-slate-500">Loading analysis timeline...</span>
              </div>
            ) : summary?.analysis_trend && summary.analysis_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.analysis_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trendThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Emails Analyzed"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#trendTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="threats"
                    name="Threats Detected"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#trendThreats)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <FileSearch className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs font-mono text-slate-400 font-semibold">No Trend Telemetry Available</span>
                <span className="text-[11px] font-mono text-slate-500 mt-1 max-w-sm">
                  Ingested emails will automatically populate the temporal analysis curve.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Threat Severity Distribution Chart */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-100 font-sans flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Threat Severity Distribution</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Categorized risk posture across analyzed emails
            </p>

            {loading ? (
              <div className="h-56 bg-slate-900/40 rounded-xl animate-pulse" />
            ) : summary?.severity_distribution && summary.severity_distribution.length > 0 ? (
              <div className="space-y-3">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.severity_distribution} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#1e293b',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#f8fafc',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Bar dataKey="count" name="Emails" radius={[4, 4, 0, 0]}>
                        {summary.severity_distribution.map((entry) => (
                          <Cell
                            key={entry.severity}
                            fill={SEVERITY_CONFIG[entry.severity.toLowerCase()]?.color || '#38bdf8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
                  {summary.severity_distribution.map((item) => (
                    <div key={item.severity} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="capitalize text-slate-300">{item.severity}</span>
                      <span className="font-bold text-slate-100">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs font-mono text-slate-400 font-semibold">No Severity Telemetry</span>
                <span className="text-[11px] font-mono text-slate-500 mt-1">
                  Evaluated risk scores will be categorized here.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Forensic Indicators Grid: Domains, Countries, Authentication */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Suspicious Domains */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Top Suspicious Domains
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">OBSERVED</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Lookalike & extracted hostnames from emails
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-900/50 rounded animate-pulse" />
                ))}
              </div>
            ) : summary?.top_suspicious_domains && summary.top_suspicious_domains.length > 0 ? (
              <div className="space-y-2.5">
                {summary.top_suspicious_domains.map((item) => (
                  <div
                    key={item.domain}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="text-cyan-300 font-semibold truncate max-w-[200px]" title={item.domain}>
                      {item.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                      {item.count} {item.count === 1 ? 'hit' : 'hits'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs font-mono text-slate-500">
                No suspicious domains observed yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Observed Infrastructure Countries */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Infrastructure Countries
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">RELAY HOPS</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Originating IP servers detected across hops
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-900/50 rounded animate-pulse" />
                ))}
              </div>
            ) : summary?.top_countries && summary.top_countries.length > 0 ? (
              <div className="space-y-2.5">
                {summary.top_countries.map((item) => (
                  <div
                    key={item.country}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="text-slate-200 font-semibold truncate">
                      {item.country}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 text-[11px] font-bold border border-cyan-800/60">
                      {item.count} {item.count === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs font-mono text-slate-500">
                No infrastructure nodes detected yet.
              </div>
            )}
          </div>
        </div>

        {/* Authentication Failure Breakdown */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ShieldX className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">
                  Authentication Failures
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">PROTOCOL CHECKS</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              SPF, DKIM, and DMARC verification results
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-900/50 rounded animate-pulse" />
                ))}
              </div>
            ) : summary?.auth_failures && summary.auth_failures.total_evaluated > 0 ? (
              <div className="space-y-2.5">
                {/* SPF Failures */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800">
                      SPF
                    </span>
                    <span className="text-slate-300">Sender Policy Failures</span>
                  </div>
                  <span className="font-bold text-red-400">{summary.auth_failures.spf_failures}</span>
                </div>

                {/* DKIM Failures */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                      DKIM
                    </span>
                    <span className="text-slate-300">Signature Failures</span>
                  </div>
                  <span className="font-bold text-amber-400">{summary.auth_failures.dkim_failures}</span>
                </div>

                {/* DMARC Failures */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold border border-rose-800">
                      DMARC
                    </span>
                    <span className="text-slate-300">Alignment Failures</span>
                  </div>
                  <span className="font-bold text-rose-400">{summary.auth_failures.dmarc_failures}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs font-mono text-slate-500">
                No authentication checks recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans flex items-center space-x-2">
              <FolderLock className="w-5 h-5 text-cyan-400" />
              <span>Recent Investigations</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Active forensic case tracking and evidentiary custody
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>SEE ALL INVESTIGATIONS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Case</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Emails</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-3">
                      <div className="h-6 bg-slate-900/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : summary?.recent_cases && summary.recent_cases.length > 0 ? (
                summary.recent_cases.map((c) => {
                  const sevStyle = SEVERITY_CONFIG[c.severity?.toLowerCase()] || SEVERITY_CONFIG.low;
                  const statStyle = STATUS_CONFIG[c.status?.toLowerCase()] || STATUS_CONFIG.open;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate('/cases')}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3 max-w-[320px]">
                        <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{c.case_number}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${sevStyle.badge}`}>
                          {sevStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${statStyle.badge}`}>
                          {statStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {c.emails_count} {c.emails_count === 1 ? 'email' : 'emails'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {formatRelativeTime(c.updated_at)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/cases');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>OPEN</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderLock className="w-6 h-6 text-slate-600" />
                      <span>No active investigation cases recorded.</span>
                      <button
                        onClick={() => navigate('/cases')}
                        className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs hover:bg-cyan-900 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CREATE FIRST CASE</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Email Analyses Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans flex items-center space-x-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span>Recent Email Analyses</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live suspicious emails processed by Fraudulent Email Detection Engine
            </p>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
          >
            <span>INGEST NEW EMAIL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Sender</th>
                <th className="py-3 px-3 text-center">Threat Score</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-3">
                      <div className="h-6 bg-slate-900/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : summary?.recent_emails && summary.recent_emails.length > 0 ? (
                summary.recent_emails.map((email) => {
                  const sevStyle = SEVERITY_CONFIG[email.severity?.toLowerCase()] || SEVERITY_CONFIG.low;
                  const score = email.threat_score ?? 0;
                  const scoreColor =
                    score >= 80 ? 'text-red-400 bg-red-950/60 border-red-800' :
                    score >= 50 ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
                    score >= 25 ? 'text-yellow-300 bg-yellow-950/60 border-yellow-800' :
                    'text-emerald-400 bg-emerald-950/60 border-emerald-800';

                  return (
                    <tr
                      key={email.id}
                      onClick={() => navigate(`/analysis/${email.id}`)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3 max-w-[280px]">
                        <div className="font-semibold text-slate-200 truncate">{email.subject}</div>
                        {email.evidence_id && (
                          <div className="text-[10px] text-cyan-400 font-mono">{email.evidence_id}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 max-w-[240px]">
                        <div className="text-slate-300 truncate">{email.sender}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${scoreColor}`}>
                          {score.toFixed(0)} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${sevStyle.badge}`}>
                          {sevStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {formatTimestamp(email.timestamp)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/analysis/${email.id}`);
                          }}
                          className="px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>INSPECT</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Mail className="w-6 h-6 text-slate-600" />
                      <span>No parsed email analyses recorded yet.</span>
                      <button
                        onClick={() => navigate('/analyze')}
                        className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs hover:bg-cyan-900 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>INGEST SUSPICIOUS EML</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
