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
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Attachment Metadata Inspection ({attachments.length})
          </h3>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Static metadata inspection active. Attachment payloads are strictly unexecuted.
        </span>
      </div>

      {attachments.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
          <Paperclip className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400 font-semibold">
            No attachments detected in this email.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0 mt-0.5">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-mono font-bold text-slate-200 break-all">
                      {att.filename || 'Unnamed Attachment'}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Type: <span className="text-slate-300">{att.mime_type || 'application/octet-stream'}</span>
                    </p>
                  </div>
                </div>

                {att.filename && (
                  <CopyButton text={att.filename} label="Copy Name" iconOnly />
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
                <span className="text-slate-400">File Size:</span>
                <span className="text-cyan-300 font-bold">{formatFileSize(att.size)}</span>
              </div>

              {att.sha256 && (
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-slate-400 truncate">SHA-256: {att.sha256.substring(0, 16)}...</span>
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
