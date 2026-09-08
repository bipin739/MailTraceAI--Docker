import React, { useState } from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { FileText, Code, ShieldAlert, Eye, BrainCircuit, Info } from 'lucide-react';

interface ContentTabProps {
  email: EmailAnalysis;
}

export const ContentTab: React.FC<ContentTabProps> = ({ email }) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'source'>('preview');

  const plainText = email.plain_text_body || 'No plain text content detected.';
  const htmlBody = email.html_body;

  // Resolve ML phishing probability
  const resolvedProbability = typeof email.ml_phishing_probability === 'number'
    ? email.ml_phishing_probability
    : (email.ml_assessment && typeof email.ml_assessment.probability === 'number')
      ? email.ml_assessment.probability
      : null;

  // Sanitize HTML body for sandboxed preview:
  // Strictly block script, iframe, object, embed, form, event handlers, and remote image loading
  const createSafeSandboxDoc = (html: string): string => {
    let sanitized = html
      // 1. Strip dangerous tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<base\b[^>]*>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      // 2. Strip standalone dangerous tags
      .replace(/<\/?(?:script|iframe|object|embed|applet|form|base|meta)\b[^>]*>/gi, '')
      // 3. Strip all event handlers (quoted and unquoted)
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // 4. Strip javascript: and vbscript: URIs
      .replace(/(?:href|src|action)\s*=\s*["']?\s*(?:javascript|vbscript):[^"'>]+["']?/gi, 'href="#"')
      // 5. Block remote images
      .replace(/<img\b([^>]*?)\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']([^>]*?)>/gi, '<div class="blocked-image">[Remote Image Blocked: $2]</div>');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'none' data:; style-src 'unsafe-inline'; form-action 'none';">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #e2e8f0;
    background-color: #090d16;
    padding: 16px;
    line-height: 1.6;
    word-break: break-word;
  }
  a {
    color: #94a3b8 !important;
    text-decoration: underline !important;
    pointer-events: none !important;
    cursor: not-allowed !important;
  }
  .blocked-image {
    display: inline-block;
    padding: 4px 8px;
    margin: 4px 0;
    border: 1px dashed #475569;
    border-radius: 4px;
    background: #0f172a;
    color: #94a3b8;
    font-size: 11px;
    font-family: monospace;
  }
  img {
    display: none !important;
  }
</style>
</head>
<body>
${sanitized}
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Section 11: Content ML Assessment Header Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Content ML Assessment
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-800 text-purple-300">
              TF-IDF + Logistic Regression
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">
              ML content assessment
            </span>
          </div>
        </div>

        {resolvedProbability !== null ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="flex items-baseline space-x-3">
                <span className="text-xs font-mono text-slate-400">
                  Phishing probability:
                </span>
                <span className={`text-2xl font-bold font-mono ${
                  resolvedProbability >= 0.70
                    ? 'text-rose-400'
                    : resolvedProbability >= 0.40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}>
                  {Math.round(resolvedProbability * 100)}%
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                  resolvedProbability >= 0.50
                    ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                }`}>
                  {email.ml_assessment?.classification || (resolvedProbability >= 0.50 ? 'phishing' : 'legitimate')}
                </span>
                {email.ml_assessment?.confidence && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ({email.ml_assessment.confidence} confidence)
                  </span>
                )}
              </div>

              {email.ml_assessment?.top_features && email.ml_assessment.top_features.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400">Key tokens:</span>
                  {email.ml_assessment.top_features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-purple-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Probability Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    resolvedProbability >= 0.70
                      ? 'bg-rose-500'
                      : resolvedProbability >= 0.40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(resolvedProbability * 100, 2)}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-slate-300">Model Scope:</strong> "ML content assessment" isolates lexical and language patterns in the email text alone. It serves as an auxiliary signal and is clearly distinguished from the deterministic "Overall threat score", which aggregates forensic authentication, server relays, URLs, and lookalikes with a bounded ML weighting.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>ML Content Assessment unavailable or email body empty. Forensic inspection remains fully functional.</span>
          </div>
        )}
      </div>
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
