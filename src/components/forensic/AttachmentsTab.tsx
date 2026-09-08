import React from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { Paperclip, File, ShieldCheck } from 'lucide-react';

interface AttachmentsTabProps {
  email: EmailAnalysis;
}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ email }) => {
  const attachments = (email.attachments && email.attachments.length > 0)
    ? email.attachments
    : (email.indicators?.attachments || []);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
            Attachment Metadata Inspection ({attachments.length})
          </h3>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-surface-secondary border border-border text-[11px] font-mono text-foreground-muted">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <span>
          Static metadata inspection active. Attachment payloads are strictly unexecuted.
        </span>
      </div>

      {attachments.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
          <Paperclip className="w-8 h-8 text-foreground-subtle mx-auto" />
          <p className="text-xs font-mono text-foreground-muted font-semibold">
            No attachments detected in this email.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-border bg-surface-secondary/40 hover:bg-surface-secondary transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-surface border border-border text-primary shrink-0 mt-0.5">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-mono font-bold text-foreground break-all">
                      {att.filename || 'Unnamed Attachment'}
                    </h4>
                    <p className="text-[11px] font-mono text-foreground-muted mt-0.5">
                      Type: <span className="text-foreground">{att.mime_type || 'application/octet-stream'}</span>
                    </p>
                  </div>
                </div>

                {att.filename && (
                  <CopyButton text={att.filename} label="Copy Name" iconOnly />
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs font-mono">
                <span className="text-foreground-muted">File Size:</span>
                <span className="text-foreground font-bold">{formatFileSize(att.size)}</span>
              </div>

              {att.sha256 && (
                <div className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-foreground-muted truncate">SHA-256: {att.sha256.substring(0, 16)}...</span>
                  <CopyButton text={att.sha256} label="Copy Hash" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
