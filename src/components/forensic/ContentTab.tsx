import React, { useState } from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { FileText, Code, ShieldAlert, Eye } from 'lucide-react';

interface ContentTabProps {
  email: EmailAnalysis;
}

export const ContentTab: React.FC<ContentTabProps> = ({ email }) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'source'>('preview');

  const plainText = email.plain_text_body || 'No plain text content detected.';
  const htmlBody = email.html_body;

  // Sanitize HTML body for sandboxed preview:
  // Remove script tags, inline event handlers (on*), remote image automatic fetches
  const createSafeSandboxDoc = (html: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #e2e8f0;
    background-color: #090d16;
    padding: 16px;
    line-height: 1.6;
    word-break: break-word;
  }
  a { color: #38bdf8; text-decoration: underline; }
  img { max-width: 100%; border: 1px dashed #475569; padding: 4px; display: block; margin: 8px 0; }
  img::before { content: "[Remote Image Blocked]"; display: block; color: #94a3b8; font-size: 11px; }
</style>
</head>
<body>
${html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')}
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Sub-Section 1: Plain Text Body */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Plain Text Body
            </h3>
          </div>
          {email.plain_text_body && (
            <CopyButton text={email.plain_text_body} label="Copy Plain Text" />
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {plainText}
        </div>
      </div>

      {/* Sub-Section 2: HTML Body */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              HTML Body Content
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                  activeSubTab === 'preview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('source')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                  activeSubTab === 'source'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Source</span>
              </button>
            </div>

            {htmlBody && (
              <CopyButton text={htmlBody} label="Copy HTML" />
            )}
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Security Active: HTML scripts, event handlers, and automatic remote image fetches are strictly isolated.
          </span>
        </div>

        {!htmlBody ? (
          <p className="text-xs font-mono text-slate-500 italic p-3">
            No HTML body content present in this email.
          </p>
        ) : activeSubTab === 'preview' ? (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/90 min-h-[250px]">
            <iframe
              title="Safe Email HTML Preview"
              srcDoc={createSafeSandboxDoc(htmlBody)}
              sandbox=""
              className="w-full h-80 border-0"
            />
          </div>
        ) : (
          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed max-h-96 overflow-y-auto">
            {htmlBody}
          </pre>
        )}
      </div>
    </div>
  );
};
