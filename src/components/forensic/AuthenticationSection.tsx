import React from 'react';
import type { AuthenticationAnalysis } from '../../types/forensic';
import { ShieldCheck, ShieldAlert, ShieldX, Info, AlertTriangle, ArrowRight } from 'lucide-react';

interface AuthenticationSectionProps {
  authentication?: AuthenticationAnalysis;
}

export const AuthenticationSection: React.FC<AuthenticationSectionProps> = ({ authentication }) => {
  const spf = authentication?.spf || { result: 'none' };
  const dkim = authentication?.dkim || { result: 'none' };
  const dmarc = authentication?.dmarc || { result: 'none' };
  const alignment = authentication?.alignment || {};

  const getStatusStyle = (res?: string) => {
    switch (res?.toLowerCase()) {
      case 'pass':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
      case 'fail':
      case 'permerror':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
          icon: <ShieldX className="w-4 h-4 text-rose-400" />
        };
      case 'softfail':
      case 'temperror':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />
        };
      case 'neutral':
      case 'none':
      default:
        return {
          bg: 'bg-slate-900 text-slate-400 border-slate-700',
          icon: <Info className="w-4 h-4 text-slate-400" />
        };
    }
  };

  const spfStyle = getStatusStyle(spf.result);
  const dkimStyle = getStatusStyle(dkim.result);
  const dmarcStyle = getStatusStyle(dmarc.result);

  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-5 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Email Authentication & Alignment Evidence
          </h3>
        </div>
      </div>

      {/* Security Notice Banner */}
      <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300 block">Header Evidence Limitation Notice</span>
          <span className="text-slate-400 text-[11px]">
            {authentication?.verification_notice ||
              'Observed authentication result from supplied headers (unverified by local mail server). Header values may be spoofed.'}
          </span>
        </div>
      </div>

      {/* Protocol Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* SPF */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">SPF</span>
            <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold uppercase border ${spfStyle.bg}`}>
              {spfStyle.icon}
              <span>{spf.result || 'NONE'}</span>
            </div>
          </div>
          {spf.details && (
            <p className="text-[10px] font-mono text-slate-400 break-all truncate" title={spf.details}>
              {spf.details}
            </p>
          )}
        </div>

        {/* DKIM */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">DKIM</span>
            <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold uppercase border ${dkimStyle.bg}`}>
              {dkimStyle.icon}
              <span>{dkim.result || 'NONE'}</span>
            </div>
          </div>
          {dkim.details && (
            <p className="text-[10px] font-mono text-slate-400 break-all truncate" title={dkim.details}>
              {dkim.details}
            </p>
          )}
        </div>

        {/* DMARC */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">DMARC</span>
            <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold uppercase border ${dmarcStyle.bg}`}>
              {dmarcStyle.icon}
              <span>{dmarc.result || 'NONE'}</span>
            </div>
          </div>
          {dmarc.details && (
            <p className="text-[10px] font-mono text-slate-400 break-all truncate" title={dmarc.details}>
              {dmarc.details}
            </p>
          )}
        </div>
      </div>

      {/* Sender Alignment Analysis Card */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-3 font-mono text-xs">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Sender Domain Alignment
        </h4>

        <div className="space-y-2 pt-1">
          {/* From Domain */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px]">From Domain</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
            <span className="font-bold text-slate-200">{alignment.from_domain || 'Not available'}</span>
          </div>

          {/* Reply-To Domain */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px]">Reply-To Domain</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200">
                {alignment.reply_to_domain || (alignment.from_domain ? `${alignment.from_domain} (defaults to From)` : 'Not specified')}
              </span>
              {alignment.reply_to_mismatch && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-950/90 text-amber-300 border border-amber-800/90 font-extrabold">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Domain Mismatch</span>
                </span>
              )}
            </div>
          </div>

          {/* Return-Path Domain */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px]">Return-Path Domain</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200">{alignment.return_path_domain || 'Not available'}</span>
              {alignment.return_path_mismatch && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-950/90 text-amber-300 border border-amber-800/90 font-extrabold">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Domain Mismatch</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
