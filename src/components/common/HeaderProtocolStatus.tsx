import React from 'react';
import type { SecurityProtocolStatus } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface HeaderProtocolStatusProps {
  protocols: SecurityProtocolStatus;
}

export const HeaderProtocolStatus: React.FC<HeaderProtocolStatusProps> = ({ protocols }) => {
  const getIcon = (status: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'NEUTRAL':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'NONE':
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBadgeColor = (status: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE') => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
      case 'FAIL':
        return 'bg-red-950/60 border-red-800/80 text-red-300';
      case 'NEUTRAL':
        return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
      case 'NONE':
      default:
        return 'bg-slate-900 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* SPF Card */}
      <div className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${getBadgeColor(protocols.spf)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getIcon(protocols.spf)}
            <span className="font-mono font-bold text-sm tracking-wider">SPF VALIDATION</span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
            {protocols.spf}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {protocols.spfDetails}
        </p>
      </div>

      {/* DKIM Card */}
      <div className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${getBadgeColor(protocols.dkim)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getIcon(protocols.dkim)}
            <span className="font-mono font-bold text-sm tracking-wider">DKIM SIGNATURE</span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
            {protocols.dkim}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {protocols.dkimDetails}
        </p>
      </div>

      {/* DMARC Card */}
      <div className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${getBadgeColor(protocols.dmarc)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getIcon(protocols.dmarc)}
            <span className="font-mono font-bold text-sm tracking-wider">DMARC POLICY</span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
            {protocols.dmarc}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {protocols.dmarcDetails}
        </p>
      </div>

      {/* Alignment & Reply-To Bar */}
      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${protocols.returnPathMatch ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-red-950/40 border-red-900/80 text-red-300'}`}>
          <div className="flex items-center space-x-2">
            {protocols.returnPathMatch ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs font-medium">Return-Path Domain Alignment</span>
          </div>
          <span className={`text-xs font-mono font-semibold ${protocols.returnPathMatch ? 'text-emerald-400' : 'text-red-400'}`}>
            {protocols.returnPathMatch ? 'ALIGNED' : 'MISMATCH / SPOOFED'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${!protocols.replyToMismatch ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-amber-950/40 border-amber-900/80 text-amber-300'}`}>
          <div className="flex items-center space-x-2">
            {!protocols.replyToMismatch ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-medium">Reply-To Address Consistency</span>
          </div>
          <span className={`text-xs font-mono font-semibold ${!protocols.replyToMismatch ? 'text-emerald-400' : 'text-amber-400'}`}>
            {!protocols.replyToMismatch ? 'MATCHED' : 'DECEPTIVE MISMATCH'}
          </span>
        </div>
      </div>
    </div>
  );
};
