import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  ShieldAlert,
  AlertTriangle,
  FolderLock,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Radio,
  Zap,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { CHART_DATA_TRENDS, CHART_DATA_GEOLOCATIONS, SAMPLE_EMAILS } from '../data/mockData';
import { RiskBadge } from '../components/common/RiskBadge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Launcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-widest">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SECURITY OPERATIONS CENTER (SOC) PLATFORM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
            MailTrace AI Cyber Forensics
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time automated ingestion, SMTP relay reconstruction, NLP social engineering scoring, IP geolocation correlation, and threat attribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/analyze')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>ANALYZE SUSPICIOUS EML</span>
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-all"
          >
            <FolderLock className="w-4 h-4 text-cyan-400" />
            <span>INVESTIGATIONS</span>
          </button>
        </div>
      </div>

      {/* 4 Standard Summary Metric Cards as specified in Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emails Analyzed */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Emails Analyzed
            </span>
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-100">14,289</span>
            <span className="flex items-center text-xs font-mono font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +12.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Across 42 corporate mail gateways
          </p>
        </div>

        {/* Card 2: Threats Detected */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Threats Detected
            </span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-100">1,842</span>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
              12.8% Rate
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Phishing, BEC & Lookalike domains
          </p>
        </div>

        {/* Card 3: High-Risk Incidents */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              High-Risk Incidents
            </span>
            <div className="p-2 rounded-xl bg-red-950/60 text-red-400 border border-red-800/60 glow-red">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-100">329</span>
            <span className="text-xs font-mono font-bold text-red-400 animate-pulse">
              ACTION REQUIRED
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Urgent payment diversion & SSO phish
          </p>
        </div>

        {/* Card 4: Active Investigations */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              Active Investigations
            </span>
            <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/60">
              <FolderLock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-100">18</span>
            <span className="text-xs font-mono font-bold text-purple-300">
              3 Critical
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Assigned to Tier-2 SOC Analysts
          </p>
        </div>
      </div>

      {/* Main Forensic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Detection Trends Over Time Chart */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-sans flex items-center space-x-2">
                <span>7-Day Email Threat Vector Volume</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Comparative volume of Legitimate vs BEC & Phishing threats
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800">
              LIVE FEED SYNC
            </span>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPhish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBEC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                    fontFamily: 'monospace'
                  }}
                />
                <Area type="monotone" dataKey="Phishing" stroke="#ef4444" fillOpacity={1} fill="url(#colorPhish)" />
                <Area type="monotone" dataKey="BEC" stroke="#f59e0b" fillOpacity={1} fill="url(#colorBEC)" />
                <Area type="monotone" dataKey="Legitimate" stroke="#10b981" fillOpacity={1} fill="url(#colorLegit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Origin Geolocation Breakdown */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 font-sans">
                  Origin Country Threat Index
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Top 7 Nodes</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Originating IP servers detected across header chains
            </p>

            <div className="space-y-3">
              {CHART_DATA_GEOLOCATIONS.slice(0, 5).map((geo) => (
                <div key={geo.country} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-semibold">{geo.country}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">{geo.count} attacks</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800">
                        {geo.riskScore}% Risk
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-red-500 rounded-full"
                      style={{ width: `${(geo.count / 500) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/intelligence')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold border border-slate-800 flex items-center justify-center space-x-1.5 transition-all"
          >
            <span>VIEW GEOLOCATION MAP INTEL</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High-Risk Incident Queue & Recent Scan Feed */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-sans flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>High-Priority Forensic Queue</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live suspicious emails processed by Fraudulent Email Detection Engine
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>SEE ALL INVESTIGATIONS</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Subject / Deceptive Identity</th>
                <th className="py-3 px-3">Sender Email & Return-Path</th>
                <th className="py-3 px-3">Origin IP / Country</th>
                <th className="py-3 px-3">Protocols</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {SAMPLE_EMAILS.map((email) => (
                <tr key={email.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <RiskBadge severity={email.severity} score={email.riskScore} showScore />
                  </td>
                  <td className="py-3.5 px-3 max-w-[240px]">
                    <div className="font-semibold text-slate-200 truncate">{email.subject}</div>
                    <div className="text-[11px] text-cyan-400 truncate">{email.senderName}</div>
                  </td>
                  <td className="py-3.5 px-3 max-w-[200px]">
                    <div className="text-slate-300 truncate">{email.senderEmail}</div>
                    <div className="text-[10px] text-slate-500 truncate">RP: {email.returnPath}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-slate-200 font-bold">{email.originGeo.ip}</div>
                    <div className="text-[11px] text-slate-400">{email.originGeo.city}, {email.originGeo.country}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex space-x-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${email.protocols.spf === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                        SPF: {email.protocols.spf}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${email.protocols.dkim === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                        DKIM: {email.protocols.dkim}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => navigate(`/analyze?id=${email.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 text-xs font-semibold transition-all inline-flex items-center space-x-1"
                    >
                      <span>INSPECT EML</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
