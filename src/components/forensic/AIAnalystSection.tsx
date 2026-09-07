import React from 'react';
import type { AIAnalystAssessment } from '../../types/forensic';
import {
  Sparkles,
  Target,
  ShieldAlert,
  CheckCircle2,
  ListOrdered,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

interface AIAnalystSectionProps {
  aiAnalyst?: AIAnalystAssessment;
}

export const AIAnalystSection: React.FC<AIAnalystSectionProps> = ({ aiAnalyst }) => {
  if (!aiAnalyst || !aiAnalyst.available) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              AI Analyst Assessment
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-500">
            Section 12 Copilot
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start space-x-3 text-xs font-mono text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-slate-200 font-bold">
              AI analyst summary unavailable
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {aiAnalyst?.error || 'The LLM provider is currently offline or disabled in backend configuration. All deterministic forensic signals and scoring remain 100% active and uncompromised.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    summary,
    likely_attack_type,
    likely_objective,
    key_evidence = [],
    recommended_actions = [],
    limitations = [],
    provider,
    model
  } = aiAnalyst;

  const isHighRisk = likely_attack_type.toLowerCase().includes('phishing') ||
                     likely_attack_type.toLowerCase().includes('harvest') ||
                     likely_attack_type.toLowerCase().includes('bec') ||
                     likely_attack_type.toLowerCase().includes('malware');

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-cyan-950/20 p-6 backdrop-blur-xl shadow-xl space-y-6 transition-all">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                AI ANALYST ASSISTANT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                {model || provider || 'LLM Synthesis'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans text-slate-100 tracking-tight">
              Executive Threat Assessment
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wide border ${
            isHighRisk
              ? 'bg-rose-950/70 border-rose-800/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          }`}>
            {likely_attack_type}
          </span>
        </div>
      </div>

      {/* Narrative Summary */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Forensic Summary</span>
        </div>
        <p className="text-xs sm:text-sm font-sans text-slate-200 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Two Column Grid: Attack Type & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Likely Attack Type */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Likely Attack Type</span>
          </div>
          <p className="text-xs font-mono text-slate-200 font-semibold">
            {likely_attack_type}
          </p>
        </div>

        {/* Likely Objective */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Likely Objective</span>
          </div>
          <p className="text-xs font-mono text-slate-200">
            {likely_objective}
          </p>
        </div>
      </div>

      {/* Key Evidence Corroboration */}
      {key_evidence.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Key Evidentiary Signals ({key_evidence.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {key_evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span className="text-xs font-mono text-slate-300 leading-relaxed">
                  {ev}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended SOC Actions */}
      {recommended_actions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ListOrdered className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Recommended SOC Response ({recommended_actions.length})
            </h3>
          </div>

          <div className="space-y-2">
            {recommended_actions.map((act, aIdx) => (
              <div
                key={aIdx}
                className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start space-x-3 hover:border-emerald-800/60 transition-colors"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 text-[11px] font-mono font-bold shrink-0">
                  {aIdx + 1}
                </div>
                <span className="text-xs font-mono text-slate-200 leading-relaxed">
                  {act}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytic Limitations & Boundaries */}
      {limitations.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/10 border border-amber-900/40 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Analytic Limitations &amp; Blindspots</span>
          </div>
          <ul className="space-y-1 pl-4 list-disc text-[11px] font-mono text-slate-400">
            {limitations.map((lim, lIdx) => (
              <li key={lIdx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Transparency / Non-Authoritative Disclaimer */}
      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-[11px] font-mono text-slate-500 flex items-start space-x-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-400">Analyst Advisory:</strong> The AI Analyst Assistant generates contextual narrative interpretations from structured evidence. It is not the source of truth and does not override deterministic SPF/DKIM/DMARC authentication or forensic network scoring.
        </span>
      </div>
    </div>
  );
};
