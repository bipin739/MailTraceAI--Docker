import React from 'react';
import type {
  EmailAnalysis,
  DomainIndicator,
  URLIndicator,
  EmailAddressIndicator,
  AttachmentIndicator
} from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { IPIntelligenceSection } from './IPIntelligenceSection';
import { Link, Globe, Mail, Hash, Paperclip, Shield } from 'lucide-react';

interface IndicatorsTabProps {
  email: EmailAnalysis;
}

export const IndicatorsTab: React.FC<IndicatorsTabProps> = ({ email }) => {
  const indicators = email.indicators || {};

  // Resolve Domain indicators
  const domainList: DomainIndicator[] = indicators.domains && indicators.domains.length > 0
    ? indicators.domains
    : (email.domains || []).map(d => ({ value: d, source: 'extracted' }));

  // Resolve URL indicators
  const urlList: URLIndicator[] = indicators.urls && indicators.urls.length > 0
    ? indicators.urls
    : (email.urls || []).map(u => ({ value: u, source: 'body' }));

  // Resolve Email indicators
  const emailList: EmailAddressIndicator[] = indicators.email_addresses && indicators.email_addresses.length > 0
    ? indicators.email_addresses
    : (email.emails || []).map(e => ({ value: e, source: 'header' }));

  // Resolve Attachment indicators
  const attachmentList: AttachmentIndicator[] = indicators.attachments && indicators.attachments.length > 0
    ? indicators.attachments
    : (email.attachments || []).map(att => ({
        filename: att.filename,
        mime_type: att.mime_type,
        size: att.size,
        sha256: att.sha256 || 'N/A'
      }));

  const evidenceSha256 = email.email_sha256 || 'Not available';

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Evidence Hash Card */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Evidence SHA-256 Hash
            </h3>
          </div>
          {email.email_sha256 && (
            <CopyButton text={email.email_sha256} label="Copy Hash" />
          )}
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-mono text-slate-200 break-all select-all font-semibold">
              {evidenceSha256}
            </span>
          </div>
        </div>
      </div>

      {/* IP Addresses Intelligence & Infrastructure */}
      <IPIntelligenceSection email={email} />

      {/* Domains */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <Globe className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Domains ({domainList.length})
          </h3>
        </div>

        {domainList.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 italic p-2">
            No domains detected.
          </p>
        ) : (
          <div className="space-y-2">
            {domainList.map((domain, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors gap-3"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    Extracted Indicator
                  </span>
                  <span className="text-xs font-mono text-slate-200 break-all select-all font-semibold">
                    {domain.value}
                  </span>
                  {domain.source && (
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block truncate">
                      ({domain.source})
                    </span>
                  )}
                </div>
                <CopyButton text={domain.value} iconOnly className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URLs */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <Link className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            URLs ({urlList.length})
          </h3>
        </div>

        {urlList.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 italic p-2">
            No URLs detected.
          </p>
        ) : (
          <div className="space-y-2">
            {urlList.map((urlObj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors gap-3"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    Extracted Indicator
                  </span>
                  {/* Non-clickable readable text representation */}
                  <span className="text-xs font-mono text-slate-200 break-all select-all">
                    {urlObj.value}
                  </span>
                  {urlObj.source && (
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block truncate">
                      ({urlObj.source})
                    </span>
                  )}
                </div>
                <CopyButton text={urlObj.value} iconOnly className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Addresses */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <Mail className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Email Addresses ({emailList.length})
          </h3>
        </div>

        {emailList.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 italic p-2">
            No email addresses detected.
          </p>
        ) : (
          <div className="space-y-2">
            {emailList.map((emailObj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors gap-3"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    Extracted Indicator
                  </span>
                  <span className="text-xs font-mono text-slate-200 break-all select-all">
                    {emailObj.value}
                  </span>
                  {emailObj.source && (
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block truncate">
                      ({emailObj.source})
                    </span>
                  )}
                </div>
                <CopyButton text={emailObj.value} iconOnly className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachment Hashes */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <Paperclip className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Attachment Hashes ({attachmentList.length})
          </h3>
        </div>

        {attachmentList.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 italic p-2">
            No attachments detected.
          </p>
        ) : (
          <div className="space-y-3">
            {attachmentList.map((att, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">
                    {att.filename || 'Unnamed Attachment'} ({formatFileSize(att.size)})
                  </span>
                  {att.sha256 && <CopyButton text={att.sha256} label="Copy SHA-256" />}
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">SHA-256:</span>
                    <span className="break-all select-all font-semibold">{att.sha256 || 'N/A'}</span>
                  </div>
                  {att.md5 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">MD5:</span>
                      <span className="break-all select-all">{att.md5}</span>
                    </div>
                  )}
                  {att.sha1 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">SHA-1:</span>
                      <span className="break-all select-all">{att.sha1}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
