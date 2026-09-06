import React from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { MetadataRow } from './MetadataRow';
import { AuthenticationSection } from './AuthenticationSection';
import { User, Info, Layers, Activity } from 'lucide-react';

interface OverviewTabProps {
  email: EmailAnalysis;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ email }) => {
  const receivedHopsCount = email.received?.length || 0;
  const urlsCount = email.urls?.length || 0;
  const attachmentsCount = email.attachments?.length || 0;

  const ipsCount = email.ips?.length || 0;
  const domainsCount = email.domains?.length || 0;
  const emailsCount = email.emails?.length || 0;

  return (
    <div className="space-y-6">
      {/* Authentication & Alignment Section */}
      <AuthenticationSection authentication={email.authentication} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Sender Information */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
            <User className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              A. Sender Information
            </h3>
          </div>
          <div className="space-y-2">
            <MetadataRow label="From" value={email.from} allowCopy />
            <MetadataRow label="Reply-To" value={email.reply_to} allowCopy />
            <MetadataRow label="Return-Path" value={email.return_path} allowCopy />
          </div>
        </div>

        {/* Section B: Message Information */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              B. Message Information
            </h3>
          </div>
          <div className="space-y-2">
            <MetadataRow label="Subject" value={email.subject} isMonospace={false} />
            <MetadataRow label="Date" value={email.date} />
            <MetadataRow label="Message-ID" value={email.message_id} allowCopy />
            <MetadataRow label="To" value={email.to} />
            <MetadataRow label="Cc" value={email.cc} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section C: Email Structure Summary */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              C. Email Structure
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-cyan-400">{receivedHopsCount}</span>
              <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Received Hops
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-blue-400">{urlsCount}</span>
              <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                URLs Detected
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-emerald-400">{attachmentsCount}</span>
              <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Attachments
              </p>
            </div>
          </div>
        </div>

        {/* Section D: Quick Indicator Summary */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              D. Quick Indicator Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-xl font-bold font-mono text-slate-200">{ipsCount}</span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">IPs</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-xl font-bold font-mono text-slate-200">{domainsCount}</span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">Domains</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-xl font-bold font-mono text-slate-200">{urlsCount}</span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">URLs</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <span className="text-xl font-bold font-mono text-slate-200">{emailsCount}</span>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">Emails</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
