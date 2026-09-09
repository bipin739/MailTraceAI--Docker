import React, { useState } from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { FileText, Code, ShieldAlert, Eye, BrainCircuit, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ContentTabProps {
  email: EmailAnalysis;
}

export const ContentTab: React.FC<ContentTabProps> = ({ email }) => {
  const { isDark } = useTheme();
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
  const createSafeSandboxDoc = (html: string, isDarkMode: boolean): string => {
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
    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
    background-color: ${isDarkMode ? '#0b0f17' : '#ffffff'};
    padding: 16px;
    line-height: 1.6;
    word-break: break-word;
  }
  a {
    color: ${isDarkMode ? '#38bdf8' : '#0284c7'} !important;
    text-decoration: underline !important;
    pointer-events: none !important;
    cursor: not-allowed !important;
  }
  .blocked-image {
    display: inline-block;
    padding: 4px 8px;
    margin: 4px 0;
    border: 1px dashed ${isDarkMode ? '#475569' : '#94a3b8'};
    border-radius: 4px;
    background: ${isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)'};
    color: ${isDarkMode ? '#94a3b8' : '#64748b'};
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
      <div className="bg-surface p-5 rounded-card border border-border space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Content ML Assessment
            </h3>
            <span className="px-2 py-0.5 rounded-control text-[10px] font-mono bg-surface-secondary border border-border text-foreground-muted">
              TF-IDF + Logistic Regression
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-foreground-muted">
              ML content assessment
            </span>
          </div>
        </div>

        {resolvedProbability !== null ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-control bg-surface-secondary/50 border border-border">
              <div className="flex items-baseline space-x-3">
                <span className="text-xs font-mono text-foreground-muted">
                  Phishing probability:
                </span>
                <span className={`text-2xl font-bold font-mono ${
                  resolvedProbability >= 0.70
                    ? 'text-danger'
                    : resolvedProbability >= 0.40
                      ? 'text-warning'
                      : 'text-success'
                }`}>
                  {Math.round(resolvedProbability * 100)}%
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                  resolvedProbability >= 0.50
                    ? 'bg-danger/10 border border-danger/30 text-danger'
                    : 'bg-success/10 border border-success/30 text-success'
                }`}>
                  {email.ml_assessment?.classification || (resolvedProbability >= 0.50 ? 'phishing' : 'legitimate')}
                </span>
                {email.ml_assessment?.confidence && (
                  <span className="text-[11px] font-mono text-foreground-subtle">
                    ({email.ml_assessment.confidence} confidence)
                  </span>
                )}
              </div>

              {email.ml_assessment?.top_features && email.ml_assessment.top_features.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-foreground-muted">Key tokens:</span>
                  {email.ml_assessment.top_features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-control text-[10px] font-mono bg-surface border border-border text-foreground"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Probability Bar */}
            <div className="space-y-1">
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-500 ${
                    resolvedProbability >= 0.70
                      ? 'bg-danger'
                      : resolvedProbability >= 0.40
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.max(resolvedProbability * 100, 2)}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-control bg-surface-secondary/60 border border-border text-[11px] font-mono text-foreground-muted flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span>
                <strong className="text-foreground">Model Scope:</strong> "ML content assessment" isolates lexical and language patterns in the email text alone. It serves as an auxiliary signal and is clearly distinguished from the deterministic "Overall threat score", which aggregates forensic authentication, server relays, URLs, and lookalikes with a bounded ML weighting.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-control bg-surface-secondary/40 border border-border text-xs font-mono text-foreground-muted flex items-center space-x-2">
            <Info className="w-4 h-4 text-foreground-subtle shrink-0" />
            <span>ML Content Assessment unavailable or email body empty. Forensic inspection remains fully functional.</span>
          </div>
        )}
      </div>

      {/* Sub-Section 1: Plain Text Body */}
      <div className="bg-surface p-5 rounded-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Plain Text Body
            </h3>
          </div>
          {email.plain_text_body && (
            <CopyButton text={email.plain_text_body} label="Copy Plain Text" />
          )}
        </div>

        <div className="p-4 rounded-control bg-surface-secondary/50 border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {plainText}
        </div>
      </div>

      {/* Sub-Section 2: HTML Body */}
      <div className="bg-surface p-5 rounded-card border border-border space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              HTML Body Content
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-surface-secondary p-1 rounded-control border border-border text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-control transition-colors cursor-pointer ${
                  activeSubTab === 'preview'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('source')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-control transition-colors cursor-pointer ${
                  activeSubTab === 'source'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
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
        <div className="flex items-center space-x-2 p-2.5 rounded-control bg-surface-secondary border border-border text-[11px] font-mono text-foreground-muted">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
          <span>
            Security Active: HTML scripts, event handlers, and automatic remote image fetches are strictly isolated.
          </span>
        </div>

        {!htmlBody ? (
          <p className="text-xs font-mono text-foreground-subtle italic p-3">
            No HTML body content present in this email.
          </p>
        ) : activeSubTab === 'preview' ? (
          <div className="rounded-control border border-border overflow-hidden bg-surface-secondary/70 min-h-[250px]">
            <iframe
              title="Safe Email HTML Preview"
              srcDoc={createSafeSandboxDoc(htmlBody, isDark)}
              sandbox=""
              className="w-full h-80 border-0"
            />
          </div>
        ) : (
          <pre className="p-4 rounded-control bg-surface-secondary/70 border border-border font-mono text-xs text-foreground whitespace-pre-wrap break-all leading-relaxed max-h-96 overflow-y-auto">
            {htmlBody}
          </pre>
        )}
      </div>
    </div>
  );
};
