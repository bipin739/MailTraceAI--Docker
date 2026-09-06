import React from 'react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { Terminal, Shield } from 'lucide-react';

interface RawEmailTabProps {
  email: EmailAnalysis;
}

export const RawEmailTab: React.FC<RawEmailTabProps> = ({ email }) => {
  const rawEmail = email.raw_email || 'Raw email source unavailable.';

  const lines = rawEmail.split('\n');

  return (
    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            Raw EML Source Evidence ({lines.length} lines)
          </h3>
        </div>

        <CopyButton text={rawEmail} label="Copy Raw EML" />
      </div>

      <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Untransformed RFC-822 raw evidence text. Preserved for chain-of-custody inspection.
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40">
                <td className="text-slate-600 text-right pr-4 select-none w-10 text-[11px] align-top">
                  {idx + 1}
                </td>
                <td className="whitespace-pre-wrap break-all text-slate-300">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
