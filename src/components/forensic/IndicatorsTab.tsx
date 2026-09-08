import React from 'react';
import type {
  EmailAnalysis,
  EmailAddressIndicator,
  AttachmentIndicator
} from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { IPIntelligenceSection } from './IPIntelligenceSection';
import { DomainIntelligenceSection } from './DomainIntelligenceSection';
import { URLAnalysisSection } from './URLAnalysisSection';
import { Mail, Hash, Paperclip, Shield } from 'lucide-react';

interface IndicatorsTabProps {
  email: EmailAnalysis;
}

export const IndicatorsTab: React.FC<IndicatorsTabProps> = ({ email }) => {
  const indicators = email.indicators || {};

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
      <div className="bg-surface p-5 rounded-2xl border border-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Evidence SHA-256 Hash
            </h3>
          </div>
          {email.email_sha256 && (
            <CopyButton text={email.email_sha256} label="Copy Hash" />
          )}
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/60 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-mono text-foreground break-all select-all font-semibold">
              {evidenceSha256}
            </span>
          </div>
        </div>
      </div>

      {/* IP Addresses Intelligence & Infrastructure */}
      <IPIntelligenceSection email={email} />

      {/* Domain Infrastructure & Registration Intelligence */}
      <DomainIntelligenceSection email={email} />

      {/* Static URL Forensic Analysis */}
      <URLAnalysisSection email={email} />

      {/* Email Addresses */}
      <div className="bg-surface p-5 rounded-2xl border border-border space-y-3 shadow-xs">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
            Email Addresses ({emailList.length})
          </h3>
        </div>

        {emailList.length === 0 ? (
          <p className="text-xs font-mono text-foreground-subtle italic p-2">
            No email addresses detected.
          </p>
        ) : (
          <div className="space-y-2">
            {emailList.map((emailObj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-secondary/40 hover:bg-surface-secondary transition-colors gap-3"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface text-foreground-muted border border-border shrink-0">
                    Extracted Indicator
                  </span>
                  <span className="text-xs font-mono text-foreground break-all select-all">
                    {emailObj.value}
                  </span>
                  {emailObj.source && (
                    <span className="text-[10px] font-mono text-foreground-subtle hidden sm:inline-block truncate">
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
      <div className="bg-surface p-5 rounded-2xl border border-border space-y-3 shadow-xs">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Paperclip className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
            Attachment Hashes ({attachmentList.length})
          </h3>
        </div>

        {attachmentList.length === 0 ? (
          <p className="text-xs font-mono text-foreground-subtle italic p-2">
            No attachments detected.
          </p>
        ) : (
          <div className="space-y-3">
            {attachmentList.map((att, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-surface-secondary/40 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-bold">
                    {att.filename || 'Unnamed Attachment'} ({formatFileSize(att.size)})
                  </span>
                  {att.sha256 && <CopyButton text={att.sha256} label="Copy SHA-256" />}
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-foreground">
                    <span className="text-foreground-muted">SHA-256:</span>
                    <span className="break-all select-all font-semibold">{att.sha256 || 'N/A'}</span>
                  </div>
                  {att.md5 && (
                    <div className="flex items-center justify-between text-foreground">
                      <span className="text-foreground-muted">MD5:</span>
                      <span className="break-all select-all">{att.md5}</span>
                    </div>
                  )}
                  {att.sha1 && (
                    <div className="flex items-center justify-between text-foreground">
                      <span className="text-foreground-muted">SHA-1:</span>
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
