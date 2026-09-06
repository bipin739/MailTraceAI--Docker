import React from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { Target, Link, Globe, Server, Mail } from 'lucide-react';

interface IndicatorsTabProps {
  email: EmailAnalysis;
}

export const IndicatorsTab: React.FC<IndicatorsTabProps> = ({ email }) => {
  const urls = email.urls || [];
  const domains = email.domains || [];
  const ips = email.ips || [];
  const emails = email.emails || [];

  const renderIndicatorSection = (
    title: string,
    icon: React.ReactNode,
    items: string[],
    emptyMessage: string
  ) => (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            {title} ({items.length})
          </h3>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 italic p-2">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors gap-3"
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                  Extracted Indicator
                </span>
                <span className="text-xs font-mono text-slate-200 break-all select-all">
                  {item}
                </span>
              </div>
              <CopyButton text={item} iconOnly className="shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Informational banner */}
      <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
        <Target className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Extracted indicators are displayed as non-clickable technical values for safe forensic copy and investigation.
        </span>
      </div>

      {renderIndicatorSection(
        'Extracted URLs',
        <Link className="w-4 h-4 text-cyan-400" />,
        urls,
        'No URLs detected in email body.'
      )}

      {renderIndicatorSection(
        'Domains Detected',
        <Globe className="w-4 h-4 text-blue-400" />,
        domains,
        'No domains detected.'
      )}

      {renderIndicatorSection(
        'IP Addresses Detected',
        <Server className="w-4 h-4 text-emerald-400" />,
        ips,
        'No IP addresses detected.'
      )}

      {renderIndicatorSection(
        'Email Addresses Detected',
        <Mail className="w-4 h-4 text-purple-400" />,
        emails,
        'No email addresses detected.'
      )}
    </div>
  );
};
